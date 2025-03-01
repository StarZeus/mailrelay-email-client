import { db } from '@/lib/db';
import { emails, processedEmails } from '@/lib/db/schema';
import { desc, eq, like, sql, inArray, isNull } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { webLogger } from '@/lib/logger';
import { parse } from 'node-html-parser';

const PAGE_SIZE = 20;

function htmlToJson(html: string) {
  try {
    const root = parse(html);
    const result: Record<string, any> = {};

    // Process form elements
    root.querySelectorAll('form').forEach((form, index) => {
      const formData: Record<string, any> = {
        id: form.getAttribute('id') || `form_${index}`,
        action: form.getAttribute('action'),
        method: form.getAttribute('method'),
        fields: {}
      };

      form.querySelectorAll('input, select, textarea').forEach(field => {
        const name = field.getAttribute('name') || field.getAttribute('id');
        if (name) {
          formData.fields[name] = {
            type: field.getAttribute('type') || field.tagName.toLowerCase(),
            value: field.getAttribute('value') || '',
            required: field.hasAttribute('required'),
            placeholder: field.getAttribute('placeholder')
          };
        }
      });

      result[formData.id] = formData;
    });

    // Process tables
    root.querySelectorAll('table').forEach((table, index) => {
      const tableData: Record<string, any> = {
        id: table.getAttribute('id') || `table_${index}`,
        headers: [],
        data: []
      };

      // Get headers first
      const headers: string[] = [];
      table.querySelectorAll('th').forEach(th => {
        const header = th.text.trim();
        headers.push(header);
        tableData.headers.push(header);
      });

      // If no headers found, try using first row as headers
      if (headers.length === 0) {
        const firstRow = table.querySelector('tr');
        if (firstRow) {
          firstRow.querySelectorAll('td').forEach(td => {
            const header = td.text.trim();
            headers.push(header);
            tableData.headers.push(header);
          });
        }
      }

      // Process rows into objects
      table.querySelectorAll('tr').forEach((tr, rowIndex) => {
        // Skip first row if we used it for headers
        if (headers.length === 0 || rowIndex > 0) {
          const cells = tr.querySelectorAll('td');
          if (cells.length > 0) {
            const rowData: Record<string, string> = {};
            cells.forEach((td, cellIndex) => {
              // Use header if available, otherwise use column_N
              const key = headers[cellIndex] || `column_${cellIndex + 1}`;
              rowData[key] = td.text.trim();
            });
            tableData.data.push(rowData);
          }
        }
      });

      result[tableData.id] = tableData;
    });

    // Process lists
    root.querySelectorAll('ul, ol').forEach((list, index) => {
      const listData: string[] = [];
      list.querySelectorAll('li').forEach(item => {
        listData.push(item.text.trim());
      });
      result[`list_${index}`] = listData;
    });

    // Process divs with IDs or classes
    root.querySelectorAll('div[id], div[class]').forEach(div => {
      const id = div.getAttribute('id') || div.getAttribute('class')?.replace(/\s+/g, '_');
      if (id) {
        result[id] = {
          text: div.text.trim(),
          html: div.innerHTML.trim()
        };
      }
    });

    // Process headings
    root.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((heading, index) => {
      const level = heading.tagName.toLowerCase();
      const id = heading.getAttribute('id') || `${level}_${index}`;
      result[id] = heading.text.trim();
    });

    // Process links
    root.querySelectorAll('a').forEach((link, index) => {
      const id = link.getAttribute('id') || `link_${index}`;
      result[id] = {
        text: link.text.trim(),
        href: link.getAttribute('href'),
        title: link.getAttribute('title')
      };
    });

    // Process images
    root.querySelectorAll('img').forEach((img, index) => {
      const id = img.getAttribute('id') || `image_${index}`;
      result[id] = {
        src: img.getAttribute('src'),
        alt: img.getAttribute('alt'),
        title: img.getAttribute('title')
      };
    });

    return result;
  } catch (error) {
    console.error('Error parsing HTML:', error);
    return null;
  }
}

export async function GET(request: Request) {
  const logger = webLogger.child({ route: '/api/emails' });
  
  try {
    logger.debug('Fetching emails from database');
    
    const { searchParams } = new URL(request.url);
    const emailId = searchParams.get('id');  
    const cursor = searchParams.get('cursor');
    const q = searchParams.get('q');
    const unprocessed = searchParams.get('unprocessed') === 'true';

    let baseQuery = db
      .select({
        id: emails.id,
        subject: emails.subject,
        body: emails.body,
        fromEmail: emails.fromEmail,
        toEmail: emails.toEmail,
        receivedAt: emails.sentDate,
        read: emails.read,
      })
      .from(emails);

    if (emailId) {
      const query = baseQuery.where(eq(emails.id, parseInt(emailId)));
      baseQuery = query as typeof baseQuery;
    }

    if (unprocessed) {
      // Left join with processedEmails to find emails that haven't been processed
      const joinedQuery = baseQuery
        .leftJoin(
          processedEmails,
          eq(emails.id, processedEmails.emailId)
        )
        .where(isNull(processedEmails.id));
      
      baseQuery = joinedQuery as typeof baseQuery;
    }

    // Add ordering and limit after the join
    const orderedQuery = baseQuery
      .orderBy(desc(emails.sentDate))
      .limit(PAGE_SIZE + 1);
    
    baseQuery = orderedQuery as typeof baseQuery;

    if (cursor) {
      const cursorQuery = baseQuery.where(
        sql`${emails.id} < ${parseInt(cursor)}`
      );
      baseQuery = cursorQuery as typeof baseQuery;
    }

    if (q) {
      const searchQuery = baseQuery.where(
        like(emails.subject, `%${q}%`)
      );
      baseQuery = searchQuery as typeof baseQuery;
    }

    const results = await baseQuery;
    
    // Process results to convert HTML body to JSON when possible
    const processedResults = results.map(email => ({
      ...email,
      bodyJson: email.body ? htmlToJson(email.body) : {body: email.body}
    }));

    logger.info({
      msg: 'Emails fetched successfully',
      count: results.length,
      unprocessed,
    });

    return NextResponse.json({
      emails: processedResults.slice(0, PAGE_SIZE),
      nextCursor: results.length > PAGE_SIZE ? results[PAGE_SIZE - 1].id : null
    });
  } catch (error) {
    logger.error({
      msg: 'Error fetching emails',
      error,
    });

    return NextResponse.json(
      { error: 'Failed to fetch emails' },
      { status: 500 }
    );
  }
}

// create patch route to update the email
export async function PATCH(request: Request) {
  const { id, read } = await request.json();
  await db.update(emails).set({ read }).where(eq(emails.id, id));
  return NextResponse.json({ message: 'Email updated' });
}

export async function POST(request: Request) {
  const logger = webLogger.child({ route: '/api/emails' });
  
  try {
    logger.debug('Processing email creation request');
    
    const body = await request.json();
    
    logger.trace({
      msg: 'Received email creation payload',
      body,
    });

    const [result] = await db
      .insert(emails)
      .values({
        fromEmail: body.fromEmail,
        toEmail: body.toEmail,
        subject: body.subject,
        body: body.body,
        sentDate: new Date(),
        read: false,
      })
      .returning();

    logger.info({
      msg: 'Email created successfully',
      emailId: result.id,
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error({
      msg: 'Error creating email',
      error,
    });

    return NextResponse.json(
      { error: 'Failed to create email' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const logger = webLogger.child({ route: '/api/emails', method: 'DELETE' });
  
  try {
    const { ids } = await request.json();
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: ids must be a non-empty array' },
        { status: 400 }
      );
    }

    logger.debug({ msg: 'Deleting emails', ids });

    // delete emails from processed emails table
    await db.delete(processedEmails).where(inArray(processedEmails.emailId, ids));

    await db.delete(emails).where(inArray(emails.id, ids));

    logger.info({ msg: 'Emails deleted successfully', count: ids.length });

    return NextResponse.json({ message: 'Emails deleted successfully' });
  } catch (error) {
    logger.error({ msg: 'Error deleting emails', error });

    return NextResponse.json(
      { error: 'Failed to delete emails' },
      { status: 500 }
    );
  }
}

import { db } from '@/lib/db';
import { emails,attachments, processedEmails } from '@/lib/db/schema';
import { desc, eq, like, sql, inArray, isNull } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { webLogger } from '@/lib/logger';
import { htmlToJson } from '@/lib/utils/html';

const PAGE_SIZE = 20;

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
      attachments: sql`JSON_AGG(JSON_BUILD_OBJECT('id', ${attachments.id}, 'fileName', ${attachments.filename}))`,
      })
      .from(emails)
      .leftJoin(attachments, eq(emails.id, attachments.emailId))
      .groupBy(emails.id);

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
    const mappedArray = results.map(email => {
      // Check if content appears to be HTML
      const isHtml = email.body?.toLowerCase().includes('<!doctype html') || 
                    email.body?.toLowerCase().includes('<html') ||
                    (email.body?.includes('<') && email.body?.includes('>') && 
                     (email.body?.includes('<div') || email.body?.includes('<p') || 
                      email.body?.includes('<table') || email.body?.includes('<a')));

      return {
        ...email,
        isHtml,
        bodyJson: email.body ? htmlToJson(email.body) : {body: email.body}
      };
    });

    logger.info({
      msg: 'Emails fetched successfully',
      count: results.length,
      unprocessed,
    });

    return NextResponse.json({
      emails: mappedArray.slice(0, PAGE_SIZE),
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

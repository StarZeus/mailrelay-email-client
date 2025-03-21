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
    const attachmentSchema = searchParams.get('attachmentSchema');
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

    let results = await baseQuery;

    if(attachmentSchema) {
      // Populate attachment schema for each email
      for (let i = 0; i < results.length; i++) {
        results[i] = await populateAttachmentSchema(results[i]);
      }
    }
    
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

async function populateAttachmentSchema(email: any) {
    if (Array.isArray(email.attachments) && email.attachments.length > 0) {
      for (const attachment of email.attachments) {
        attachment.id = attachment.id;
        attachment.fileName = attachment.fileName;
        attachment.schema = {};

        // When attachment type is csv, json, or excel, parse the content and return the schema
        if (attachment.fileName.endsWith('.csv') || attachment.fileName.endsWith('.json') || attachment.fileName.endsWith('.xlsx')) {
          // Read the attachment content from the table and parse it
          const attachmentResult = await db
            .select({ content: attachments.content })
            .from(attachments)
            .where(eq(attachments.id, attachment.id))
            .limit(1);

          if (!attachmentResult || attachmentResult.length === 0 || !attachmentResult[0].content) {
            attachment.schema = { error: 'Attachment content not found or invalid' };
            continue;
          }

          const attachmentContent = attachmentResult[0].content;

          // Convert bytea content to Buffer
          const buffer = Buffer.from(attachmentContent, 'hex');

          if (attachment.fileName.endsWith('.csv') || attachment.fileName.endsWith('.xlsx')) {
            // Get the first line of the CSV content and assume it's the header
            const lines = buffer.toString().split('\n');
            if (lines.length === 0 || !lines[0].trim()) {
              attachment.schema = { error: 'Unsupported attachment schema' };
              continue;
            }

            const firstLine = lines[0];
            const secondLine = lines.length > 1 ? lines[1] : null;

            const allFields = firstLine.split(',')
              .map(field => field.trim().replace(/[^a-zA-Z0-9]/g, '_'));
            const allValues = secondLine ? secondLine.split(',') : [];

            attachment.schema = allFields.reduce((schema, field, index) => {
              schema[field] = allValues.length > index ? allValues[index]?.trim() || '' : '';
              return schema;
            }, {});

            } else if (attachment.fileName.endsWith('.json')) {
              // Get the first row of the JSON content
              const jsonDocument = JSON.parse(buffer.toString());
              if (Array.isArray(jsonDocument) && jsonDocument.length > 0) {
                attachment.schema = jsonDocument[0];
              } else if (typeof jsonDocument === 'object') {
                attachment.schema = jsonDocument;
              } else {
                attachment.schema = { error: 'Unsupported JSON attachment' };
              }
            }
          } else {
            attachment.schema = { error: 'Unsupported attachment' };
          }

          attachment.schema = leanJson(attachment.schema);
       }
    }
    return email;
}

function leanJson(obj) {
  if(Array.isArray(obj)){
    return obj.length > 0 ? leanJson(obj[0]) : [];
  }else if(typeof obj == 'object') {
    // Make the object lean by keeping only the first item of an array, if it's an array
    // keep only the first 20 characters of a string
    // and recursively call leanJson on the object
    const newObj = {};
    for (const key in obj) {
      if (Array.isArray(obj[key])) {
        newObj[key] = obj[key].length > 0 ? leanJson(obj[key][0]) : [];
      } else if (typeof obj[key] === 'string') {
        newObj[key] = obj[key].slice(0, 20);
      } else if (typeof obj[key] === 'object') {
        newObj[key] = leanJson(obj[key]);
      } else {
        newObj[key] = obj[key];
      }
    }
    return newObj;
  }else if(typeof obj === 'string'){
    return obj.slice(0, 20);  
  }else{
    return obj;
  }
}

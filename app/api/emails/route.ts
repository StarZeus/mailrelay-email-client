import { db } from '@/lib/db';
import { emails } from '@/lib/db/schema';
import { desc, eq, like, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { webLogger } from '@/lib/logger';

const PAGE_SIZE = 20;

export async function GET(request: Request) {
  const logger = webLogger.child({ route: '/api/emails' });
  
  try {
    logger.debug('Fetching emails from database');
    
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const q = searchParams.get('q');

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
      .from(emails)
      .orderBy(desc(emails.sentDate))
      .limit(PAGE_SIZE + 1);

    if (cursor) {
      baseQuery = baseQuery.where(
        sql`${emails.id} < ${parseInt(cursor)}`
      );
    }

    if (q) {
      baseQuery = baseQuery.where(
        like(emails.subject, `%${q}%`)
      );
    }

    const results = await baseQuery;
    
    logger.info({
      msg: 'Emails fetched successfully',
      count: results.length,
    });

    return NextResponse.json({
      emails: results.slice(0, PAGE_SIZE),
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

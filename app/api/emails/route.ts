import { db } from '@/lib/db';
import { emails } from '@/lib/db/schema';
import { desc, eq, like, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

const PAGE_SIZE = 20;

export async function GET(request: Request) {
  try {
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
        receivedAt: emails.receivedAt,
        read: emails.read,
      })
      .from(emails)
      .orderBy(desc(emails.receivedAt))
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
    
    return NextResponse.json({
      emails: results.slice(0, PAGE_SIZE),
      nextCursor: results.length > PAGE_SIZE ? results[PAGE_SIZE - 1].id : null
    });

  } catch (error) {
    console.error('Error fetching emails:', error);
    return NextResponse.json({ emails: [], nextCursor: null });
  }
} 
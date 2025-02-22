import { db } from '@/lib/db';
import { processedEmails, filterRules, emails, users } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { webLogger } from '@/lib/logger';

export async function GET(request: Request) {
  const logger = webLogger.child({ route: '/api/processed-emails' });
  
  try {
    logger.info('Fetching processed emails from database');
    
    const results = await db
      .select({
        id: processedEmails.id,
        emailId: processedEmails.emailId,
        ruleName: filterRules.name,
        status: processedEmails.status,
        processedAt: processedEmails.processedAt,
        email: {
          subject: emails.subject,
          body: emails.body,
          fromEmail: emails.fromEmail,
          toEmail: emails.toEmail,
          sentDate: emails.sentDate,
        },
      })
      .from(processedEmails)
      .innerJoin(filterRules, eq(processedEmails.ruleId, filterRules.id))
      .innerJoin(emails, eq(processedEmails.emailId, emails.id))
      .orderBy(desc(processedEmails.processedAt));

    logger.info({
      msg: 'Processed emails fetched successfully',
      count: results.length,
    });

    return NextResponse.json({ emails: results });
  } catch (error) {
    logger.error({
      msg: 'Error fetching processed emails',
      error,
    });

    return NextResponse.json(
      { error: 'Failed to fetch processed emails' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const logger = webLogger.child({ route: '/api/processed-emails' });
  
  try {
    logger.info('Processing new email');
    
    const body = await request.json();
    logger.debug({ msg: 'Received email payload', body });

    const [result] = await db
      .insert(processedEmails)
      .values(body)
      .returning();

    logger.info({
      msg: 'Email processed successfully',
      emailId: result.id,
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error({
      msg: 'Error processing email',
      error,
    });

    return NextResponse.json(
      { error: 'Failed to process email' },
      { status: 500 }
    );
  }
} 
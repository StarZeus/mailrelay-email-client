import { db } from '@/lib/db';
import { processedEmails, filterRules, emails, users } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
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

    return NextResponse.json({ emails: results });
  } catch (error) {
    console.error('Error fetching processed emails:', error);
    return NextResponse.json(
      { error: 'Failed to fetch processed emails' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { filterRules, processedEmails, emails, users } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const results = await db
      .select({
        ruleId: filterRules.id,
        ruleName: filterRules.name,
        emailId: emails.id,
        subject: emails.subject,
        body: emails.body,
        status: processedEmails.status,
        error: processedEmails.error,
        processedAt: processedEmails.processedAt,
        fromEmail: users.email,
      })
      .from(processedEmails)
      .innerJoin(filterRules, eq(processedEmails.ruleId, filterRules.id))
      .innerJoin(emails, eq(processedEmails.emailId, emails.id))
      .innerJoin(users, eq(emails.senderId, users.id))
      .orderBy(desc(processedEmails.processedAt));

    // Group by rules
    const groupedResults = results.reduce((acc, item) => {
      const ruleId = item.ruleId;
      if (!acc[ruleId]) {
        acc[ruleId] = {
          id: ruleId,
          name: item.ruleName,
          emails: [],
        };
      }
      acc[ruleId].emails.push({
        id: item.emailId,
        subject: item.subject,
        body: item.body,
        status: item.status,
        error: item.error,
        processedAt: item.processedAt,
        fromEmail: item.fromEmail,
      });
      return acc;
    }, {} as Record<number, any>);

    return NextResponse.json(Object.values(groupedResults));
  } catch (error) {
    console.error('Error fetching processed emails:', error);
    return NextResponse.json(
      { error: 'Failed to fetch processed emails' },
      { status: 500 }
    );
  }
} 
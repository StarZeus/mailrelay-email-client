import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { filterRules, filterActions, processedEmails, emails } from '@/lib/db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { processEmailWithRules } from '@/lib/smtp/rules-processor';

const ruleSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1).optional(),
  fromPattern: z.string().optional(),
  toPattern: z.string().optional(),
  subjectPattern: z.string().optional(),
  operator: z.enum(['AND', 'OR']).default('AND').optional(),
  enabled: z.boolean().optional(),
  actions: z.array(z.object({
    id: z.number().optional(),
    ruleId: z.number(),
    type: z.enum(['forward', 'webhook', 'kafka', 'javascript', 'email-relay']),
    config: z.record(z.any()),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional()
  })).optional(),
});

export async function GET() {
  try {
    const rules = await db
      .select()
      .from(filterRules)
      .orderBy(filterRules.id);

    const actions = await db
      .select() 
      .from(filterActions)
      .orderBy(filterActions.order);

    const rulesWithActions = rules.map(rule => {
      const actionsForRule = actions.filter(action => action.ruleId === rule.id);
      return {
        ...rule,
        actions: actionsForRule
      };
    });

    return NextResponse.json(rulesWithActions);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch filter rules' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { action, ruleId, ...data } = await request.json();

    if (action === 'run') {
      // Get the rule
      const [rule] = await db
        .select()
        .from(filterRules)
        .where(eq(filterRules.id, ruleId));

      if (!rule) {
        return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
      }

      if (!rule.enabled) {
        return NextResponse.json({ error: 'Rule is disabled' }, { status: 400 });
      }

      // Get unprocessed emails
      const unprocessedEmails = await db
        .select({
          id: emails.id,
          fromEmail: emails.fromEmail,
          toEmail: emails.toEmail,
          subject: emails.subject,
          body: emails.body,
          sentDate: emails.sentDate,
          read: emails.read,
        })
        .from(emails)
        .leftJoin(
          processedEmails,
          and(
            eq(emails.id, processedEmails.emailId),
            eq(processedEmails.ruleId, ruleId)
          )
        )
        .where(isNull(processedEmails.id));

      // Process each email with the rule
      let processedCount = 0;
      for (const email of unprocessedEmails) {
        try {
          const matchedRules = await processEmailWithRules({
            ...email,
            sentDate: email.sentDate instanceof Date ? email.sentDate : new Date(email.sentDate || Date.now()),
            read: email.read === null ? false : email.read,
          }, ruleId);
          // Only increment count if the rule actually matched and processed the email
          if (matchedRules.length > 0) {
            processedCount++;
          }
        } catch (error) {
          console.error('Error processing email:', error);
        }
      }

      return NextResponse.json({ 
        success: true, 
        processedCount,
        message: processedCount > 0 
          ? `Processed ${processedCount} emails with rule "${rule.name}"`
          : `No emails matched the conditions for rule "${rule.name}"`
      });
    }

    // Handle create rule action
    const validatedData = ruleSchema.parse(data);

    const [rule] = await db
      .insert(filterRules)
      .values({
        name: validatedData.name || '',
        fromPattern: validatedData.fromPattern,
        toPattern: validatedData.toPattern,
        subjectPattern: validatedData.subjectPattern,
        operator: validatedData.operator,
        enabled: validatedData.enabled ?? true,
      })
      .returning();

    if (validatedData.actions?.length) {
      await db.insert(filterActions).values(
        validatedData.actions.map((action) => ({
          ruleId: rule.id,
          type: action.type,
          order: action.order,
          config: action.config,
        }))
      );
    }

    return NextResponse.json(rule);
  } catch (error) {
    console.error('Error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    const validatedData = ruleSchema.parse(updateData);

    const [rule] = await db
      .update(filterRules)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(filterRules.id, id))
      .returning();

    if (validatedData.actions) {
      await insertOrUpdateActions(id, validatedData.actions);
    }

    return NextResponse.json(rule);
  } catch (error) {
    console.error('Error updating filter rule:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update filter rule' },
      { status: 500 }
    );
  }
}

async function insertOrUpdateActions(ruleId: number, actions: any[]) {
  if (!actions?.length) return;

  // Use Promise.all to handle async operations properly
  await Promise.all(actions.map(async (action) => {
    if (action.id > 0) {
      return db
        .update(filterActions)
        .set({
          type: action.type,
          order: action.order,
          config: action.config,
        })
        .where(and(eq(filterActions.id, action.id), eq(filterActions.ruleId, ruleId)));
    } else {
      return db
        .insert(filterActions)
        .values({
          ruleId: ruleId,
          type: action.type,
          order: action.order,
          config: action.config,
        });
    }
  }));
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Rule ID is required' },
        { status: 400 }
      );
    }

    // Delete associated actions first
    await db
      .delete(filterActions)
      .where(eq(filterActions.ruleId, parseInt(id)));

    // Delete the rule
    await db
      .delete(filterRules)
      .where(eq(filterRules.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting filter rule:', error);
    return NextResponse.json(
      { error: 'Failed to delete filter rule' },
      { status: 500 }
    );
  }
}

export async function deleteActions(ruleId: number, actionId: number) {
  // Delete all actions for the rule and cascade delete processed emails

  try {
    await db
      .delete(processedEmails)
      .where(eq(processedEmails.actionId, actionId));

    await db
      .delete(filterActions)
      .where(and(eq(filterActions.ruleId, ruleId), eq(filterActions.id, actionId)));
  } catch (error) {
    console.error('Error deleting actions:', error);
    return NextResponse.json(
      { error: 'Failed to delete actions' },
      { status: 500 }
    );
  }
}
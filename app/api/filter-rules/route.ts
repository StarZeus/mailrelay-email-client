import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { filterRules, filterActions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const ruleSchema = z.object({
  name: z.string().min(1),
  fromPattern: z.string().optional(),
  toPattern: z.string().optional(),
  subjectPattern: z.string().optional(),
  operator: z.enum(['AND', 'OR']).default('AND'),
  actions: z.array(z.object({
    type: z.enum(['forward', 'webhook', 'kafka', 'javascript']),
    config: z.record(z.any()),
  })).optional(),
});

export async function GET() {
  try {
    const rules = await db
      .select()
      .from(filterRules)
      .orderBy(filterRules.id);
    
    return NextResponse.json(rules);
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
    const body = await request.json();
    const validatedData = ruleSchema.parse(body);

    const [rule] = await db
      .insert(filterRules)
      .values({
        name: validatedData.name,
        fromPattern: validatedData.fromPattern,
        toPattern: validatedData.toPattern,
        subjectPattern: validatedData.subjectPattern,
        operator: validatedData.operator,
      })
      .returning();

    if (validatedData.actions?.length) {
      await db.insert(filterActions).values(
        validatedData.actions.map((action) => ({
          ruleId: rule.id,
          type: action.type,
          config: action.config,
        }))
      );
    }

    return NextResponse.json(rule);
  } catch (error) {
    console.error('Error creating filter rule:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create filter rule' },
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
      // Delete existing actions
      await db
        .delete(filterActions)
        .where(eq(filterActions.ruleId, id));

      // Insert new actions
      if (validatedData.actions.length > 0) {
        await db.insert(filterActions).values(
          validatedData.actions.map((action) => ({
            ruleId: rule.id,
            type: action.type,
            config: action.config,
          }))
        );
      }
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
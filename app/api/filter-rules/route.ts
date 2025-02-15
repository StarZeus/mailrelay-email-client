import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { filterRules, filterActions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const rules = await db
      .select()
      .from(filterRules)
      .orderBy(filterRules.priority);
    
    return NextResponse.json(rules);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch filter rules' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const [rule] = await db
      .insert(filterRules)
      .values({
        name: body.name,
        fromPattern: body.fromPattern,
        toPattern: body.toPattern,
        subjectPattern: body.subjectPattern,
        bodyPattern: body.bodyPattern,
        priority: body.priority || 0,
      })
      .returning();

    if (body.actions) {
      await db.insert(filterActions).values(
        body.actions.map((action: any) => ({
          ruleId: rule.id,
          actionType: action.type,
          config: action.config,
        }))
      );
    }

    return NextResponse.json(rule);
  } catch (error) {
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

    const [rule] = await db
      .update(filterRules)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(filterRules.id, id))
      .returning();

    if (body.actions) {
      // Delete existing actions
      await db
        .delete(filterActions)
        .where(eq(filterActions.ruleId, id));

      // Insert new actions
      await db.insert(filterActions).values(
        body.actions.map((action: any) => ({
          ruleId: rule.id,
          actionType: action.type,
          config: action.config,
        }))
      );
    }

    return NextResponse.json(rule);
  } catch (error) {
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
    return NextResponse.json(
      { error: 'Failed to delete filter rule' },
      { status: 500 }
    );
  }
} 
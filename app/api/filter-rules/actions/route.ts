import { db } from '@/lib/db';
import { filterActions, processedEmails } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get('ruleId');
    const actionId = searchParams.get('actionId');

    if (!ruleId || !actionId) {
      return NextResponse.json(
        { error: 'Missing ruleId or actionId' },
        { status: 400 }
      );
    }

    // First delete all processed emails for this action
    await db.transaction(async (tx) => {
      await tx
        .delete(processedEmails)
        .where(eq(processedEmails.actionId, parseInt(actionId)));

      // Then delete the action
      await tx
        .delete(filterActions)
        .where(
          and(
            eq(filterActions.ruleId, parseInt(ruleId)),
            eq(filterActions.id, parseInt(actionId))
          )
        );
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting action:', error);
    return NextResponse.json(
      { error: 'Failed to delete action' },
      { status: 500 }
    );
  }
} 
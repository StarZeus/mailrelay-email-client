import { db } from '@/lib/db';
import { attachments } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { webLogger } from '@/lib/logger';

const PAGE_SIZE = 20;

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const logger = webLogger.child({ route: '/api/attachments' });
  
  try {
    const {id: attachmentId} = await context.params; // Extract the ID from the route parameters
    logger.info('Fetching attachments from database', { attachmentId });

    if (!attachmentId || isNaN(Number(attachmentId))) {
      return NextResponse.json({ error: 'Invalid attachment ID' }, { status: 400 });
    }

    let baseQuery = db
      .select({
        id: attachments.id,
        emailId: attachments.emailId,
        filename: attachments.filename,
        contentType: attachments.contentType,
        size: attachments.size,
        createdAt: attachments.createdAt,
        content: attachments.content,
      })
      .from(attachments)
      .where(eq(attachments.id, Number(attachmentId))); // Use eq for exact match

    // Fetch the attachment
    const result = await baseQuery;
    const attachment = result[0];

    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    if (!attachment.content) {
      return NextResponse.json({ error: 'Attachment content not found' }, { status: 404 });
    }

    // Convert bytea content to Buffer
    const buffer = Buffer.from(attachment.content, 'hex');

    return new Response(buffer, {
      headers: {
        'Content-Disposition': `attachment; filename="${attachment.filename}"`,
        'Content-Type': attachment.contentType,
      },
    });

  } catch (error) {
    logger.error({
      msg: 'Error fetching attachments',
      error,
    });

    return NextResponse.json(
      { error: 'Failed to fetch attachments' },
      { status: 500 }
    );
  }
}
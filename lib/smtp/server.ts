import { SMTPServer } from 'smtp-server';
import { simpleParser } from 'mailparser';
import { db } from '../db/drizzle';
import { emails, threads, folders, threadFolders, users, filterRules, filterActions, processedEmails } from '../db/schema';
import { eq } from 'drizzle-orm';
import { processEmailWithRules } from './rules-processor';

const server = new SMTPServer({
  secure: false,
  authOptional: true,
  disabledCommands: ['STARTTLS'],

  async onData(stream, session, callback) {
    try {
      const parsed = await simpleParser(stream);
      
      // Create or get recipient user
      let [recipient] = await db
        .select()
        .from(users)
        .where(eq(users.email, parsed.to?.text || ''));

      if (!recipient) {
        [recipient] = await db
          .insert(users)
          .values({ email: parsed.to?.text || '' })
          .returning();
      }

      // Create or get sender user
      let [sender] = await db
        .select()
        .from(users)
        .where(eq(users.email, parsed.from?.text || ''));

      if (!sender) {
        [sender] = await db
          .insert(users)
          .values({ email: parsed.from?.text || '' })
          .returning();
      }

      // Create thread
      const [thread] = await db
        .insert(threads)
        .values({
          subject: parsed.subject || '',
          lastActivityDate: new Date(),
        })
        .returning();

      // Create email
      const [email] = await db
        .insert(emails)
        .values({
          threadId: thread.id,
          senderId: sender.id,
          recipientId: recipient.id,
          subject: parsed.subject || '',
          body: parsed.text || parsed.html || '',
          sentDate: parsed.date || new Date(),
        })
        .returning();

      // Get inbox folder
      const [inboxFolder] = await db
        .select()
        .from(folders)
        .where(eq(folders.name, 'Inbox'));

      // Add to inbox folder
      await db
        .insert(threadFolders)
        .values({
          threadId: thread.id,
          folderId: inboxFolder.id,
        });

      // Process email with rules
      await processEmailWithRules(email);

      callback();
    } catch (err) {
      console.error('Error processing email:', err);
      callback(new Error('Error processing email'));
    }
  },
});

export function startSMTPServer(port: number = 2525) {
  server.listen(port, () => {
    console.log(`SMTP Server listening on port ${port}`);
  });
}

export function stopSMTPServer() {
  server.close();
} 
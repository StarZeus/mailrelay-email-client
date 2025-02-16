import { SMTPServer } from 'smtp-server';
import { simpleParser } from 'mailparser';
import { db } from './db';
import { emails, users } from './db/schema';
import { eq } from 'drizzle-orm';

interface SMTPServerConfig {
  port: number;
  host?: string;
  secure?: boolean;
  authOptional?: boolean;
}

export class EmailServer {
  private server: SMTPServer;
  private config: SMTPServerConfig;

  constructor(config: SMTPServerConfig) {
    this.config = config;
    this.server = new SMTPServer({
      authOptional: config.authOptional ?? true,
      secure: config.secure ?? false,
      disabledCommands: ['STARTTLS'],
      onData: this.handleEmail.bind(this),
      onAuth: this.handleAuth.bind(this),
    });
  }

  private async handleEmail(stream: any, session: any, callback: Function) {
    try {
      // Parse email from stream
      const email = await simpleParser(stream);
      
      // Get or create sender
      const fromEmail = email.from?.value?.[0]?.address || '';
      let [sender] = await db
        .select()
        .from(users)
        .where(eq(users.email, fromEmail))
        .limit(1);

      if (!sender) {
        [sender] = await db
          .insert(users)
          .values({
            email: fromEmail,
            firstName: email.from?.value?.[0]?.name,
          })
          .returning();
      }

      // Get or create recipient
      const toEmail = email.to?.value?.[0]?.address || '';
      let [recipient] = await db
        .select()
        .from(users)
        .where(eq(users.email, toEmail))
        .limit(1);

      if (!recipient) {
        [recipient] = await db
          .insert(users)
          .values({
            email: toEmail,
            firstName: email.to?.value?.[0]?.name,
          })
          .returning();
      }

      // Store email in database
      await db
        .insert(emails)
        .values({
          subject: email.subject || '',
          body: email.text || email.html || '',
          senderId: sender.id,
          recipientId: recipient.id,
          sentDate: email.date || new Date(),
          read: false,
        });

      callback();
    } catch (error) {
      console.error('Error processing email:', error);
      callback(new Error('Error processing email'));
    }
  }

  private async handleAuth(auth: any, session: any, callback: Function) {
    // In this example, we're allowing all auth
    // You can implement proper auth here
    callback(null, { user: 123 });
  }

  public start() {
    this.server.listen(this.config.port, this.config.host || '0.0.0.0', () => {
      console.log(`SMTP server running on port ${this.config.port}`);
    });
  }

  public stop() {
    this.server.close(() => {
      console.log('SMTP server stopped');
    });
  }
} 
import { SMTPServer } from 'smtp-server';
import { simpleParser } from 'mailparser';
import { db } from '../db';
import { emails, attachments } from '../db/schema';

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
      
      // Store email in database and get the ID
      const [savedEmail] = await db
        .insert(emails)
        .values({
          fromEmail: email.from?.value?.[0]?.address || '',
          toEmail: Array.isArray(email.to) ? email.to.map((to: any) => to.value).join(',') : email.to?.value || '',
          subject: email.subject || '',
          body: email.html || email.textAsHtml || email.text || '',
          sentDate: email.date || new Date(),
          read: false,
        })
        .returning();

      // Handle attachments if present
      if (email.attachments && email.attachments.length > 0) {
        const attachmentValues = email.attachments.map(attachment => ({
          emailId: savedEmail.id,
          filename: attachment.filename || 'unnamed',
          contentType: attachment.contentType || 'application/octet-stream',
          size: attachment.size || 0,
          content: attachment.content.toString('hex'),
        }));

        // Store attachments in database
        await db.insert(attachments).values(attachmentValues);
      }

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
    return this.server.listen(this.config.port, this.config.host || '0.0.0.0', () => {
      console.log(`> SMTP server URL: http://${this.config.host || 'localhost'}:${this.config.port}`);
    });
  }

  public stop() {
    this.server.close(() => {
      console.log('SMTP server stopped');
    });
  }
} 
import { SMTPServer } from 'smtp-server';
import { simpleParser } from 'mailparser';
import { db } from '../db';
import { emails, attachments } from '../db/schema';
import { processEmailWithRules } from './rules-processor';
import { smtpLogger } from '../logger';

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
    smtpLogger.info({ msg: 'Initializing SMTP server', config });
    
    this.server = new SMTPServer({
      authOptional: config.authOptional ?? true,
      secure: config.secure ?? false,
      disabledCommands: ['STARTTLS'],
      onData: this.handleEmail.bind(this),
      onAuth: this.handleAuth.bind(this),
      logger: true,
    });

    this.server.on('error', (err) => {
      smtpLogger.error({ msg: 'SMTP server error', error: err });
    });
  }

  private async handleEmail(stream: any, session: any, callback: Function) {
    const sessionLogger = smtpLogger.child({ sessionId: session.id });
    try {
      sessionLogger.debug({ msg: 'Processing incoming email', session });
      
      const email = await simpleParser(stream);
      sessionLogger.trace({ msg: 'Email parsed', emailId: email.messageId });

      // Process email and store in database
      const result = await processEmailWithRules(email);
      
      sessionLogger.info({
        msg: 'Email processed successfully',
        emailId: email.messageId,
        result,
      });

      callback();
    } catch (error) {
      sessionLogger.error({
        msg: 'Error processing email',
        error,
        session,
      });
      callback(error);
    }
  }

  private handleAuth(auth: any, session: any, callback: Function) {
    const sessionLogger = smtpLogger.child({ sessionId: session.id });
    sessionLogger.debug({
      msg: 'Auth attempt',
      username: auth.username,
      session,
    });
    
    // For now, accept all auth
    callback(null, { user: auth.username });
  }

  public async start() {
    try {
      this.server.listen(this.config.port, this.config.host);
      smtpLogger.info({
        msg: 'SMTP server started',
        port: this.config.port,
        host: this.config.host,
      });
    } catch (error) {
      smtpLogger.error({
        msg: 'Failed to start SMTP server',
        error,
        config: this.config,
      });
      throw error;
    }
  }

  public stop() {
    smtpLogger.info({ msg: 'Stopping SMTP server' });
    this.server.close();
  }
} 
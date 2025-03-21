import { SMTPServer } from 'smtp-server';
import { ParsedMail, simpleParser } from 'mailparser';
import { db } from '../db';
import { emails, attachments } from '../db/schema';
import { processEmailWithRules } from './rules-processor';
import { smtpLogger } from '../logger';
import { SMTPServerConfig } from '@/types/common';
import * as csvParser from 'csv-parser';
import * as xlsx from 'xlsx';

export class EmailServer {
  private server: SMTPServer;
  private config: SMTPServerConfig;

  constructor(config: SMTPServerConfig) {
    this.config = config;
    smtpLogger.info({ msg: 'Initializing SMTP server', config });
    
    this.server = new SMTPServer({
      authOptional: config.authOptional ?? true,
      secure: config.secure ?? false,
      disabledCommands: ['STARTTLS', 'AUTH'],
      onData: this.handleEmail.bind(this),
      onAuth: this.handleAuth.bind(this),
    });

    this.server.on('error', (err) => {
      smtpLogger.error({ msg: 'SMTP server error', error: err });
    });
  }

  private async handleEmail(stream: any, session: any, callback: Function) {
    const sessionLogger = smtpLogger.child({ sessionId: session.id });
    try {
      sessionLogger.debug({ msg: 'Processing incoming email', session });
      
      let rawEmail = '';
      stream.on('data', (chunk: Buffer) => {
        rawEmail += chunk;
      });

      await new Promise((resolve, reject) => {
        stream.on('end', resolve);
        stream.on('error', reject);
      });

      const email: ParsedMail = await simpleParser(rawEmail);
      sessionLogger.trace({ msg: 'Email parsed', emailId: email.messageId });

      // Detect if the email is HTML
      const isHtml = email.html !== false;
      const emailBody = isHtml ? email.html : email.text;

      // Store email and attachments in database
      const emailRecord = await db.insert(emails).values({
        fromEmail: email.from?.text || '',
        toEmail: Array.isArray(email.to) ? email.to.map(t => t.text).join(', ') : email.to?.text || '',
        subject: email.subject || '',
        body: emailBody || '',
        isHtml: isHtml,
        sentDate: new Date(),
        read: false
      }).returning();

      sessionLogger.trace({ msg: 'Email added', emailId: email.messageId });

      let attachmentData:{fileName:string,data:Buffer<ArrayBufferLike>}[] = undefined;

      // Insert attachments if provided
      if (Array.isArray(email.attachments) && email.attachments.length > 0) {
        const attachmentInserts = email.attachments.map((attachment,index) => ({
          emailId: emailRecord[0].id,
          filename: attachment.filename || `file-${index}`,
          contentType: attachment.contentType,
          size: attachment.size,
          content: Buffer.isBuffer(attachment.content) ? attachment.content.toString('hex') : Buffer.from(attachment.content).toString('hex'), // Convert Buffer to hex string
        }));

        await db.insert(attachments).values(attachmentInserts);

        attachmentData = email.attachments.map((attachment, index) => ({
          fileName: attachment.filename || `file-${index}`,
          data: attachment.content
        }));

        sessionLogger.info({
          msg: 'Attachments added successfully',
          emailId: emailRecord[0].id,
          attachmentCount: attachmentInserts.length,
        });
      }

      // Process email and store in database
      const result = await processEmailWithRules({
        id: emailRecord[0].id,
        fromEmail: emailRecord[0].fromEmail,
        toEmail: emailRecord[0].toEmail,
        subject: emailRecord[0].subject,
        body: emailRecord[0].body,
        bodyJson: {},
        isHtml: false,
        sentDate: emailRecord[0].sentDate || new Date(),
        read: emailRecord[0].read || false,
        attachments: Array.isArray(attachmentData) ? this.parseAttachmentsToJson(attachmentData) : [],
      }, -999, false);
      

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

  private async parseAttachmentsToJson(attachmentData: { fileName: string; data: Buffer }[]): Promise<{ fileName: string; data: any[] }[]> {
    const parsedData = [];

    for (const attachment of attachmentData) {
      const { fileName, data } = attachment;
      const fileExtension = fileName.split('.').pop()?.toLowerCase();

      if (fileExtension === 'csv') {
        const csvData = [];
        const stream = data.toString('utf-8');
        await new Promise((resolve, reject) => {
          const parser = csvParser();
          parser.on('data', (row) => csvData.push(row));
          parser.on('end', resolve);
          parser.on('error', reject);
          stream.split('\n').forEach((line) => parser.write(line));
          parser.end();
        });
        parsedData.push({ fileName, data: csvData });
      } else if (fileExtension === 'xlsx') {
        const workbook = xlsx.read(data, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(sheet);
        parsedData.push({ fileName, data: jsonData });
      } else if (fileExtension === 'json') {
        const jsonData = JSON.parse(data.toString('utf-8'));
        parsedData.push({ fileName, data: Array.isArray(jsonData) ? jsonData : [jsonData] });
      } else {
        parsedData.push({ fileName, data: [] }); // Unsupported file type
      }
    }

    return parsedData;
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
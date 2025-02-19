import { db } from '../db/drizzle';
import { filterRules, filterActions, processedEmails, emails, attachments } from '../db/schema';
import { eq } from 'drizzle-orm';
import nodemailer from 'nodemailer';
import { Kafka } from 'kafkajs';
import { VM } from 'vm2';

interface Email {
  id: number;
  fromEmail: string;
  toEmail: string;
  subject: string | null;
  body: string | null;
  sentDate: Date;
  read: boolean;
}

async function processEmailWithRules(email: Email) {
  // Get all enabled rules ordered by priority
  const rules = await db
    .select()
    .from(filterRules)
    .where(eq(filterRules.enabled, true))
    .orderBy(filterRules.createdAt);

  for (const rule of rules) {
    // Check if email matches rule patterns
    if (await matchesRule(email, rule)) {
      // Get actions for this rule
      const actions = await db
        .select()
        .from(filterActions)
        .where(eq(filterActions.ruleId, rule.id));

      // Process each action
      for (const action of actions) {
        try {
          await processAction(email, action);
          
          // Record successful processing
          await db.insert(processedEmails).values({
            emailId: email.id,
            ruleId: rule.id,
            actionId: action.id,
            status: 'success',
            processedAt: new Date(),
          });
        } catch (error) {
          // Record failed processing
          await db.insert(processedEmails).values({
            emailId: email.id,
            ruleId: rule.id,
            actionId: action.id,
            status: 'failed',
            error: error instanceof Error ? error.message : String(error),
            processedAt: new Date(),
          });
        }
      }
    }
  }
}

async function matchesRule(email: Email, rule: typeof filterRules.$inferSelect) {
  const matchPatterns = {
    fromPattern: () => {
      if (!rule.fromPattern) return true;
      return new RegExp(rule.fromPattern).test(email.fromEmail);
    },
    toPattern: () => {
      if (!rule.toPattern) return true;
      return new RegExp(rule.toPattern).test(email.toEmail);
    },
    subjectPattern: () => {
      if (!rule.subjectPattern) return true;
      return new RegExp(rule.subjectPattern).test(email.subject || '');
    }
  };

  const results = await Promise.all(
    Object.values(matchPatterns).map(pattern => pattern())
  );

  return rule.operator === 'OR' 
    ? results.some(result => result)
    : results.every(result => result);
}

async function processAction(email: Email, action: typeof filterActions.$inferSelect) {
  const config = action.config as Record<string, any>;

  switch (action.type) {
    case 'forward':
      await forwardEmail(email, config.forwardTo);
      break;
    case 'webhook':
      await callWebhook(email, config.url, config.method || 'POST');
      break;
    case 'kafka':
      await sendToKafka(email, config.topic, config.brokers);
      break;
    case 'javascript':
      await runJavaScript(email, config.code);
      break;
    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
}

async function forwardEmail(email: Email, forwardTo: string) {
  // Get attachments for this email
  const emailAttachments = await db
    .select()
    .from(attachments)
    .where(eq(attachments.emailId, email.id));

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: forwardTo,
    subject: email.subject || '',
    text: email.body || '',
    attachments: emailAttachments.map(att => ({
      filename: att.filename,
      content: Buffer.from(att.content, 'hex'),
      contentType: att.contentType,
    })),
  });
}

async function callWebhook(email: Email, url: string, method: string) {
  const emailAttachments = await db
    .select()
    .from(attachments)
    .where(eq(attachments.emailId, email.id));

    //Replace the axios call with fetch
    await fetch(url, {
        method,
        body: JSON.stringify({
            id: email.id,
            fromEmail: email.fromEmail,
            toEmail: email.toEmail,
            subject: email.subject,
            body: email.body,
            sentDate: email.sentDate,
            attachments: emailAttachments.map(att => ({
                filename: att.filename,
                contentType: att.contentType,
                size: att.size,
            })),
        }),
    });
}

async function sendToKafka(email: Email, topic: string, brokers: string[]) {
  const kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID || 'email-processor',
    brokers,
  });

  const producer = kafka.producer();
  await producer.connect();

  const emailAttachments = await db
    .select()
    .from(attachments)
    .where(eq(attachments.emailId, email.id));

  await producer.send({
    topic,
    messages: [{
      key: email.id.toString(),
      value: JSON.stringify({
        id: email.id,
        fromEmail: email.fromEmail,
        toEmail: email.toEmail,
        subject: email.subject,
        body: email.body,
        sentDate: email.sentDate,
        attachments: emailAttachments.map(att => ({
          filename: att.filename,
          contentType: att.contentType,
          size: att.size,
        })),
      }),
    }],
  });

  await producer.disconnect();
}

async function runJavaScript(email: Email, code: string) {
  const vm = new VM({
    timeout: 5000,
    sandbox: {
      email: {
        id: email.id,
        fromEmail: email.fromEmail,
        toEmail: email.toEmail,
        subject: email.subject,
        body: email.body,
        sentDate: email.sentDate,
      },
      console: {
        log: console.log,
        error: console.error,
      },
    },
  });

  return vm.run(code);
}

export { processEmailWithRules }; 
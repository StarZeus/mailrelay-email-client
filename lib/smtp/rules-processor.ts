import { db } from '../db/drizzle';
import { filterRules, filterActions, processedEmails, emails } from '../db/schema';
import { eq } from 'drizzle-orm';
import nodemailer from 'nodemailer';
import { Kafka } from 'kafkajs';
import axios from 'axios';
import { VM } from 'vm2';

interface Email {
  id: number;
  threadId: number;
  senderId: number;
  recipientId: number;
  subject: string;
  body: string;
  sentDate: Date;
}

async function processEmailWithRules(email: Email) {
  // Get all enabled rules ordered by priority
  const rules = await db
    .select()
    .from(filterRules)
    .where(eq(filterRules.isEnabled, true))
    .orderBy(filterRules.priority);

  for (const rule of rules) {
    // Check if email matches rule patterns
    if (await matchesRule(email, rule)) {
      // Get actions for this rule
      const actions = await db
        .select()
        .from(filterActions)
        .where(eq(filterActions.ruleId, rule.id))
        .where(eq(filterActions.isEnabled, true));

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
          });
        } catch (error) {
          // Record failed processing
          await db.insert(processedEmails).values({
            emailId: email.id,
            ruleId: rule.id,
            actionId: action.id,
            status: 'failed',
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
  }
}

async function matchesRule(email: Email, rule: typeof filterRules.$inferSelect) {
  const matchPatterns = {
    fromPattern: async () => {
      if (!rule.fromPattern) return true;
      const [sender] = await db
        .select()
        .from(emails)
        .where(eq(emails.id, email.id));
      return new RegExp(rule.fromPattern).test(sender.subject || '');
    },
    toPattern: async () => {
      if (!rule.toPattern) return true;
      const [recipient] = await db
        .select()
        .from(emails)
        .where(eq(emails.id, email.id));
      return new RegExp(rule.toPattern).test(recipient.subject || '');
    },
    subjectPattern: () => {
      if (!rule.subjectPattern) return true;
      return new RegExp(rule.subjectPattern).test(email.subject);
    },
    bodyPattern: () => {
      if (!rule.bodyPattern) return true;
      return new RegExp(rule.bodyPattern).test(email.body);
    },
  };

  const results = await Promise.all(
    Object.values(matchPatterns).map(pattern => pattern())
  );

  return results.every(result => result);
}

async function processAction(email: Email, action: typeof filterActions.$inferSelect) {
  const config = action.config as Record<string, any>;

  switch (action.actionType) {
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
      throw new Error(`Unknown action type: ${action.actionType}`);
  }
}

async function forwardEmail(email: Email, forwardTo: string) {
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
    subject: email.subject,
    text: email.body,
  });
}

async function callWebhook(email: Email, url: string, method: string) {
  await axios({
    method,
    url,
    data: {
      id: email.id,
      subject: email.subject,
      body: email.body,
      sentDate: email.sentDate,
    },
  });
}

async function sendToKafka(email: Email, topic: string, brokers: string[]) {
  const kafka = new Kafka({
    clientId: 'email-processor',
    brokers,
  });

  const producer = kafka.producer();
  await producer.connect();

  await producer.send({
    topic,
    messages: [
      {
        value: JSON.stringify({
          id: email.id,
          subject: email.subject,
          body: email.body,
          sentDate: email.sentDate,
        }),
      },
    ],
  });

  await producer.disconnect();
}

async function runJavaScript(email: Email, code: string) {
  const vm = new VM({
    timeout: 5000,
    sandbox: {
      email: {
        id: email.id,
        subject: email.subject,
        body: email.body,
        sentDate: email.sentDate,
      },
    },
  });

  await vm.run(code);
}

export { processEmailWithRules }; 
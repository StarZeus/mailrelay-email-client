import { db } from '../db/drizzle';
import { filterRules, filterActions, processedEmails, emails, attachments } from '../db/schema';
import { eq } from 'drizzle-orm';
import nodemailer from 'nodemailer';
import { Kafka } from 'kafkajs';
import { VM } from 'vm2';
import micromatch from 'micromatch';

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
  // Get all enabled rules
  const rules = await db
    .select()
    .from(filterRules)
    .where(eq(filterRules.enabled, true));

  const matchedRules: typeof filterRules.$inferSelect[] = [];
  
  for (const rule of rules) {
    // Check if email matches rule patterns
    if (await matchesRule(email, rule)) {
      
      // Get actions for this rulef
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
  
  return matchedRules;
}

async function matchesRule(email: Email, rule: typeof filterRules.$inferSelect) {
  const matchPatterns = {
    fromPattern: () => {
      if (!rule.fromPattern) return true;
      return micromatch.isMatch(email.fromEmail, rule.fromPattern, { 
        nocase: true,
        dot: true 
      });
    },
    toPattern: () => {
      if (!rule.toPattern) return true;
      return micromatch.isMatch(email.toEmail, rule.toPattern, {
        nocase: true,
        dot: true
      });
    },
    subjectPattern: () => {
      if (!rule.subjectPattern) return true;
      // Support both glob patterns and regex patterns
      if (rule.subjectPattern.startsWith('/') && rule.subjectPattern.endsWith('/')) {
        // Regex pattern
        const pattern = rule.subjectPattern.slice(1, -1);
        return new RegExp(pattern, 'i').test(email.subject || '');
      } else {
        // Glob pattern
        return micromatch.isMatch(email.subject || '', rule.subjectPattern, {
          nocase: true,
          dot: true
        });
      }
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
  const maxRetries = 3;
  let lastError: Error | null = null;

  // Validate action config
  validateActionConfig(action.type, config);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      switch (action.type) {
        case 'forward':
          await forwardEmail(email, config.forwardTo);
          break;
        case 'webhook':
          await callWebhook(email, config.url, config.method || 'POST', attempt);
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
      // If successful, break the retry loop
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt === maxRetries) {
        throw new Error(`Action failed after ${maxRetries} attempts: ${lastError.message}`);
      }
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}

function validateActionConfig(type: string, config: Record<string, any>) {
  switch (type) {
    case 'forward':
      if (!config.forwardTo || typeof config.forwardTo !== 'string') {
        throw new Error('Forward action requires valid forwardTo email address');
      }
      break;
    case 'webhook':
      if (!config.url || typeof config.url !== 'string') {
        throw new Error('Webhook action requires valid URL');
      }
      if (config.method && !['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method)) {
        throw new Error('Invalid webhook method');
      }
      break;
    case 'kafka':
      if (!config.topic || typeof config.topic !== 'string') {
        throw new Error('Kafka action requires valid topic');
      }
      if (!Array.isArray(config.brokers) || !config.brokers.length) {
        throw new Error('Kafka action requires valid brokers array');
      }
      break;
    case 'javascript':
      if (!config.code || typeof config.code !== 'string') {
        throw new Error('JavaScript action requires valid code');
      }
      break;
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

async function callWebhook(email: Email, url: string, method: string, attempt: number) {
  const emailAttachments = await db
    .select()
    .from(attachments)
    .where(eq(attachments.emailId, email.id));

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Retry-Attempt': attempt.toString(),
    },
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

  if (!response.ok) {
    throw new Error(`Webhook failed with status ${response.status}: ${await response.text()}`);
  }
}

async function sendToKafka(email: Email, topic: string, brokers: string[]) {
  const kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID || 'email-processor',
    brokers,
    retry: {
      initialRetryTime: 100,
      retries: 3
    }
  });

  const producer = kafka.producer();
  await producer.connect();

  try {
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
  } finally {
    await producer.disconnect();
  }
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

  const result = await vm.run(code);
  if (result === false) {
    throw new Error('JavaScript action returned false');
  }
  return result;
}

export { processEmailWithRules }; 
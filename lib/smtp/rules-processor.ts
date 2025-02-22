import { db } from '../db/drizzle';
import { filterRules, filterActions, processedEmails, emails, attachments } from '../db/schema';
import { eq } from 'drizzle-orm';
import nodemailer from 'nodemailer';
import { Kafka } from 'kafkajs';
import micromatch from 'micromatch';
import { logger, smtpLogger } from '../logger';

interface Email {
  id: number;
  fromEmail: string;
  toEmail: string;
  subject: string | null;
  body: string | null;
  sentDate: Date;
  read: boolean;
}

async function processEmailWithRules(email: Email, specificRuleId?: number) {
  const logger = smtpLogger.child({ emailId: email.id });
  logger.info('Starting rule processing for email');

  // Get rules - either all enabled rules or just the specific rule
  const rules = await db
    .select()
    .from(filterRules)
    .where(
      specificRuleId 
        ? eq(filterRules.id, specificRuleId)
        : eq(filterRules.enabled, true)
    );

  const matchedRules: typeof filterRules.$inferSelect[] = [];
  
  for (const rule of rules) {
    // Skip disabled rules unless specifically requested
    if (!rule.enabled && !specificRuleId) continue;

    logger.debug({ msg: 'Checking rule', ruleId: rule.id });

    // Check if email matches rule patterns
    if (await matchesRule(email, rule)) {
      logger.info({ msg: 'Email matched rule', ruleId: rule.id });

      // Add the matched rule to the array
      matchedRules.push(rule);
      
      // Get actions for this rule
      const actions = await db
        .select()
        .from(filterActions)
        .where(eq(filterActions.ruleId, rule.id));

      // Process each action
      for (const action of actions) {
        try {
          logger.debug({ msg: 'Processing action', actionId: action.id });
          await processAction(email, action);
          
          // Record successful processing
          await db.insert(processedEmails).values({
            emailId: email.id,
            ruleId: rule.id,
            actionId: action.id,
            status: 'success',
            processedAt: new Date(),
          });
          logger.info({ msg: 'Action processed successfully', actionId: action.id });
        } catch (error) {
          logger.error({
            msg: 'Error processing action',
            actionId: action.id,
            error,
          });
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
  
  logger.info('Rule processing completed for email');
  return matchedRules;
}

async function matchesRule(email: Email, rule: typeof filterRules.$inferSelect) {
  // Get only the patterns that are specified
  const definedPatterns = {
    ...(rule.fromPattern ? {
      fromPattern: () => micromatch.isMatch(email.fromEmail, rule.fromPattern!, { 
        nocase: true, 
        dot: true 
      })
    } : {}),
    ...(rule.toPattern ? {
      toPattern: () => micromatch.isMatch(email.toEmail, rule.toPattern!, {
        nocase: true,
        dot: true
      })
    } : {}),
    ...(rule.subjectPattern ? {
      subjectPattern: () => {
        if (rule.subjectPattern!.startsWith('/') && rule.subjectPattern!.endsWith('/')) {
          const pattern = rule.subjectPattern!.slice(1, -1);
          return new RegExp(pattern, 'i').test(email.subject || '');
        } else {
          return micromatch.isMatch(email.subject || '', rule.subjectPattern!, {
            nocase: true,
            dot: true
          });
        }
      }
    } : {})
  };

  // If no patterns defined, rule shouldn't match
  if (Object.keys(definedPatterns).length === 0) {
    return false;
  }

  const results = await Promise.all(
    Object.values(definedPatterns).map(pattern => pattern())
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
  try {
    const emailAttachments = await db
      .select()
      .from(attachments)
    .where(eq(attachments.emailId, email.id));

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true'
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
  } catch (error) {
    logger.error({
      msg: 'Error forwarding email',
      error,
    });
  }
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
  logger.info({ msg: 'Sending email to Kafka YYYYY', topic, brokers });

  const kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID || 'email-processor',
    brokers,
    retry: {
      initialRetryTime: 100,
      retries: 1
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
  try {
    // Create a safe context with email data and allowed functions
    const context = {
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
      fetch: fetch,
      setTimeout: setTimeout,
      clearTimeout: clearTimeout,
      Promise: Promise
    };

    // Create async function using Function constructor
    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
    
    // Wrap the code in an async IIFE
    const wrappedCode = `
      return (async () => {
        try {
          with (context) {
            ${code}
          }
          return true;
        } catch (error) {
          console.error('Script error:', error);
          throw error;
        }
      })();
    `;

    const fn = new AsyncFunction('context', wrappedCode);

    // Execute with timeout protection
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('JavaScript execution timed out')), 5000);
    });

    const result = await Promise.race([
      fn(context),
      timeoutPromise
    ]);

    if (result === false) {
      throw new Error('JavaScript action returned false');
    }
    return result;
  } catch (error) {
    console.error('JavaScript execution error:', error);
    throw error;
  }
}

export { processEmailWithRules }; 
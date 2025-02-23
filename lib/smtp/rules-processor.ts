import { db } from '../db/drizzle';
import { filterRules, filterActions, processedEmails, emails, attachments } from '../db/schema';
import { eq } from 'drizzle-orm';
import nodemailer from 'nodemailer';
import { Kafka } from 'kafkajs';
import micromatch from 'micromatch';
import { logger, smtpLogger } from '../logger';
import Handlebars from 'handlebars';
import mjml2html from 'mjml';

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

  try {
    // Get rules - either all enabled rules or just the specific rule
    const rules = await db
      .select()
      .from(filterRules)
      .where(
        specificRuleId 
          ? eq(filterRules.id, specificRuleId)
          : eq(filterRules.enabled, true)
      );

    if (rules.length === 0) {
      logger.info('No matching rules found for email');
      return [];
    }

    const matchedRules: typeof filterRules.$inferSelect[] = [];
    
    for (const rule of rules) {
      // Skip disabled rules unless specifically requested
      if (!rule.enabled && !specificRuleId) continue;

      logger.debug({ msg: 'Checking rule', ruleId: rule.id, ruleName: rule.name });

      try {
        // Check if email matches rule patterns
        if (await matchesRule(email, rule)) {
          logger.info({ msg: 'Email matched rule', ruleId: rule.id, ruleName: rule.name });

          // Add the matched rule to the array
          matchedRules.push(rule);
          
          // Get actions for this rule
          const actions = await db
            .select()
            .from(filterActions)
            .where(eq(filterActions.ruleId, rule.id));

          if (actions.length === 0) {
            logger.warn({ msg: 'No actions found for matched rule', ruleId: rule.id, ruleName: rule.name });
            continue;
          }

          // Process each action
          for (const action of actions) {
            try {
              logger.debug({ 
                msg: 'Processing action', 
                actionId: action.id, 
                actionType: action.type,
                ruleId: rule.id,
                ruleName: rule.name 
              });

              await processAction(email, action);
              
              // Record successful processing
              await db.insert(processedEmails).values({
                emailId: email.id,
                ruleId: rule.id,
                actionId: action.id,
                status: 'success',
                processedAt: new Date(),
              });

              logger.info({ 
                msg: 'Action processed successfully', 
                actionId: action.id,
                actionType: action.type,
                ruleId: rule.id,
                ruleName: rule.name 
              });
            } catch (error) {
              const errorMessage = error instanceof Error 
                ? error.message 
                : String(error);

              const detailedError = `Failed to process action ${action.type} for rule "${rule.name}": ${errorMessage}`;
              
              logger.error({
                msg: 'Error processing action',
                actionId: action.id,
                actionType: action.type,
                ruleId: rule.id,
                ruleName: rule.name,
                error: detailedError,
                stack: error instanceof Error ? error.stack : undefined
              });

              // Record failed processing with detailed error
              await db.insert(processedEmails).values({
                emailId: email.id,
                ruleId: rule.id,
                actionId: action.id,
                status: 'failed',
                error: detailedError,
                processedAt: new Date(),
              });
            }
          }
        } else {
          logger.debug({ 
            msg: 'Email did not match rule patterns', 
            ruleId: rule.id, 
            ruleName: rule.name,
            patterns: {
              fromPattern: rule.fromPattern,
              toPattern: rule.toPattern,
              subjectPattern: rule.subjectPattern
            }
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error 
          ? error.message 
          : String(error);

        logger.error({
          msg: 'Error processing rule',
          ruleId: rule.id,
          ruleName: rule.name,
          error: errorMessage,
          stack: error instanceof Error ? error.stack : undefined
        });

        // Record rule processing failure
        await db.insert(processedEmails).values({
          emailId: email.id,
          ruleId: rule.id,
          status: 'failed',
          error: `Rule processing failed: ${errorMessage}`,
          processedAt: new Date(),
        });
      }
    }
    
    logger.info({ 
      msg: 'Rule processing completed for email',
      matchedRulesCount: matchedRules.length,
      matchedRules: matchedRules.map(r => ({ id: r.id, name: r.name }))
    });

    return matchedRules;
  } catch (error) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : String(error);

    logger.error({
      msg: 'Fatal error during rule processing',
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      emailId: email.id
    });

    throw new Error(`Failed to process email rules: ${errorMessage}`);
  }
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
    ? results.some((result: boolean) => result)
    : results.every((result: boolean) => result);
}

async function processAction(email: Email, action: typeof filterActions.$inferSelect) {
  const config = action.config as Record<string, any>;
  const maxRetries = 1;
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
        case 'email-relay':
          await processEmailRelay(email, config);
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
    case 'email-relay':
      if (config.templateType === 'mjml') {
        if (!config.mjmlTemplate || typeof config.mjmlTemplate !== 'string') {
          throw new Error('Email relay action requires valid MJML template');
        }
      } else {
        if (!config.htmlTemplate || typeof config.htmlTemplate !== 'string') {
          throw new Error('Email relay action requires valid HTML template');
        }
      }
      if (!config.recipientExpression || typeof config.recipientExpression !== 'string') {
        throw new Error('Email relay action requires valid recipient expression');
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

function emailAndName(inputEmail: string): { name: string | null; email: string } {
  // Handle formats like:
  // "Name" <email@domain.com>
  // Name <email@domain.com>
  // <email@domain.com>
  // email@domain.com
  
  // First try to match the format with angle brackets
  const angleMatch = inputEmail.match(/^(?:"([^"]+)"|([^<]+?))?(?:\s*<([^>]+)>)$/);
  if (angleMatch) {
    const [, quotedName, unquotedName, email] = angleMatch;
    const name = quotedName || (unquotedName ? unquotedName.trim() : null);
    return {
      name: name,
      email: email.trim()
    };
  }
  
  // If no angle brackets, check if it's a valid email address
  const emailMatch = inputEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  if (emailMatch) {
    return {
      name: null,
      email: inputEmail.trim()
    };
  }
  
  // If nothing matches, return the input as email
  return {
    name: null,
    email: inputEmail
  };
}

async function processEmailRelay(email: Email, config: Record<string, any>) {
  try {
    // Prepare email data for template
    const emailData = {
      email: {
        id: email.id,
        fromEmail: emailAndName(email.fromEmail).email,
        toEmail: emailAndName(email.toEmail).email,
        subject: email.subject,
        body: email.body,
        sentDate: email.sentDate
      }
    };

    // Render template based on type
    let html: string;
    if (config.templateType === 'mjml') {
      // First convert MJML to HTML
      const mjmlResult = mjml2html(config.mjmlTemplate || `
        <mjml>
          <mj-body>
            <mj-section>
              <mj-column>
                <mj-text>
                  {{email.subject}}
                </mj-text>
                <mj-divider />
                <mj-text>
                  {{{email.body}}}
                </mj-text>
              </mj-column>
            </mj-section>
          </mj-body>
        </mjml>
      `);
      
      // Then compile the resulting HTML with Handlebars
      const template = Handlebars.compile(mjmlResult.html);
      html = template(emailData);
    } else {
      // HTML template
      const template = Handlebars.compile(config.htmlTemplate || `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>{{email.subject}}</title>
          </head>
          <body>
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              {{{email.body}}}
            </div>
          </body>
        </html>
      `);
      html = template(emailData);
    }

    // Extract recipients using the expression
    let recipients: string[];
    if (config.recipientExpression === 'email.toEmail') {
      recipients = [email.toEmail];
    } else {
      try {
        // Handle Handlebars-style expressions
        const template = Handlebars.compile(config.recipientExpression);
        const result = template(emailData); // Use the same emailData we use for templates
        
        // Handle result based on type
        if(result && result.includes(',')) {
          recipients = result.split(',').map(email => email.trim());
        } else if (typeof result === 'string') {
          // If it's a single email address
          recipients = [result];
        } else if (Array.isArray(result)) {
          // If it's an array of email addresses
          recipients = result.filter(r => typeof r === 'string');
        } else {
          throw new Error('Recipient expression must evaluate to string or array of strings');
        }

        // Validate we got at least one recipient
        if (recipients.length === 0) {
          throw new Error('No valid recipients found from expression');
        }

        // Basic email validation
        recipients = recipients.filter(email => 
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        );

        if (recipients.length === 0) {
          throw new Error('No valid email addresses found');
        }
      } catch (error) {
        logger.error({
          msg: 'Error evaluating recipient expression',
          error,
          expression: config.recipientExpression
        });
        throw new Error(`Invalid recipient expression: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Get attachments
    const emailAttachments = await db
      .select()
      .from(attachments)
      .where(eq(attachments.emailId, email.id));

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true'
    });

    // Send to each recipient
    for (const recipient of recipients) {
      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: recipient,
        subject: email.subject || '',
        html: html,
        attachments: emailAttachments.map(att => ({
          filename: att.filename,
          content: Buffer.from(att.content, 'base64'),
          contentType: att.contentType,
        })),
      });
    }
  } catch (error) {
    logger.error({
      msg: 'Error in email relay action',
      error,
      emailId: email.id,
    });
    throw error;
  }
}

export { processEmailWithRules }; 
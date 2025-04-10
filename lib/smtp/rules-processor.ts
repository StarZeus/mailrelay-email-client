import { db } from '../db/drizzle';
import { filterRules, filterActions, processedEmails, emails, attachments } from '../db/schema';
import { eq } from 'drizzle-orm';
import nodemailer from 'nodemailer';
import { Kafka } from 'kafkajs';
import micromatch from 'micromatch';
import { logger, smtpLogger } from '../logger';
import mjml2html from 'mjml';
import { Email } from '@/types/common';
import { ActionPayload } from '@/types/common';
import { validateActionConfig } from '../utils/validation';
import { htmlToJson } from '../utils/html';
import { parseEmail } from '../utils/string';
import { Handlebars, compileHTML } from '../handlebars-config';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';
import fetch from 'node-fetch';
import https from 'https';

async function processEmailWithRules(email: Email, specificRuleId: number, isTest?: boolean) {
  const logger = smtpLogger.child({ emailId: email.id });
  logger.info('Starting rule processing for email');
  let currentPayload: ActionPayload = { email: { ...email } };

  try {
    // Get rules - either all enabled rules or just the specific rule
    const rules = await db
      .select()
      .from(filterRules)
      .where(
        specificRuleId > -1
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
            .where(eq(filterActions.ruleId, rule.id))
            .orderBy(filterActions.order);

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

              currentPayload = {...currentPayload, email: { ...email,bodyJson: htmlToJson(email.body || '')}};
              currentPayload = await processAction(currentPayload, action);
              
              if (!isTest) {
              await db.insert(processedEmails).values({
                  emailId: email.id,
                  ruleId: rule.id,
                  actionId: action.id,
                  status: 'success',
                  processedAt: new Date(),
                });
              }

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

              if (!isTest) {
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

        if (!isTest) {
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
    }
    
    logger.debug({ 
      msg: 'Rule processing completed for email',
      matchedRulesCount: matchedRules.length,
      matchedRules: matchedRules.map(r => ({ id: r.id, name: r.name }))
    });

    return true;
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

async function processAction(payload: ActionPayload, action: typeof filterActions.$inferSelect): Promise<ActionPayload> {
  const config = action.config as Record<string, any>;
  const maxRetries = 1;
  let lastError: Error | null = null;

  validateActionConfig(action.type, config);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      let result: ActionPayload;
      logger.debug({ msg: 'Processing action', actionType: action.type, attempt });
      
      switch (action.type) {
        case 'forward':
          result = await forwardEmail(payload, config.forwardTo);
          break;
        case 'webhook':
          result = await callWebhook(payload, config.url, config.method || 'POST', attempt);
          break;
        case 'kafka':
          result = await sendToKafka(payload, config.topic, config.brokers);
          break;
        case 'javascript':
          result = await runJavaScript(payload, config.code);
          break;
        case 'email-relay':
          result = await processEmailRelay(payload, config);
          break;
        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt === maxRetries) {
        throw new Error(`Action failed after ${maxRetries} attempts: ${lastError.message}`);
      }
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  throw lastError;
}

async function forwardEmail(payload: ActionPayload, forwardTo: string): Promise<ActionPayload> {
  const emailAttachments = await db
    .select()
    .from(attachments)
    .where(eq(attachments.emailId, payload.email.id));

  // Configure proxy if specified
  let proxyAgent;
  if (process.env.SMTP_PROXY_TYPE === 'socks') {
    proxyAgent = new SocksProxyAgent(process.env.SMTP_PROXY_URL || '');
  } else if (process.env.SMTP_PROXY_TYPE === 'http' || process.env.SMTP_PROXY_TYPE === 'https') {
    proxyAgent = new HttpsProxyAgent(process.env.SMTP_PROXY_URL || '');
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    ...(proxyAgent && { proxy: proxyAgent })
  });

  const result = await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: forwardTo,
    subject: payload.email.subject || '',
    ...(payload.email.isHtml ? { html: payload.email.body || '' } : { text: payload.email.body || ''}),
    attachments: emailAttachments.map(att => ({
      filename: att.filename,
      content: Buffer.from(att.content, 'hex'),
      contentType: att.contentType,
    })),
  });

  return {
    ...payload,
    chainData: result
  };
}

async function callWebhook(payload: ActionPayload, url: string, method: string, attempt: number): Promise<ActionPayload> {
  const emailAttachments = await db
    .select()
    .from(attachments)
    .where(eq(attachments.emailId, payload.email.id));

  // Check payload size before sending
  const payloadSize = Buffer.byteLength(JSON.stringify(payload));
  const MAX_PAYLOAD_SIZE = 10 * 1024 * 1024; // 10MB in bytes
  
  if (payloadSize > MAX_PAYLOAD_SIZE) {
    throw new Error(`Payload size (${payloadSize} bytes) exceeds maximum allowed size of ${MAX_PAYLOAD_SIZE} bytes`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  logger.info({ msg: `${method} ${url}`});

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Retry-Attempt': attempt.toString(),
        'Content-Length': payloadSize.toString(),
      },
      body: JSON.stringify(payload),
      // Disable SSL verification
      agent: new https.Agent({ 
        rejectUnauthorized: false,
        maxTotalSockets: 50,
        maxFreeSockets: 10,
        timeout: 30000 // 30 second timeout
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Webhook failed with status ${response.status}: ${errorText}`);
    }

    const responseData = await response.json();
    return {
      ...payload,
      chainData: responseData
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Webhook request timed out after 30 seconds');
      }
      throw new Error(`Webhook request failed: ${error.message}`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function sendToKafka(payload: ActionPayload, topic: string, brokers: string[]): Promise<ActionPayload> {
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
      .where(eq(attachments.emailId, payload.email.id));

    await producer.send({
      topic,
      messages: [{
        key: payload.email.id.toString(),
        value: JSON.stringify({
          ...payload,
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

  return payload;
}

async function runJavaScript($input: ActionPayload, code: string): Promise<ActionPayload> {
  const context = {
    $input,
    console: {
      log: console.log,
      error: console.error,
    },
    fetch: fetch,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    Promise: Promise,
    // Array methods
    Array,
    'Array.prototype': {
      slice: Array.prototype.slice,
      splice: Array.prototype.splice,
      push: Array.prototype.push,
      pop: Array.prototype.pop,
      shift: Array.prototype.shift,
      unshift: Array.prototype.unshift,
      concat: Array.prototype.concat,
      join: Array.prototype.join,
      reverse: Array.prototype.reverse,
      sort: Array.prototype.sort,
      map: Array.prototype.map,
      filter: Array.prototype.filter,
      reduce: Array.prototype.reduce,
      reduceRight: Array.prototype.reduceRight,
      forEach: Array.prototype.forEach,
      some: Array.prototype.some,
      every: Array.prototype.every,
      find: Array.prototype.find,
      findIndex: Array.prototype.findIndex,
      includes: Array.prototype.includes,
      indexOf: Array.prototype.indexOf,
      lastIndexOf: Array.prototype.lastIndexOf,
      flat: Array.prototype.flat,
      flatMap: Array.prototype.flatMap,
      keys: Array.prototype.keys,
      values: Array.prototype.values,
      entries: Array.prototype.entries,
      fill: Array.prototype.fill,
      copyWithin: Array.prototype.copyWithin,
    },
    // Object methods
    Object,
    'Object.prototype': {
      toString: Object.prototype.toString,
      valueOf: Object.prototype.valueOf,
      hasOwnProperty: Object.prototype.hasOwnProperty,
      isPrototypeOf: Object.prototype.isPrototypeOf,
      propertyIsEnumerable: Object.prototype.propertyIsEnumerable,
      toLocaleString: Object.prototype.toLocaleString,
    },
    // Additional utility methods
    JSON,
    Math,
    Date,
    RegExp,
    Error,
    Map,
    Set,
    WeakMap,
    WeakSet,
    Symbol,
    Reflect,
    Proxy,
  };

  const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
  
  // Check if code has return statement
  const hasReturnStatement = /\breturn\b/.test(code);
  
  const wrappedCode = `
    return (async () => {
      try {
        with (context) {
          ${hasReturnStatement ? code : `${code}; return $input;`}
        }
      } catch (error) {
        console.error('Script error:', error);
        throw error;
      }
    })();
  `;

  const fn = new AsyncFunction('context', wrappedCode);

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('JavaScript execution timed out')), 5000);
  });

  let result = await Promise.race([
    fn(context),
    timeoutPromise
  ]);

  if (typeof result !== 'object') {
    result = {
      ...$input,
      chainData: result
    };
  }

  logger.debug({ msg: 'JavaScript action completed for email id', emailId: $input.email.id });
  
  return result;
}

async function processEmailRelay(payload: ActionPayload, config: Record<string, any>): Promise<ActionPayload> {
  try {
    // Prepare email data for template
    const emailData = {
      email: {
        id: payload.email.id,
        fromEmail: parseEmail(payload.email.fromEmail).email,
        toEmail: parseEmail(payload.email.toEmail).email,
        subject: payload.email.subject,
        body: payload.email.body,
        bodyJson: payload.email.bodyJson,
        isHtml: payload.email.isHtml,
        sentDate: payload.email.sentDate,
        attachments: payload.email.attachments
      },
      chainData: payload.chainData
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
      html = compileHTML(mjmlResult.html,emailData);
    } else {
      // HTML template
      html = compileHTML(config.htmlTemplate || `
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
      `,emailData);
    }

    // Extract recipients using the expression
    let recipients: string[];
    if (config.recipientExpression === '{{email.toEmail}}') {
      recipients = [payload.email.toEmail];
    } else {
      try {
        // Handle Handlebars-style expressions
        const template = Handlebars.compile(config.recipientExpression);
        const result = template(emailData); // Use the same emailData we use for templates
        
        // Handle result based on type
        if(result && result.includes(',')) {
          recipients = result.split(',').map((email: string) => email.trim());
        } else if(result && result.includes(';')) {
          recipients = result.split(';').map((email: string) => email.trim());
        }else if (typeof result === 'string') {
          // If it's a single email address
          recipients = [result];
        } else if (Array.isArray(result)) {
          // If it's an array of email addresses
          recipients = [];
          const resultArray = result as unknown[];
          for (const r of resultArray) {
            if (typeof r === 'string') {
              recipients.push(r);
            }
          }
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
      .where(eq(attachments.emailId, payload.email.id));

    // Configure proxy if specified
    let proxyAgent;
    if (process.env.SMTP_PROXY_TYPE === 'socks') {
      proxyAgent = new SocksProxyAgent(process.env.SMTP_PROXY_URL || '');
    } else if (process.env.SMTP_PROXY_TYPE === 'http' || process.env.SMTP_PROXY_TYPE === 'https') {
      proxyAgent = new HttpsProxyAgent(process.env.SMTP_PROXY_URL || '');
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      ...(proxyAgent && { proxy: proxyAgent })
    });

    let emailContent={}
    // Send to each recipient
    for (const recipient of recipients) {
      emailContent = {
        from: process.env.SMTP_FROM || 'mailrelay@email.com',
        to: recipient,
        subject: payload.email.subject || '',
        html: html,
        attachments: emailAttachments.map(att => ({
          filename: att.filename,
          content: Buffer.from(att.content, 'hex'),
          contentType: att.contentType,
        }))
      };
      await transporter.sendMail(emailContent);
    }

    return {
      ...payload,
      chainData: html
    };
  } catch (error) {
    logger.error({
      msg: 'Error in email relay action',
      error,
      emailId: payload.email.id,
    });
    throw error;
  }
}

export { processEmailWithRules }; 
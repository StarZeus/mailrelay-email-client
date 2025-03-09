import { FilterAction } from '@/types/filters';

export function validateActionConfig(type: string, config: Record<string, any>) {
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
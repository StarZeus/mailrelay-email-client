import pino from 'pino';
import pinoPretty from 'pino-pretty';
import { NextRequest } from 'next/server';

// Log level from env or default to 'info'
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const IS_DEV = process.env.NODE_ENV !== 'production';

// Common log configuration
const commonLogConfig = {
  level: LOG_LEVEL,
  base: {
    env: process.env.NODE_ENV,
    version: process.env.APP_VERSION || '1.0.0',
  },
  timestamp: true,
  formatters: {
    level: (label: string) => ({ level: label }),
  },
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'body.password'],
    remove: true,
  },
};

// Server-side logger
export const logger = pino({
  ...commonLogConfig
});

// Create namespaced loggers
export const webLogger = logger.child({ component: 'webui' });
export const smtpLogger = logger.child({ component: 'smtp' });
export const dbLogger = logger.child({ component: 'database' });
export const actionLogger = logger.child({ component: 'actions' });

// Client-side logger
export const clientLogger = {
  trace: (...args: any[]) => IS_DEV && console.trace('[TRACE]', ...args),
  debug: (...args: any[]) => IS_DEV && console.debug('[DEBUG]', ...args),
  info: (...args: any[]) => console.info('[INFO]', ...args),
  warn: (...args: any[]) => console.warn('[WARN]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args),
  fatal: (...args: any[]) => console.error('[FATAL]', ...args),
};

// Request context logger middleware
export function createRequestLogger(req: NextRequest) {
  return logger.child({
    requestId: req.headers.get('x-request-id') || crypto.randomUUID(),
    url: req.url,
    method: req.method,
  });
}

// Log levels utility
export const LogLevels = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
} as const;

// Type for log level strings
export type LogLevel = keyof typeof LogLevels;

// Helper to check if a level should be logged
export function shouldLog(currentLevel: LogLevel, messageLevel: LogLevel): boolean {
  return LogLevels[currentLevel] <= LogLevels[messageLevel];
} 
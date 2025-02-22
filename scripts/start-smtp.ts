import { EmailServer } from '../lib/smtp/smtp-server';

const port = process.env.SMTP_SERVER_PORT ? parseInt(process.env.SMTP_SERVER_PORT) : 2525;
const host = process.env.SMTP_SERVER_HOST || '0.0.0.0';
const secure = process.env.SMTP_SERVER_SECURE === 'true';
const authOptional = process.env.SMTP_SERVER_AUTH_OPTIONAL !== 'false';

const server = new EmailServer({
  port,
  host,
  secure,
  authOptional,
});

server.start();

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM signal');
  server.stop();
});

process.on('SIGINT', () => {
  console.log('Received SIGINT signal');
  server.stop();
}); 
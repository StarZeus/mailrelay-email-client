import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { EmailServer } from './lib/smtp/smtp-server';
import dotenv from 'dotenv';

dotenv.config();

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);
const smtpPort = parseInt(process.env.SMTP_PORT || '2525', 10);

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Initialize SMTP Server
const smtpServer = new EmailServer({
  port: smtpPort,
  host: process.env.SMTP_HOST,
  secure: process.env.SMTP_SECURE === 'true',
  authOptional: process.env.SMTP_AUTH_OPTIONAL !== 'false',
});

async function start() {
  try {
    // Prepare Next.js
    await app.prepare();

    // Create HTTP server
    createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url!, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error occurred handling request:', err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    }).listen(port, () => {
      console.log(
        `> Next.js server ready on http://${hostname}:${port}`
      );
    });

    // Start SMTP server
    smtpServer.start();

    // Handle graceful shutdown
    const shutdown = () => {
      console.log('Shutting down servers...');
      smtpServer.stop();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
}

start(); 
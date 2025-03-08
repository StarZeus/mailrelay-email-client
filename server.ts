import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { EmailServer } from './lib/smtp/smtp-server';
import dotenv from 'dotenv';

dotenv.config();

// Get app mode from environment variable APP_MODE = smtp or smtp-client or all
const mode = process.env.APP_MODE || 'all';
const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Initialize SMTP Server
const smtpServer = new EmailServer({
  port: parseInt(process.env.SMTP_SERVER_PORT || '2525', 10),
  host: process.env.SMTP_SERVER_HOST,
  secure: process.env.SMTP_SERVER_SECURE === 'true',
  authOptional: process.env.SMTP_SERVER_AUTH_OPTIONAL !== 'false',
});

async function start() {
  try {
    console.log('Starting server in mode:', mode);
    if (mode === 'smtp-client' || mode === 'all') {
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
          `**************************************************`
        );
        // Pretty print server url
        console.log(`> Next.js server URL: http://${hostname}:${port}`);
      });
    }

    if (mode === 'smtp-server' || mode === 'all') {
      // Start SMTP server
      await smtpServer.start();
    }

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
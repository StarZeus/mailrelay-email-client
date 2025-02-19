import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import 'dotenv/config';

// In production, we'll use connection pooling
const POOL_CONNECTIONS = process.env.NODE_ENV === 'production' ? 10 : 1;

function createClient() {
  const connectionString = process.env.POSTGRES_URL;

  if (!connectionString) {
    throw new Error('POSTGRES_URL environment variable is required');
  }

  try {
    return postgres(connectionString, {
      max: POOL_CONNECTIONS,
      prepare: false,
      onnotice: () => {}, // Ignore notice messages
    });
  } catch (error) {
    console.error('Failed to create Postgres client:', error);
    throw error;
  }
}

function createDB(client: ReturnType<typeof postgres>) {
  try {
    return drizzle(client);
  } catch (error) {
    console.error('Failed to create Drizzle instance:', error);
    throw error;
  }
}

// In development, we want to reuse the connection
let globalForDb = global as unknown as {
  db: ReturnType<typeof drizzle> | undefined;
  pgClient: ReturnType<typeof postgres> | undefined;
};

// Initialize database connection
export const client = globalForDb.pgClient ?? createClient();
export const db = globalForDb.db ?? createDB(client);

// Save the connection in development
if (process.env.NODE_ENV === 'development') {
  globalForDb.pgClient = client;
  globalForDb.db = db;
}

// Handle cleanup
process.on('beforeExit', async () => {
  await client.end();
}); 
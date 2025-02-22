import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import 'dotenv/config';
import { dbLogger } from '../logger';

// In production, we'll use connection pooling
const POOL_CONNECTIONS = process.env.NODE_ENV === 'production' ? 10 : 1;

function createClient() {
  const connectionString = process.env.POSTGRES_URL;

  if (!connectionString) {
    dbLogger.error({ msg: 'POSTGRES_URL environment variable is required' });
    throw new Error('POSTGRES_URL environment variable is required');
  }

  try {
    dbLogger.debug({ msg: 'Creating Postgres client', poolConnections: POOL_CONNECTIONS });
    return postgres(connectionString, {
      max: POOL_CONNECTIONS,
      prepare: false,
      onnotice: () => {}, // Ignore notice messages
      onparameter: (parameterName, value) => {
        dbLogger.trace({ msg: 'Postgres parameter changed', parameterName, value });
      },
      debug: (connection_id, query, params) => {
        dbLogger.trace({ msg: 'Postgres query', connection_id, query, params });
      },
    });
  } catch (error) {
    dbLogger.error({ msg: 'Failed to create Postgres client', error });
    throw error;
  }
}

function createDB(client: ReturnType<typeof postgres>) {
  try {
    dbLogger.debug({ msg: 'Creating Drizzle instance' });
    return drizzle(client);
  } catch (error) {
    dbLogger.error({ msg: 'Failed to create Drizzle instance', error });
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
  dbLogger.info({ msg: 'Saving database connection in global scope for development' });
  globalForDb.pgClient = client;
  globalForDb.db = db;
}

// Handle cleanup
process.on('beforeExit', async () => {
  dbLogger.info({ msg: 'Closing database connection' });
  await client.end();
}); 
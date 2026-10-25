import { migrate } from 'drizzle-orm/node-postgres/migrator';

import { createDatabase } from '@/persistence/database';

const envFile = process.argv[2];

if (envFile) process.loadEnvFile(envFile);

const connectionString = process.env.ADMIN_DATABASE_URL;

if (!connectionString) throw new Error('ADMIN_DATABASE_URL is required to run migrations');

const { db, pool } = createDatabase(connectionString);

await migrate(db, { migrationsFolder: 'database/migrations' });
await pool.end();

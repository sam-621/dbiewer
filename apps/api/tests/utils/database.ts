import { sql } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';

import { createDatabase } from '@/persistence/database';

import type { Fixture } from './fixture';

const getEnv = (name: 'DATABASE_URL' | 'ADMIN_DATABASE_URL') => {
  const url = process.env[name];

  if (!url) throw new Error(`${name} is required for tests with database`);

  return url;
};

const { db: adminDb, pool: adminPool } = createDatabase(getEnv('ADMIN_DATABASE_URL'));
const { db: appDb, pool: appPool } = createDatabase(getEnv('DATABASE_URL'));

export const testDatabase = adminDb;
export const testAppDatabase = appDb;

export const loadFixtures = async (fixtures: Fixture<PgTable>[]) => {
  for (const fixture of fixtures) {
    if (fixture.rows.length) await adminDb.insert(fixture.table).values(fixture.rows);
  }
};

export const resetDatabase = async () => {
  const result = await adminDb.execute<{ tablename: string }>(
    sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
  );

  if (!result.rows.length) return;

  const tables = result.rows.map(row => `"public"."${row.tablename}"`).join(', ');

  await adminDb.execute(sql.raw(`TRUNCATE ${tables} RESTART IDENTITY CASCADE`));
};

export const destroyDatabase = async () => {
  await Promise.all([adminPool.end(), appPool.end()]);
};

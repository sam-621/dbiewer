import { sql } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';

import { createDatabase } from '@/persistence/database';

import type { Fixture } from './fixture';

const getAdminUrl = () => {
  const url = process.env.ADMIN_DATABASE_URL;

  if (!url) throw new Error('ADMIN_DATABASE_URL is required for tests with database');

  return url;
};

const { db: adminDb, pool: adminPool } = createDatabase(getAdminUrl());

export const testDatabase = adminDb;

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
  await adminPool.end();
};

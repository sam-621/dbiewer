import type { PgTable } from 'drizzle-orm/pg-core';

export interface Fixture<T extends PgTable> {
  table: T;
  rows: T['$inferInsert'][];
}

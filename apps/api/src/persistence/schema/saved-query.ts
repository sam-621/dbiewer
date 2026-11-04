import { sql } from 'drizzle-orm';
import { pgPolicy, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { connection } from './connection';
import { workspace } from './workspace';

const currentTenantId = sql`nullif(current_setting('app.current_tenant_id', true), '')::uuid`;

export const savedQuery = pgTable(
  'saved_query',
  {
    id: uuid('id').primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .default(currentTenantId)
      .references(() => workspace.id, { onDelete: 'cascade' }),
    connectionId: uuid('connection_id')
      .notNull()
      .references(() => connection.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    sql: text('sql').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull()
  },
  table => [
    uniqueIndex('saved_query_connection_id_name_idx').on(
      table.connectionId,
      sql`lower(${table.name})`
    ),
    pgPolicy('saved_query_tenant_isolation', {
      as: 'permissive',
      for: 'all',
      using: sql`${table.tenantId} = ${currentTenantId}`,
      withCheck: sql`${table.tenantId} = ${currentTenantId}`
    })
  ]
).enableRLS();

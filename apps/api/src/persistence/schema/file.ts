import { sql } from 'drizzle-orm';
import { pgPolicy, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { connection } from './connection';
import { workspace } from './workspace';

const currentTenantId = sql`nullif(current_setting('app.current_tenant_id', true), '')::uuid`;

export const file = pgTable(
  'file',
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
    type: text('type', { enum: ['sql', 'txt'] }).notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull()
  },
  table => [
    uniqueIndex('file_connection_id_type_name_idx').on(
      table.connectionId,
      table.type,
      sql`lower(${table.name})`
    ),
    pgPolicy('file_tenant_isolation', {
      as: 'permissive',
      for: 'all',
      using: sql`${table.tenantId} = ${currentTenantId}`,
      withCheck: sql`${table.tenantId} = ${currentTenantId}`
    })
  ]
).enableRLS();

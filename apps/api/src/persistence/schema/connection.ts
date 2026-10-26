import { sql } from 'drizzle-orm';
import {
  integer,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from 'drizzle-orm/pg-core';

import { workspace } from './workspace';

const currentTenantId = sql`nullif(current_setting('app.current_tenant_id', true), '')::uuid`;

export const connection = pgTable(
  'connection',
  {
    id: uuid('id').primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .default(currentTenantId)
      .references(() => workspace.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    host: text('host').notNull(),
    port: integer('port').notNull(),
    database: text('database').notNull(),
    username: text('username').notNull(),
    passwordEncrypted: text('password_encrypted'),
    sslMode: text('ssl_mode', { enum: ['disable', 'require', 'verify-full'] }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull()
  },
  table => [
    uniqueIndex('connection_tenant_id_name_idx').on(table.tenantId, sql`lower(${table.name})`),
    pgPolicy('connection_tenant_isolation', {
      as: 'permissive',
      for: 'all',
      using: sql`${table.tenantId} = ${currentTenantId}`,
      withCheck: sql`${table.tenantId} = ${currentTenantId}`
    })
  ]
).enableRLS();

import { sql } from 'drizzle-orm';
import { pgPolicy, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { user } from './auth';

const currentTenantId = sql`nullif(current_setting('app.current_tenant_id', true), '')::uuid`;
const bypassRls = sql`current_setting('app.bypass_rls', true) = 'on'`;

export const workspace = pgTable(
  'workspace',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerUserId: uuid('owner_user_id')
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull()
  },
  table => [
    pgPolicy('workspace_tenant_isolation', {
      as: 'permissive',
      for: 'all',
      using: sql`${bypassRls} or ${table.id} = ${currentTenantId}`,
      withCheck: sql`${bypassRls} or ${table.id} = ${currentTenantId}`
    })
  ]
).enableRLS();

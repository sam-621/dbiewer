import { sql } from 'drizzle-orm';
import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const magicLinkRequest = pgTable(
  'magic_link_request',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull()
  },
  table => [
    index('magic_link_request_email_created_at_idx').on(sql`lower(${table.email})`, table.createdAt)
  ]
);

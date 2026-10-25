import { and, count, eq, gte, like, sql } from 'drizzle-orm';

import type { Database } from '@/persistence/database';
import { verification } from '@/persistence/schema';

const MAGIC_LINK_IDENTIFIER_PREFIX = 'magic-link:';

export class VerificationRepository {
  constructor(private readonly db: Database) {}

  async countMagicLinksSince(email: string, since: Date) {
    const [row] = await this.db
      .select({ total: count() })
      .from(verification)
      .where(
        and(
          like(verification.identifier, `${MAGIC_LINK_IDENTIFIER_PREFIX}%`),
          gte(verification.createdAt, since),
          sql`lower(case when ${verification.identifier} like ${`${MAGIC_LINK_IDENTIFIER_PREFIX}%`} then ${verification.value}::jsonb ->> 'email' end) = ${email.toLowerCase()}`
        )
      );

    return row?.total ?? 0;
  }

  async removeMagicLink(token: string) {
    await this.db
      .delete(verification)
      .where(eq(verification.identifier, `${MAGIC_LINK_IDENTIFIER_PREFIX}${token}`));
  }
}

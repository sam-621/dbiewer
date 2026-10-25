import { eq } from 'drizzle-orm';

import type { Database } from '@/persistence/database';
import { verification } from '@/persistence/schema';

const MAGIC_LINK_IDENTIFIER_PREFIX = 'magic-link:';

export class VerificationRepository {
  constructor(private readonly db: Database) {}

  async removeMagicLink(token: string) {
    await this.db
      .delete(verification)
      .where(eq(verification.identifier, `${MAGIC_LINK_IDENTIFIER_PREFIX}${token}`));
  }
}

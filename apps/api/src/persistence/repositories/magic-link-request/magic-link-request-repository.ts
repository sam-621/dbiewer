import { and, count, eq, gte, sql } from 'drizzle-orm';

import type { Database } from '@/persistence/database';
import { magicLinkRequest } from '@/persistence/schema';

export class MagicLinkRequestRepository {
  constructor(private readonly db: Database) {}

  async countSince(email: string, since: Date) {
    const [row] = await this.db
      .select({ total: count() })
      .from(magicLinkRequest)
      .where(
        and(
          eq(sql`lower(${magicLinkRequest.email})`, email.toLowerCase()),
          gte(magicLinkRequest.createdAt, since)
        )
      );

    return row?.total ?? 0;
  }

  async create(email: string) {
    const [row] = await this.db.insert(magicLinkRequest).values({ email }).returning();

    return row;
  }
}

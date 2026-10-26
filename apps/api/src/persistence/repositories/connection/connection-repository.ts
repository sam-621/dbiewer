import { and, count, desc, eq, ne, sql } from 'drizzle-orm';

import type { Transaction } from '@/persistence/database';
import { Repository } from '@/persistence/repositories/repository';
import type { RepositoryRLS } from '@/persistence/rls';
import { connection } from '@/persistence/schema';

export type Connection = typeof connection.$inferSelect;

export class ConnectionRepository extends Repository<typeof connection> {
  constructor(
    trx: Transaction,
    private readonly rls: RepositoryRLS
  ) {
    super(trx, connection);
  }

  async findAll() {
    return this.trx.select().from(connection).orderBy(desc(connection.createdAt), connection.id);
  }

  async existsByName(name: string, excludeId?: string) {
    const [row] = await this.trx
      .select({ total: count() })
      .from(connection)
      .where(
        and(
          eq(sql`lower(${connection.name})`, sql`lower(${name})`),
          excludeId ? ne(connection.id, excludeId) : undefined
        )
      );

    return (row?.total ?? 0) > 0;
  }
}

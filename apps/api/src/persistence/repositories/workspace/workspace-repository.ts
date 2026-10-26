import { count, eq } from 'drizzle-orm';

import type { Transaction } from '@/persistence/database';
import { Repository } from '@/persistence/repositories/repository';
import type { RepositoryRLS } from '@/persistence/rls';
import { workspace } from '@/persistence/schema';

export type Workspace = typeof workspace.$inferSelect;

export type CreateWorkspaceValues = {
  ownerUserId: string;
  name: string;
  slug: string;
};

export class WorkspaceRepository extends Repository<typeof workspace> {
  constructor(
    trx: Transaction,
    private readonly rls: RepositoryRLS
  ) {
    super(trx, workspace);
  }

  async findByOwnerUserId(ownerUserId: string) {
    return this.rls.runWithoutRLS(() => this.findOne({ ownerUserId }));
  }

  async existsBySlug(slug: string) {
    return this.rls.runWithoutRLS(async () => {
      const [row] = await this.trx
        .select({ total: count() })
        .from(workspace)
        .where(eq(workspace.slug, slug));

      return (row?.total ?? 0) > 0;
    });
  }

  async create(values: CreateWorkspaceValues) {
    return this.rls.runWithoutRLS(() => this.insert(values));
  }
}

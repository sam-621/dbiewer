import { count, eq } from 'drizzle-orm';

import type { Transaction } from '@/persistence/database';
import type { RepositoryRLS } from '@/persistence/rls';
import { workspace } from '@/persistence/schema';

export type Workspace = typeof workspace.$inferSelect;

export type CreateWorkspaceValues = {
  ownerUserId: string;
  name: string;
  slug: string;
};

export class WorkspaceRepository {
  constructor(
    private readonly trx: Transaction,
    private readonly rls: RepositoryRLS
  ) {}

  async findByOwnerUserId(ownerUserId: string) {
    return this.rls.runWithoutRLS(() => this.selectByOwnerUserId(ownerUserId));
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
    return this.rls.runWithoutRLS(async () => {
      const [row] = await this.trx.insert(workspace).values(values).returning();

      if (!row) throw new Error(`Failed to create workspace for user ${values.ownerUserId}`);

      return row;
    });
  }

  private async selectByOwnerUserId(ownerUserId: string) {
    const [row] = await this.trx
      .select()
      .from(workspace)
      .where(eq(workspace.ownerUserId, ownerUserId));

    return row ?? null;
  }
}

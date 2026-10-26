import type { Transaction } from '@/persistence/database';
import type { RepositoryRLS } from '@/persistence/rls';

import { WorkspaceRepository } from './workspace';

export const buildRepositories = (trx: Transaction, rls: RepositoryRLS) => ({
  workspace: new WorkspaceRepository(trx, rls)
});

export type Repositories = ReturnType<typeof buildRepositories>;

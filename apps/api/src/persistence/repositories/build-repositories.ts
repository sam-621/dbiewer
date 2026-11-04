import type { Transaction } from '@/persistence/database';
import type { RepositoryRLS } from '@/persistence/rls';

import { ConnectionRepository } from './connection';
import { FileRepository } from './file';
import { WorkspaceRepository } from './workspace';

export const buildRepositories = (trx: Transaction, rls: RepositoryRLS) => ({
  connection: new ConnectionRepository(trx, rls),
  file: new FileRepository(trx, rls),
  workspace: new WorkspaceRepository(trx, rls)
});

export type Repositories = ReturnType<typeof buildRepositories>;

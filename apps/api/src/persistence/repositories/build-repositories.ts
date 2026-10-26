import type { Transaction } from '@/persistence/database';
import type { RLSContext } from '@/persistence/rls';
import { runWithoutRLS } from '@/persistence/rls';

import { WorkspaceRepository } from './workspace';

export const buildRepositories = (trx: Transaction, rlsContext: RLSContext) => {
  const rls = { context: rlsContext, runWithoutRLS: runWithoutRLS(trx, rlsContext) };

  return {
    rls,
    repositories: {
      workspace: new WorkspaceRepository(trx, rls)
    }
  };
};

export type Repositories = ReturnType<typeof buildRepositories>['repositories'];

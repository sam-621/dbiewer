import type { Database, Transaction } from '@/persistence/database';
import type { Repositories } from '@/persistence/repositories/build-repositories';
import { buildRepositories } from '@/persistence/repositories/build-repositories';
import type { RLSContext } from '@/persistence/rls';
import type { RunWithoutRLS } from '@/persistence/rls';
import { enableRLS } from '@/persistence/rls';
import { createLogger } from '@/services/logger';

export type UowContext = {
  repositories: Repositories;
  trx: Transaction;
  runWithoutRLS: RunWithoutRLS;
  rlsContext: RLSContext;
};

type Work<R> = (repositories: Repositories, uowContext: UowContext) => Promise<R>;

const logger = createLogger('unit-of-work');

export class UnitOfWork {
  constructor(
    private readonly database: Database,
    private readonly rlsContext?: RLSContext & { trx?: Transaction }
  ) {}

  async execute<R>(work: Work<R>) {
    const { trx: externalTrx, ...rlsContext } = this.rlsContext ?? {};

    if (externalTrx) return this.run(externalTrx, rlsContext, work);

    let workFailed = false;
    let workError: unknown;

    try {
      return await this.database.transaction(async trx => {
        try {
          return await this.run(trx, rlsContext, work);
        } catch (error) {
          workFailed = true;
          workError = error;
          throw error;
        }
      });
    } catch (error) {
      if (!workFailed) throw error;
      if (error !== workError) logger.error('Failed to roll back the transaction', { error });

      throw workError;
    }
  }

  private async run<R>(trx: Transaction, rlsContext: RLSContext, work: Work<R>) {
    await enableRLS(trx, rlsContext);

    const { repositories, rls } = buildRepositories(trx, rlsContext);

    return work(repositories, {
      repositories,
      trx,
      rlsContext,
      runWithoutRLS: rls.runWithoutRLS
    });
  }
}

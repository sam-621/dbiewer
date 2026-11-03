import type { MutationRunQueryArgs, Resolvers } from '@/api/codegen';
import type { SessionContext } from '@/api/middlewares/require-session';
import { requireSession } from '@/api/middlewares/require-session';
import { apiResponse } from '@/api/utils/api-response';
import { QueryRunner } from '@/modules/query/use-cases/query-runner';
import { UnitOfWork } from '@/persistence/unit-of-work';

async function runQuery(_parent: unknown, args: MutationRunQueryArgs, ctx: SessionContext) {
  const uow = new UnitOfWork(ctx.database, ctx.rlsContext);

  const result = await uow.execute(async (_repositories, uowCtx) => {
    const queryRunner = new QueryRunner(
      uowCtx,
      ctx.services.encryptionService,
      ctx.services.postgresService
    );

    return queryRunner.execute(args.input);
  });

  return apiResponse(result, 'execution');
}

export const QueryResolver: Resolvers = {
  Mutation: {
    runQuery: requireSession(runQuery)
  }
};

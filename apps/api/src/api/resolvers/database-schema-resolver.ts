import type { QueryConnectionSchemaArgs, Resolvers } from '@/api/codegen';
import type { SessionContext } from '@/api/middlewares/require-session';
import { requireSession } from '@/api/middlewares/require-session';
import { apiResponse } from '@/api/utils/api-response';
import { ConnectionSchemaReader } from '@/modules/database-schema/use-cases/connection-schema-reader';
import { UnitOfWork } from '@/persistence/unit-of-work';

async function connectionSchema(
  _parent: unknown,
  args: QueryConnectionSchemaArgs,
  ctx: SessionContext
) {
  const uow = new UnitOfWork(ctx.database, ctx.rlsContext);

  const result = await uow.execute(async (_repositories, uowCtx) => {
    const connectionSchemaReader = new ConnectionSchemaReader(
      uowCtx,
      ctx.services.encryptionService,
      ctx.services.postgresService
    );

    return connectionSchemaReader.execute(args.connectionId);
  });

  return apiResponse(result, 'schemas');
}

export const DatabaseSchemaResolver: Resolvers = {
  DbFunctionKind: {
    FUNCTION: 'function',
    PROCEDURE: 'procedure'
  },
  Query: {
    connectionSchema: requireSession(connectionSchema)
  }
};

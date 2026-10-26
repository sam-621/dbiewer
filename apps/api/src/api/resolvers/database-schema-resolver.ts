import type {
  QueryConnectionSchemaArgs,
  QueryTableRowsArgs,
  QueryTableStructureArgs,
  Resolvers
} from '@/api/codegen';
import type { SessionContext } from '@/api/middlewares/require-session';
import { requireSession } from '@/api/middlewares/require-session';
import { apiResponse } from '@/api/utils/api-response';
import { ConnectionSchemaReader } from '@/modules/database-schema/use-cases/connection-schema-reader';
import { TableRowsReader } from '@/modules/database-schema/use-cases/table-rows-reader';
import { TableStructureReader } from '@/modules/database-schema/use-cases/table-structure-reader';
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

async function tableStructure(
  _parent: unknown,
  args: QueryTableStructureArgs,
  ctx: SessionContext
) {
  const uow = new UnitOfWork(ctx.database, ctx.rlsContext);

  const result = await uow.execute(async (_repositories, uowCtx) => {
    const tableStructureReader = new TableStructureReader(
      uowCtx,
      ctx.services.encryptionService,
      ctx.services.postgresService
    );

    return tableStructureReader.execute(args.input);
  });

  return apiResponse(result, 'structure');
}

async function tableRows(_parent: unknown, args: QueryTableRowsArgs, ctx: SessionContext) {
  const uow = new UnitOfWork(ctx.database, ctx.rlsContext);

  const result = await uow.execute(async (_repositories, uowCtx) => {
    const tableRowsReader = new TableRowsReader(
      uowCtx,
      ctx.services.encryptionService,
      ctx.services.postgresService
    );

    return tableRowsReader.execute(args.input);
  });

  return apiResponse(result, 'tableRows');
}

export const DatabaseSchemaResolver: Resolvers = {
  DbFunctionKind: {
    FUNCTION: 'function',
    PROCEDURE: 'procedure'
  },
  Query: {
    connectionSchema: requireSession(connectionSchema),
    tableStructure: requireSession(tableStructure),
    tableRows: requireSession(tableRows)
  }
};

import type {
  MutationCreateConnectionArgs,
  MutationRemoveConnectionArgs,
  MutationUpdateConnectionArgs,
  QueryConnectionArgs,
  Resolvers
} from '@/api/codegen';
import type { SessionContext } from '@/api/middlewares/require-session';
import { requireSession } from '@/api/middlewares/require-session';
import { apiResponse } from '@/api/utils/api-response';
import { ConnectionCreator } from '@/modules/connection/use-cases/connection-creator';
import { ConnectionRemover } from '@/modules/connection/use-cases/connection-remover';
import { ConnectionUpdater } from '@/modules/connection/use-cases/connection-updater';
import type { Connection } from '@/persistence/repositories/connection';
import { UnitOfWork } from '@/persistence/unit-of-work';
import { BusinessError } from '@/shared/errors/business-error';

const toConnectionResponse = (connection: Connection) => ({
  id: connection.id,
  name: connection.name,
  host: connection.host,
  port: connection.port,
  database: connection.database,
  username: connection.username,
  hasPassword: connection.passwordEncrypted !== null,
  sslMode: connection.sslMode
});

const toConnectionResult = <TError extends BusinessError>(result: Connection | TError) =>
  result instanceof BusinessError ? result : toConnectionResponse(result);

async function connections(_parent: unknown, _args: unknown, ctx: SessionContext) {
  const uow = new UnitOfWork(ctx.database, ctx.rlsContext);

  const items = await uow.execute(repositories => repositories.connection.findAll());

  return { items: items.map(toConnectionResponse) };
}

async function connection(_parent: unknown, args: QueryConnectionArgs, ctx: SessionContext) {
  const uow = new UnitOfWork(ctx.database, ctx.rlsContext);

  const found = await uow.execute(repositories => repositories.connection.findOne({ id: args.id }));

  return found ? toConnectionResponse(found) : null;
}

async function createConnection(
  _parent: unknown,
  args: MutationCreateConnectionArgs,
  ctx: SessionContext
) {
  const uow = new UnitOfWork(ctx.database, ctx.rlsContext);

  const result = await uow.execute(async (_repositories, uowCtx) => {
    const connectionCreator = new ConnectionCreator(uowCtx, ctx.services.encryptionService);

    return connectionCreator.execute(args.input);
  });

  return apiResponse(toConnectionResult(result), 'connection');
}

async function updateConnection(
  _parent: unknown,
  args: MutationUpdateConnectionArgs,
  ctx: SessionContext
) {
  const uow = new UnitOfWork(ctx.database, ctx.rlsContext);

  const result = await uow.execute(async (_repositories, uowCtx) => {
    const connectionUpdater = new ConnectionUpdater(uowCtx, ctx.services.encryptionService);

    return connectionUpdater.execute(args.input);
  });

  return apiResponse(toConnectionResult(result), 'connection');
}

async function removeConnection(
  _parent: unknown,
  args: MutationRemoveConnectionArgs,
  ctx: SessionContext
) {
  const uow = new UnitOfWork(ctx.database, ctx.rlsContext);

  const result = await uow.execute(async (_repositories, uowCtx) => {
    const connectionRemover = new ConnectionRemover(uowCtx);

    return connectionRemover.execute(args.id);
  });

  return apiResponse(result, 'success');
}

export const ConnectionResolver: Resolvers = {
  ConnectionSslMode: {
    DISABLE: 'disable',
    REQUIRE: 'require',
    VERIFY_FULL: 'verify-full'
  },
  Query: {
    connections: requireSession(connections),
    connection: requireSession(connection)
  },
  Mutation: {
    createConnection: requireSession(createConnection),
    updateConnection: requireSession(updateConnection),
    removeConnection: requireSession(removeConnection)
  }
};

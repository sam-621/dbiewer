import type { QueryConnectionArgs, Resolvers } from '@/api/codegen';
import type { SessionContext } from '@/api/middlewares/require-session';
import { requireSession } from '@/api/middlewares/require-session';
import type { Connection } from '@/persistence/repositories/connection';
import { UnitOfWork } from '@/persistence/unit-of-work';

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

export const ConnectionResolver: Resolvers = {
  ConnectionSslMode: {
    DISABLE: 'disable',
    REQUIRE: 'require',
    VERIFY_FULL: 'verify-full'
  },
  Query: {
    connections: requireSession(connections),
    connection: requireSession(connection)
  }
};

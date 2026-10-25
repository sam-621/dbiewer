import type { IncomingMessage, ServerResponse } from 'node:http';
import { fileURLToPath } from 'node:url';

import { loadFilesSync } from '@graphql-tools/load-files';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { toNodeHandler } from 'better-auth/node';
import express from 'express';
import { createYoga } from 'graphql-yoga';

import { resolvers } from '@/api/resolvers';
import type { Database } from '@/persistence/database';
import { createAuth } from '@/services/auth';
import type { Context } from '@/shared/context';
import { maskError } from '@/shared/errors/error-handler';
import { createUseCases } from '@/use-cases';

const typeDefs = loadFilesSync(fileURLToPath(new URL('./api/schema', import.meta.url)), {
  extensions: ['gql']
});

export const createApp = (db: Database, adminDb: Database) => {
  const auth = createAuth(adminDb);

  const yoga = createYoga<{ req: IncomingMessage; res: ServerResponse }, Context>({
    schema: makeExecutableSchema<Context>({ typeDefs, resolvers }),
    maskedErrors: { maskError },
    logging: false,
    context: () => ({ useCases: createUseCases(db) })
  });

  const app = express();

  app.all('/api/auth/*splat', toNodeHandler(auth));
  app.use(yoga.graphqlEndpoint, yoga.requestListener);

  return app;
};

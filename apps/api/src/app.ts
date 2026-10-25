import type { IncomingMessage, ServerResponse } from 'node:http';
import { fileURLToPath } from 'node:url';

import { loadFilesSync } from '@graphql-tools/load-files';
import { makeExecutableSchema } from '@graphql-tools/schema';
import express from 'express';
import { createYoga } from 'graphql-yoga';

import type { Database } from '@/persistence/database';
import { resolvers } from '@/resolvers';
import { createServices } from '@/services';
import type { Context } from '@/shared/context';
import { maskError } from '@/shared/errors/error-handler';

const typeDefs = loadFilesSync(fileURLToPath(new URL('./schema', import.meta.url)), {
  extensions: ['gql']
});

export const createApp = (db: Database) => {
  const yoga = createYoga<{ req: IncomingMessage; res: ServerResponse }, Context>({
    schema: makeExecutableSchema<Context>({ typeDefs, resolvers }),
    maskedErrors: { maskError },
    context: () => ({ services: createServices(db) })
  });

  const app = express();

  app.use(yoga.graphqlEndpoint, yoga.requestListener);

  return app;
};

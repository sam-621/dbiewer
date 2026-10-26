import { fileURLToPath } from 'node:url';

import { loadFilesSync } from '@graphql-tools/load-files';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { toNodeHandler } from 'better-auth/node';
import cors from 'cors';
import express from 'express';
import { createYoga } from 'graphql-yoga';

import { resolvers } from '@/api/resolvers';
import { config } from '@/config';
import type { AppContext, RequestContext } from '@/context';
import { createRequestContext } from '@/context';
import { createAuth } from '@/services/auth';
import { maskError } from '@/shared/errors/error-handler';

const typeDefs = loadFilesSync(fileURLToPath(new URL('./api/schema', import.meta.url)), {
  extensions: ['gql']
});

export const createApp = (appContext: AppContext) => {
  const auth = createAuth(appContext);

  const yoga = createYoga<Record<string, unknown>, RequestContext>({
    schema: makeExecutableSchema({ typeDefs, resolvers }),
    context: createRequestContext(appContext, auth),
    cors: { origin: config.webUrl, credentials: true },
    maskedErrors: { maskError },
    logging: false
  });

  const app = express();

  app.all(
    '/api/auth/*splat',
    cors({ origin: config.webUrl, credentials: true }),
    toNodeHandler(auth)
  );
  app.use(yoga.graphqlEndpoint, yoga.requestListener);

  return app;
};

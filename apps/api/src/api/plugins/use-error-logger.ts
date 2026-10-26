import { GraphQLError } from 'graphql';
import type { Plugin } from 'graphql-yoga';
import { isAsyncIterable } from 'graphql-yoga';

import { createLogger } from '@/services/logger';
import { DbiewerError } from '@/shared/errors/dbiewer-error';

const logger = createLogger('graphql');

export function useErrorLogger(): Plugin {
  return {
    onExecute() {
      return {
        onExecuteDone({ args, result }) {
          if (isAsyncIterable(result)) {
            return;
          }

          const url = new URL(args.contextValue.request.url);

          for (const error of result?.errors ?? []) {
            const original = error.originalError;

            if (original instanceof DbiewerError) {
              logger.error(original.message, original, {
                path: url.pathname,
                gqlError: { path: error.path, code: error.extensions.code }
              });
            } else if (original instanceof GraphQLError) {
              continue;
            } else if (original instanceof Error) {
              logger.error(original.message, original, {
                path: url.pathname,
                gqlError: { path: error.path, code: error.extensions.code }
              });
            }
          }
        }
      };
    }
  };
}

import { GraphQLError } from 'graphql';
import { maskError as maskUnknownError } from 'graphql-yoga';
import { ZodError } from 'zod';

import { UnauthenticatedError } from '@/errors/account-errors';
import { WorkspaceNotFoundError } from '@/errors/workspace-errors';

import { DbiewerError } from './dbiewer-error';

type DbiewerErrorClass = abstract new (...args: never[]) => DbiewerError;

const ERROR_CODES: Array<[DbiewerErrorClass, string]> = [
  [UnauthenticatedError, 'UNAUTHENTICATED'],
  [WorkspaceNotFoundError, 'WORKSPACE_NOT_FOUND']
];

const getOriginalError = (error: unknown) =>
  error instanceof GraphQLError && error.originalError ? error.originalError : error;

export const maskError = (error: unknown, message: string, isDev?: boolean) => {
  const original = getOriginalError(error);

  if (original instanceof ZodError) {
    return new GraphQLError('Invalid input', {
      extensions: { code: 'BAD_USER_INPUT', issues: original.issues }
    });
  }

  if (original instanceof DbiewerError) {
    const entry = ERROR_CODES.find(([ErrorClass]) => original instanceof ErrorClass);

    if (entry) return new GraphQLError(original.message, { extensions: { code: entry[1] } });
  }

  return maskUnknownError(error, message, isDev);
};

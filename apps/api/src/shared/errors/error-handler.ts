import { GraphQLError } from 'graphql';
import { maskError as maskUnknownError } from 'graphql-yoga';

import { UnauthenticatedError } from '@/errors/account-errors';

import { DbiewerError } from './dbiewer-error';

type DbiewerErrorClass = abstract new (...args: never[]) => DbiewerError;

const ERROR_CODES: Array<[DbiewerErrorClass, string]> = [[UnauthenticatedError, 'UNAUTHENTICATED']];

const isGraphQLError = (error: unknown): error is GraphQLError =>
  error instanceof Error && error.name === 'GraphQLError';

const getOriginalError = (error: unknown) =>
  isGraphQLError(error) && error.originalError ? error.originalError : error;

export const maskError = (error: unknown, message: string) => {
  const original = getOriginalError(error);

  if (original instanceof DbiewerError) {
    const entry = ERROR_CODES.find(([ErrorClass]) => original instanceof ErrorClass);

    if (entry) return new GraphQLError(original.message, { extensions: { code: entry[1] } });
  }

  return maskUnknownError(error, message, false);
};

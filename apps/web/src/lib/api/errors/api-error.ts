import type { GraphQLFormattedError } from 'graphql';

export const GENERIC_ERROR = 'Something went wrong';

export class GqlError extends Error {
  readonly code: string | undefined;

  constructor(readonly errors: GraphQLFormattedError[]) {
    super(errors.map(error => error.message).join('\n'));
    this.name = 'GqlError';

    const code = errors[0]?.extensions?.code;
    this.code = typeof code === 'string' ? code : undefined;
  }
}

export type ApiError<TErrorCode extends string> = {
  error: string;
  errorCode: TErrorCode;
};

export const isApiError = (error: unknown): error is GqlError & { code: string } =>
  error instanceof GqlError && error.code !== undefined;

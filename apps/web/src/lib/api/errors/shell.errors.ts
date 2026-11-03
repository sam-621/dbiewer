import type { ShellErrorCode } from '../types';

import type { ApiError } from './api-error';

const SHELL_ERRORS: Record<ShellErrorCode, string> = {
  INVALID_INPUT: 'Check the details and try again',
  CONNECTION_NOT_FOUND: 'This connection no longer exists',
  CONNECTION_FAILED: "We couldn't connect to the database",
  OBJECT_NOT_FOUND: 'This object no longer exists',
  QUERY_FAILED: 'The query failed'
};

export const getShellError = (errorCode: ShellErrorCode): ApiError<ShellErrorCode> => ({
  error: SHELL_ERRORS[errorCode],
  errorCode
});

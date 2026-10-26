import type { ConnectionErrorCode } from '../types';

import type { ApiError } from './api-error';

const CONNECTION_ERRORS: Record<ConnectionErrorCode, string> = {
  INVALID_INPUT: 'Check the connection details and try again',
  CONNECTION_NAME_ALREADY_EXISTS: 'You already have a connection with this name',
  CONNECTION_NOT_FOUND: 'This connection no longer exists'
};

export const getConnectionError = (
  errorCode: ConnectionErrorCode
): ApiError<ConnectionErrorCode> => ({
  error: CONNECTION_ERRORS[errorCode],
  errorCode
});

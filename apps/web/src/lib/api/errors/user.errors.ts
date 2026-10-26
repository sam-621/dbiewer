import type { UserErrorCode } from '../types';

import type { ApiError } from './api-error';

const USER_ERRORS: Record<UserErrorCode, string> = {
  USER_NAME_REQUIRED: 'Enter your name',
  USER_NAME_TOO_LONG: 'Name must be 50 characters or less'
};

export const getUserError = (errorCode: UserErrorCode): ApiError<UserErrorCode> => ({
  error: USER_ERRORS[errorCode],
  errorCode
});

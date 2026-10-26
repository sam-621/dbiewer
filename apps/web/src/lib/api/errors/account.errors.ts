import type { ApiError } from './api-error';

export type AccountErrorCode = 'TOO_MANY_REQUESTS';

type AuthClientError = { status: number };

const TOO_MANY_REQUESTS_STATUS = 429;

export const getAccountError = (error: AuthClientError): ApiError<AccountErrorCode> | null => {
  if (error.status === TOO_MANY_REQUESTS_STATUS) {
    return {
      error: 'Too many attempts. Wait a few minutes before requesting another link.',
      errorCode: 'TOO_MANY_REQUESTS'
    };
  }

  return null;
};

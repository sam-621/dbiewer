import type { FileErrorCode } from '../types';

import type { ApiError } from './api-error';

const FILE_ERRORS: Record<FileErrorCode, string> = {
  INVALID_INPUT: 'Enter a valid file name',
  CONNECTION_NOT_FOUND: 'This connection no longer exists',
  FILE_NOT_FOUND: 'This file no longer exists',
  FILE_NAME_ALREADY_EXISTS: 'You already have a file with this name'
};

export const getFileError = (errorCode: FileErrorCode): ApiError<FileErrorCode> => ({
  error: FILE_ERRORS[errorCode],
  errorCode
});

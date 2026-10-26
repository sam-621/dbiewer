import type { WorkspaceErrorCode } from '../types';

import type { ApiError } from './api-error';

const WORKSPACE_ERRORS: Record<WorkspaceErrorCode, string> = {
  WORKSPACE_ALREADY_EXISTS: 'You already have a workspace'
};

export const getWorkspaceError = (errorCode: WorkspaceErrorCode): ApiError<WorkspaceErrorCode> => ({
  error: WORKSPACE_ERRORS[errorCode],
  errorCode
});

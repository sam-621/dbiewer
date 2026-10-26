import type { WorkspaceErrorCode } from '@/api/codegen';
import { BusinessError } from '@/shared/errors/business-error';

export class WorkspaceAlreadyExistsError extends BusinessError<WorkspaceErrorCode> {
  constructor(ownerUserId: string) {
    super('WORKSPACE_ALREADY_EXISTS', `Workspace already exists for user ${ownerUserId}`);
  }
}

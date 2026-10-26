import { DbiewerError } from '@/shared/errors/dbiewer-error';

export class WorkspaceAlreadyExistsError extends DbiewerError {
  constructor(ownerUserId: string) {
    super(`Workspace already exists for user ${ownerUserId}`);
  }
}

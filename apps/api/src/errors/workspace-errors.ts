import { DbiewerError } from '@/shared/errors/dbiewer-error';

export class WorkspaceNotFoundError extends DbiewerError {
  constructor(userId: string) {
    super(`Workspace not found for user ${userId}`);
  }
}

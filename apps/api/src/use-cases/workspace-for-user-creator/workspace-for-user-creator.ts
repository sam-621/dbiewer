import type { UowContext } from '@/persistence/unit-of-work';
import type { WorkspaceOwner } from '@/shared/utils/workspace-name';
import { getInitialWorkspaceValues } from '@/shared/utils/workspace-name';

export class WorkspaceForUserCreator {
  constructor(private readonly ctx: UowContext) {}

  async execute(user: WorkspaceOwner) {
    return this.ctx.repositories.workspace.create(getInitialWorkspaceValues(user));
  }
}

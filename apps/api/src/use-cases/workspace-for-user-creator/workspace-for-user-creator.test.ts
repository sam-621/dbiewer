import { beforeEach, describe, expect, test, vi } from 'vitest';

import type { Workspace, WorkspaceRepository } from '@/persistence/repositories/workspace';
import type { UowContext } from '@/persistence/unit-of-work';

import { WorkspaceForUserCreator } from './workspace-for-user-creator';

const user = { id: crypto.randomUUID(), name: 'Ada' };

const workspace: Workspace = {
  id: crypto.randomUUID(),
  ownerUserId: user.id,
  name: "Ada's workspace",
  createdAt: new Date('2026-10-25T12:00:00Z'),
  updatedAt: new Date('2026-10-25T12:00:00Z')
};

describe('WorkspaceForUserCreator.execute', () => {
  const create = vi.fn<WorkspaceRepository['create']>();

  const creator = new WorkspaceForUserCreator({
    repositories: { workspace: { create } as unknown as WorkspaceRepository }
  } as unknown as UowContext);

  beforeEach(() => {
    vi.resetAllMocks();
    create.mockResolvedValue(workspace);
  });

  test('creates the workspace named after the user', async () => {
    const created = await creator.execute(user);

    expect(create).toHaveBeenCalledWith({ ownerUserId: user.id, name: "Ada's workspace" });
    expect(created).toEqual(workspace);
  });

  test('creates the workspace with the trimmed name of the user', async () => {
    await creator.execute({ id: user.id, name: '  Ada  ' });

    expect(create).toHaveBeenCalledWith({ ownerUserId: user.id, name: "Ada's workspace" });
  });

  test('creates the workspace as My workspace when the user has no name', async () => {
    await creator.execute({ id: user.id, name: '' });

    expect(create).toHaveBeenCalledWith({ ownerUserId: user.id, name: 'My workspace' });
  });

  test('creates the workspace as My workspace when the name of the user is blank', async () => {
    await creator.execute({ id: user.id, name: '   ' });

    expect(create).toHaveBeenCalledWith({ ownerUserId: user.id, name: 'My workspace' });
  });
});

import { beforeEach, describe, expect, test, vi } from 'vitest';

import type { Workspace, WorkspaceRepository } from '@/persistence/repositories/workspace';
import type { UowContext } from '@/persistence/unit-of-work';

import { WorkspaceForUserCreator } from './workspace-for-user-creator';

const user = { id: crypto.randomUUID(), name: 'Ada' };

const workspace: Workspace = {
  id: crypto.randomUUID(),
  ownerUserId: user.id,
  name: "Ada's workspace",
  slug: 'adas-workspace',
  createdAt: new Date('2026-10-25T12:00:00Z'),
  updatedAt: new Date('2026-10-25T12:00:00Z')
};

describe('WorkspaceForUserCreator.execute', () => {
  const create = vi.fn<WorkspaceRepository['create']>();
  const existsBySlug = vi.fn<WorkspaceRepository['existsBySlug']>();

  const creator = new WorkspaceForUserCreator({
    repositories: { workspace: { create, existsBySlug } as unknown as WorkspaceRepository }
  } as unknown as UowContext);

  beforeEach(() => {
    vi.resetAllMocks();
    create.mockResolvedValue(workspace);
    existsBySlug.mockResolvedValue(false);
  });

  test('creates the workspace named after the user', async () => {
    const created = await creator.execute(user);

    expect(create).toHaveBeenCalledWith({
      ownerUserId: user.id,
      name: "Ada's workspace",
      slug: 'adas-workspace'
    });
    expect(created).toEqual(workspace);
  });

  test('creates the workspace with the trimmed name of the user', async () => {
    await creator.execute({ id: user.id, name: '  Ada  ' });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Ada's workspace", slug: 'adas-workspace' })
    );
  });

  test('creates the workspace as My workspace when the user has no name', async () => {
    await creator.execute({ id: user.id, name: '' });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'My workspace', slug: 'my-workspace' })
    );
  });

  test('creates the workspace as My workspace when the name of the user is blank', async () => {
    await creator.execute({ id: user.id, name: '   ' });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'My workspace', slug: 'my-workspace' })
    );
  });

  test('creates the workspace with the slug of a name with accents and symbols', async () => {
    await creator.execute({ id: user.id, name: 'José & Ñandú' });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'jose-and-nandus-workspace' })
    );
  });

  test('creates the workspace with a random suffix when the slug is taken', async () => {
    existsBySlug.mockResolvedValue(true);

    await creator.execute(user);

    expect(existsBySlug).toHaveBeenCalledWith('adas-workspace');
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ slug: expect.stringMatching(/^adas-workspace-[a-z0-9]{6}$/) })
    );
  });
});

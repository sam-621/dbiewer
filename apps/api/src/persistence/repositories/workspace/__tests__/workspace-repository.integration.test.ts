import { destroyDatabase, loadFixtures, resetDatabase, testDatabase } from '@tests/utils/database';
import { eq } from 'drizzle-orm';
import { afterAll, afterEach, beforeEach, describe, expect, test } from 'vitest';

import type { WorkspaceRepository } from '@/persistence/repositories/workspace';
import type { RLSContext } from '@/persistence/rls';
import { workspace } from '@/persistence/schema';
import { UnitOfWork } from '@/persistence/unit-of-work';

import { UserConstants, UserFixtures } from './fixtures/user.fixtures';
import { WorkspaceConstants, WorkspaceFixtures } from './fixtures/workspace.fixtures';

describe('WorkspaceRepository', () => {
  const withRepository = <T>(
    run: (repository: WorkspaceRepository) => Promise<T>,
    rlsContext: RLSContext = {}
  ) =>
    new UnitOfWork(testDatabase, rlsContext).execute(repositories => run(repositories.workspace));

  beforeEach(async () => {
    await loadFixtures([new UserFixtures(), new WorkspaceFixtures()]);
  });

  afterEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await destroyDatabase();
  });

  describe('findByOwnerUserId', () => {
    test('returns the workspace of the owner', async () => {
      const found = await withRepository(repository =>
        repository.findByOwnerUserId(UserConstants.OwnerUserId)
      );

      expect(found).toMatchObject({
        id: WorkspaceConstants.OwnerWorkspaceId,
        ownerUserId: UserConstants.OwnerUserId,
        name: "Ada's workspace"
      });
    });

    test('returns null for a user without workspace', async () => {
      const found = await withRepository(repository =>
        repository.findByOwnerUserId(UserConstants.UserWithoutWorkspaceId)
      );

      expect(found).toBeNull();
    });
  });

  describe('without the tenant of the workspace', () => {
    test('returns the workspace of the owner with another tenant or none', async () => {
      const withOtherTenant = await withRepository(
        repository => repository.findByOwnerUserId(UserConstants.OwnerUserId),
        { tenantId: WorkspaceConstants.OtherOwnerWorkspaceId }
      );
      const withoutTenant = await withRepository(
        repository => repository.findByOwnerUserId(UserConstants.OwnerUserId),
        { tenantId: null }
      );

      expect(withOtherTenant?.id).toBe(WorkspaceConstants.OwnerWorkspaceId);
      expect(withoutTenant?.id).toBe(WorkspaceConstants.OwnerWorkspaceId);
    });

    test('adds the workspace of an owner with another tenant', async () => {
      const rlsContext = { tenantId: WorkspaceConstants.OtherOwnerWorkspaceId };

      const created = await withRepository(
        repository =>
          repository.create({
            ownerUserId: UserConstants.UserWithoutWorkspaceId,
            name: 'My workspace'
          }),
        rlsContext
      );
      const found = await withRepository(
        repository => repository.findByOwnerUserId(UserConstants.UserWithoutWorkspaceId),
        rlsContext
      );

      expect(found).toEqual(created);
    });
  });

  describe('create', () => {
    test('adds the workspace of the owner', async () => {
      const created = await withRepository(repository =>
        repository.create({
          ownerUserId: UserConstants.UserWithoutWorkspaceId,
          name: 'My workspace'
        })
      );

      const rows = await testDatabase
        .select()
        .from(workspace)
        .where(eq(workspace.ownerUserId, UserConstants.UserWithoutWorkspaceId));

      expect(rows).toEqual([created]);
      expect(created.name).toBe('My workspace');
    });

    test('does not add a second workspace for the same owner', async () => {
      await expect(
        withRepository(repository =>
          repository.create({ ownerUserId: UserConstants.OwnerUserId, name: 'Another workspace' })
        )
      ).rejects.toThrow();

      const rows = await testDatabase
        .select()
        .from(workspace)
        .where(eq(workspace.ownerUserId, UserConstants.OwnerUserId));

      expect(rows.map(row => row.id)).toEqual([WorkspaceConstants.OwnerWorkspaceId]);
    });
  });
});

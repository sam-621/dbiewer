import {
  destroyDatabase,
  loadFixtures,
  resetDatabase,
  testAppDatabase,
  testDatabase
} from '@tests/utils/database';
import { eq } from 'drizzle-orm';
import { afterAll, afterEach, beforeEach, describe, expect, test } from 'vitest';

import type { ConnectionRepository } from '@/persistence/repositories/connection';
import type { RLSContext } from '@/persistence/rls';
import { connection } from '@/persistence/schema';
import { UnitOfWork } from '@/persistence/unit-of-work';

import { ConnectionConstants, ConnectionFixtures } from './fixtures/connection.fixtures';
import { UserFixtures } from './fixtures/user.fixtures';
import { WorkspaceConstants, WorkspaceFixtures } from './fixtures/workspace.fixtures';

describe('ConnectionRepository', () => {
  const ownerRlsContext = { tenantId: WorkspaceConstants.OwnerWorkspaceId };
  const otherOwnerRlsContext = { tenantId: WorkspaceConstants.OtherOwnerWorkspaceId };

  const withRepository = <T>(
    run: (repository: ConnectionRepository) => Promise<T>,
    rlsContext: RLSContext
  ) =>
    new UnitOfWork(testAppDatabase, rlsContext).execute(repositories =>
      run(repositories.connection)
    );

  const findRow = async (id: string) => {
    const [row] = await testDatabase.select().from(connection).where(eq(connection.id, id));

    return row ?? null;
  };

  beforeEach(async () => {
    await loadFixtures([new UserFixtures(), new WorkspaceFixtures(), new ConnectionFixtures()]);
  });

  afterEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await destroyDatabase();
  });

  describe('findAll', () => {
    test('returns the workspace connections by newest creation date and then by id', async () => {
      const found = await withRepository(repository => repository.findAll(), ownerRlsContext);

      expect(found.map(row => row.id)).toEqual([
        ConnectionConstants.ProductionConnectionId,
        ConnectionConstants.StagingConnectionId,
        ConnectionConstants.LocalConnectionId
      ]);
    });
  });

  describe('existsByName', () => {
    test('returns true for a name taken with another capitalization', async () => {
      const exists = await withRepository(
        repository => repository.existsByName('PRODUCTION'),
        ownerRlsContext
      );

      expect(exists).toBe(true);
    });

    test('returns true for a name taken by another connection than the excluded one', async () => {
      const exists = await withRepository(
        repository =>
          repository.existsByName('staging', ConnectionConstants.ProductionConnectionId),
        ownerRlsContext
      );

      expect(exists).toBe(true);
    });

    test('returns false for a free name', async () => {
      const exists = await withRepository(
        repository => repository.existsByName('Reporting'),
        ownerRlsContext
      );

      expect(exists).toBe(false);
    });

    test('returns false for the name of the excluded connection', async () => {
      const exists = await withRepository(
        repository =>
          repository.existsByName('production', ConnectionConstants.ProductionConnectionId),
        ownerRlsContext
      );

      expect(exists).toBe(false);
    });
  });

  describe('unique name index', () => {
    test('adds a connection with a name taken in another workspace', async () => {
      const id = crypto.randomUUID();

      await withRepository(
        repository =>
          repository.insert({
            id,
            name: 'PRODUCTION',
            host: 'db.example.com',
            port: 5432,
            database: 'app',
            username: 'grace',
            passwordEncrypted: null,
            sslMode: 'require'
          }),
        otherOwnerRlsContext
      );

      expect(await findRow(id)).toMatchObject({
        tenantId: WorkspaceConstants.OtherOwnerWorkspaceId,
        name: 'PRODUCTION'
      });
    });

    test('does not add a connection with a name taken in the workspace with another capitalization', async () => {
      const id = crypto.randomUUID();

      await expect(
        withRepository(
          repository =>
            repository.insert({
              id,
              name: 'PRODUCTION',
              host: 'db.example.com',
              port: 5432,
              database: 'app',
              username: 'ada',
              passwordEncrypted: null,
              sslMode: 'require'
            }),
          ownerRlsContext
        )
      ).rejects.toThrow();

      expect(await findRow(id)).toBeNull();
    });

    test('does not update the name to one taken in the workspace with another capitalization', async () => {
      await expect(
        withRepository(
          repository =>
            repository.update(
              { id: ConnectionConstants.ProductionConnectionId },
              { name: 'STAGING' }
            ),
          ownerRlsContext
        )
      ).rejects.toThrow();

      expect((await findRow(ConnectionConstants.ProductionConnectionId))?.name).toBe('Production');
    });
  });
});

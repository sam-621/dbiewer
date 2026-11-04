import {
  destroyDatabase,
  loadFixtures,
  resetDatabase,
  testAppDatabase,
  testDatabase
} from '@tests/utils/database';
import { eq } from 'drizzle-orm';
import { afterAll, afterEach, beforeEach, describe, expect, test } from 'vitest';

import type { FileRepository } from '@/persistence/repositories/file';
import type { RLSContext } from '@/persistence/rls';
import { file } from '@/persistence/schema';
import { UnitOfWork } from '@/persistence/unit-of-work';

import { ConnectionConstants, ConnectionFixtures } from './fixtures/connection.fixtures';
import { FileConstants, FileFixtures } from './fixtures/file.fixtures';
import { UserFixtures } from './fixtures/user.fixtures';
import { WorkspaceConstants, WorkspaceFixtures } from './fixtures/workspace.fixtures';

describe('FileRepository', () => {
  const ownerRlsContext = { tenantId: WorkspaceConstants.OwnerWorkspaceId };

  const withRepository = <T>(
    run: (repository: FileRepository) => Promise<T>,
    rlsContext: RLSContext
  ) => new UnitOfWork(testAppDatabase, rlsContext).execute(repositories => run(repositories.file));

  const findRow = async (id: string) => {
    const [row] = await testDatabase.select().from(file).where(eq(file.id, id));

    return row ?? null;
  };

  beforeEach(async () => {
    await loadFixtures([
      new UserFixtures(),
      new WorkspaceFixtures(),
      new ConnectionFixtures(),
      new FileFixtures()
    ]);
  });

  afterEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await destroyDatabase();
  });

  describe('insert', () => {
    test('adds a file with the tenant of the context', async () => {
      const id = crypto.randomUUID();

      await withRepository(
        repository =>
          repository.insert({
            id,
            connectionId: ConnectionConstants.ProductionConnectionId,
            name: 'Revenue',
            type: 'sql',
            content: 'select 6'
          }),
        ownerRlsContext
      );

      expect(await findRow(id)).toMatchObject({
        tenantId: WorkspaceConstants.OwnerWorkspaceId,
        connectionId: ConnectionConstants.ProductionConnectionId,
        name: 'Revenue',
        type: 'sql',
        content: 'select 6'
      });
    });
  });

  describe('update', () => {
    test('updates the update date', async () => {
      await withRepository(
        repository =>
          repository.update({ id: FileConstants.MonthlyReportFileId }, { content: 'select 7' }),
        ownerRlsContext
      );

      const row = await findRow(FileConstants.MonthlyReportFileId);

      expect(row?.content).toBe('select 7');
      expect(row?.updatedAt.getTime()).toBeGreaterThan(new Date('2026-02-02T00:00:00Z').getTime());
    });
  });

  describe('unique name index', () => {
    test('adds a file with a name taken by a file of another type', async () => {
      const id = crypto.randomUUID();

      await withRepository(
        repository =>
          repository.insert({
            id,
            connectionId: ConnectionConstants.ProductionConnectionId,
            name: 'Monthly report',
            type: 'txt',
            content: 'Notes'
          }),
        ownerRlsContext
      );

      expect(await findRow(id)).toMatchObject({ name: 'Monthly report', type: 'txt' });
    });

    test('adds a file with a name taken in another connection', async () => {
      const id = crypto.randomUUID();

      await withRepository(
        repository =>
          repository.insert({
            id,
            connectionId: ConnectionConstants.StagingConnectionId,
            name: 'Monthly report',
            type: 'sql',
            content: 'select 8'
          }),
        ownerRlsContext
      );

      expect(await findRow(id)).toMatchObject({
        connectionId: ConnectionConstants.StagingConnectionId,
        name: 'Monthly report'
      });
    });

    test('does not add a file with a name taken in the connection for its type with another capitalization', async () => {
      const id = crypto.randomUUID();

      await expect(
        withRepository(
          repository =>
            repository.insert({
              id,
              connectionId: ConnectionConstants.ProductionConnectionId,
              name: 'MONTHLY REPORT',
              type: 'sql',
              content: 'select 9'
            }),
          ownerRlsContext
        )
      ).rejects.toThrow();

      expect(await findRow(id)).toBeNull();
    });

    test('does not update the name to one taken in the connection for its type with another capitalization', async () => {
      await expect(
        withRepository(
          repository =>
            repository.update({ id: FileConstants.MonthlyReportFileId }, { name: 'ACTIVE USERS' }),
          ownerRlsContext
        )
      ).rejects.toThrow();

      expect((await findRow(FileConstants.MonthlyReportFileId))?.name).toBe('Monthly report');
    });
  });

  describe('connection removal', () => {
    test('removes the files of the removed connection', async () => {
      await new UnitOfWork(testAppDatabase, ownerRlsContext).execute(repositories =>
        repositories.connection.remove({ id: ConnectionConstants.ProductionConnectionId })
      );

      expect(await findRow(FileConstants.MonthlyReportFileId)).toBeNull();
      expect(await findRow(FileConstants.StagingFileId)).not.toBeNull();
    });
  });

  describe('tenant isolation', () => {
    test('does not find a file of another workspace', async () => {
      const found = await withRepository(
        repository => repository.findOne({ id: FileConstants.OtherWorkspaceFileId }),
        ownerRlsContext
      );

      expect(found).toBeNull();
    });

    test('does not remove a file of another workspace', async () => {
      const removed = await withRepository(
        repository => repository.remove({ id: FileConstants.OtherWorkspaceFileId }),
        ownerRlsContext
      );

      expect(removed).toEqual([]);
      expect(await findRow(FileConstants.OtherWorkspaceFileId)).not.toBeNull();
    });
  });
});

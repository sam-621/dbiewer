import { destroyDatabase, loadFixtures, resetDatabase } from '@tests/utils/database';
import { TestServer } from '@tests/utils/test-server';
import { afterAll, afterEach, beforeEach, describe, expect, test } from 'vitest';

import { ConnectionConstants, ConnectionFixtures } from './fixtures/connection.fixtures';
import { FileConstants, FileFixtures } from './fixtures/file.fixtures';
import { UserConstants, UserFixtures } from './fixtures/user.fixtures';
import { WorkspaceFixtures } from './fixtures/workspace.fixtures';

const FILES_QUERY = /* GraphQL */ `
  query Files($connectionId: ID!) {
    files(connectionId: $connectionId) {
      items {
        id
        name
        type
        content
        updatedAt
      }
    }
  }
`;

type FilesResponse = {
  files: {
    items: Array<{
      id: string;
      name: string;
      type: string;
      content: string;
      updatedAt: string;
    }>;
  };
};

describe('files', () => {
  const testServer = new TestServer();

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
    await testServer.teardown();
  });

  test('returns the files of the connection from the most recently updated, tied by id', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<FilesResponse>(
      FILES_QUERY,
      { connectionId: ConnectionConstants.ProductionConnectionId },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.files.items).toEqual([
      {
        id: FileConstants.LatestOrdersFileId,
        name: 'Latest orders',
        type: 'SQL',
        content: 'select 3',
        updatedAt: '2026-02-03T00:00:00.000Z'
      },
      {
        id: FileConstants.MonthlyReportFileId,
        name: 'Monthly report',
        type: 'SQL',
        content: 'select 1',
        updatedAt: '2026-02-02T00:00:00.000Z'
      },
      {
        id: FileConstants.ActiveUsersFileId,
        name: 'Active users',
        type: 'SQL',
        content: 'select 2',
        updatedAt: '2026-02-02T00:00:00.000Z'
      },
      {
        id: FileConstants.ReleaseNotesFileId,
        name: 'Release notes',
        type: 'TXT',
        content: 'Notes',
        updatedAt: '2026-02-01T00:00:00.000Z'
      }
    ]);
  });

  test('returns an empty list when the connection does not exist', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<FilesResponse>(
      FILES_QUERY,
      { connectionId: crypto.randomUUID() },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.files.items).toEqual([]);
  });

  test('returns an empty list for a connection of another workspace', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<FilesResponse>(
      FILES_QUERY,
      { connectionId: ConnectionConstants.OtherWorkspaceConnectionId },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.files.items).toEqual([]);
  });

  test('returns UNAUTHENTICATED when there is no session', async () => {
    const response = await testServer.query<FilesResponse>(FILES_QUERY, {
      connectionId: ConnectionConstants.ProductionConnectionId
    });

    expect(response.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
    expect(response.data?.files).toBeUndefined();
  });
});

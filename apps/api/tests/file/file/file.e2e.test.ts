import { destroyDatabase, loadFixtures, resetDatabase } from '@tests/utils/database';
import { TestServer } from '@tests/utils/test-server';
import { afterAll, afterEach, beforeEach, describe, expect, test } from 'vitest';

import { ConnectionFixtures } from './fixtures/connection.fixtures';
import { FileConstants, FileFixtures } from './fixtures/file.fixtures';
import { UserConstants, UserFixtures } from './fixtures/user.fixtures';
import { WorkspaceFixtures } from './fixtures/workspace.fixtures';

const FILE_QUERY = /* GraphQL */ `
  query File($id: ID!) {
    file(id: $id) {
      id
      name
      type
      content
      updatedAt
    }
  }
`;

type FileResponse = {
  file: {
    id: string;
    name: string;
    type: string;
    content: string;
    updatedAt: string;
  } | null;
};

describe('file', () => {
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

  test('returns the file', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<FileResponse>(
      FILE_QUERY,
      { id: FileConstants.ReleaseNotesFileId },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.file).toEqual({
      id: FileConstants.ReleaseNotesFileId,
      name: 'Release notes',
      type: 'TXT',
      content: 'Notes',
      updatedAt: '2026-02-01T00:00:00.000Z'
    });
  });

  test('returns null when the file does not exist', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<FileResponse>(
      FILE_QUERY,
      { id: crypto.randomUUID() },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.file).toBeNull();
  });

  test('returns null for a file of another workspace', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<FileResponse>(
      FILE_QUERY,
      { id: FileConstants.OtherWorkspaceFileId },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.file).toBeNull();
  });

  test('returns UNAUTHENTICATED when there is no session', async () => {
    const response = await testServer.query<FileResponse>(FILE_QUERY, {
      id: FileConstants.ReleaseNotesFileId
    });

    expect(response.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
    expect(response.data?.file).toBeNull();
  });
});

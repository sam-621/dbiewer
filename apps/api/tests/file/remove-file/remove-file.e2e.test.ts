import { destroyDatabase, loadFixtures, resetDatabase, testDatabase } from '@tests/utils/database';
import { TestServer } from '@tests/utils/test-server';
import { eq } from 'drizzle-orm';
import { afterAll, afterEach, beforeEach, describe, expect, test } from 'vitest';

import { file } from '@/persistence/schema';

import { ConnectionFixtures } from './fixtures/connection.fixtures';
import { FileConstants, FileFixtures } from './fixtures/file.fixtures';
import { UserConstants, UserFixtures } from './fixtures/user.fixtures';
import { WorkspaceFixtures } from './fixtures/workspace.fixtures';

const REMOVE_FILE_MUTATION = /* GraphQL */ `
  mutation RemoveFile($id: ID!) {
    removeFile(id: $id) {
      apiErrors {
        code
        message
      }
      success
    }
  }
`;

type RemoveFileResponse = {
  removeFile: {
    apiErrors: Array<{ code: string; message: string }>;
    success: boolean | null;
  };
};

const findFile = async (id: string) => {
  const [row] = await testDatabase.select().from(file).where(eq(file.id, id));

  return row;
};

describe('removeFile', () => {
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

  test('removes the file', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<RemoveFileResponse>(
      REMOVE_FILE_MUTATION,
      { id: FileConstants.MonthlyReportFileId },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.removeFile).toEqual({ apiErrors: [], success: true });
    expect(await findFile(FileConstants.MonthlyReportFileId)).toBeUndefined();
  });

  test('returns FILE_NOT_FOUND when the file does not exist', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<RemoveFileResponse>(
      REMOVE_FILE_MUTATION,
      { id: '00000000-0000-0000-0000-000000000099' },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.removeFile).toEqual({
      apiErrors: [
        {
          code: 'FILE_NOT_FOUND',
          message: 'File not found with id 00000000-0000-0000-0000-000000000099'
        }
      ],
      success: null
    });
    expect(await findFile(FileConstants.MonthlyReportFileId)).toBeDefined();
  });

  test('returns FILE_NOT_FOUND for a file of another workspace', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<RemoveFileResponse>(
      REMOVE_FILE_MUTATION,
      { id: FileConstants.OtherWorkspaceFileId },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.removeFile).toEqual({
      apiErrors: [
        {
          code: 'FILE_NOT_FOUND',
          message: `File not found with id ${FileConstants.OtherWorkspaceFileId}`
        }
      ],
      success: null
    });
    expect(await findFile(FileConstants.OtherWorkspaceFileId)).toBeDefined();
  });

  test('returns UNAUTHENTICATED when there is no session', async () => {
    const response = await testServer.query<RemoveFileResponse>(REMOVE_FILE_MUTATION, {
      id: FileConstants.MonthlyReportFileId
    });

    expect(response.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
    expect(await findFile(FileConstants.MonthlyReportFileId)).toBeDefined();
  });
});

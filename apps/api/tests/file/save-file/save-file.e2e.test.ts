import { destroyDatabase, loadFixtures, resetDatabase, testDatabase } from '@tests/utils/database';
import { TestServer } from '@tests/utils/test-server';
import { eq } from 'drizzle-orm';
import { afterAll, afterEach, beforeEach, describe, expect, test } from 'vitest';

import { file } from '@/persistence/schema';

import { ConnectionConstants, ConnectionFixtures } from './fixtures/connection.fixtures';
import { FileConstants, FileFixtures } from './fixtures/file.fixtures';
import { UserConstants, UserFixtures } from './fixtures/user.fixtures';
import { WorkspaceConstants, WorkspaceFixtures } from './fixtures/workspace.fixtures';

const SAVE_FILE_MUTATION = /* GraphQL */ `
  mutation SaveFile($input: SaveFileInput!) {
    saveFile(input: $input) {
      apiErrors {
        code
        message
      }
      file {
        id
        name
        type
        content
      }
    }
  }
`;

type SaveFileResponse = {
  saveFile: {
    apiErrors: Array<{ code: string; message: string }>;
    file: {
      id: string;
      name: string;
      type: string;
      content: string;
    } | null;
  };
};

const validInput = {
  connectionId: ConnectionConstants.ProductionConnectionId,
  name: 'Weekly report',
  type: 'SQL',
  content: 'select 10'
};

const findFile = async (id: string) => {
  const [row] = await testDatabase.select().from(file).where(eq(file.id, id));

  return row;
};

const findConnectionFiles = (connectionId: string) =>
  testDatabase.select().from(file).where(eq(file.connectionId, connectionId));

describe('saveFile', () => {
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

  test('adds the file with the trimmed name in the workspace of the session', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<SaveFileResponse>(
      SAVE_FILE_MUTATION,
      { input: { ...validInput, name: '  Weekly report  ' } },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.saveFile).toEqual({
      apiErrors: [],
      file: {
        id: expect.any(String),
        name: 'Weekly report',
        type: 'SQL',
        content: 'select 10'
      }
    });
    expect(await findFile(response.data?.saveFile.file?.id ?? '')).toMatchObject({
      tenantId: WorkspaceConstants.OwnerWorkspaceId,
      connectionId: ConnectionConstants.ProductionConnectionId,
      name: 'Weekly report',
      type: 'sql',
      content: 'select 10'
    });
  });

  test('updates the name and the content of the file', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<SaveFileResponse>(
      SAVE_FILE_MUTATION,
      { input: { ...validInput, id: FileConstants.MonthlyReportFileId } },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.saveFile).toEqual({
      apiErrors: [],
      file: {
        id: FileConstants.MonthlyReportFileId,
        name: 'Weekly report',
        type: 'SQL',
        content: 'select 10'
      }
    });
    expect(await findFile(FileConstants.MonthlyReportFileId)).toMatchObject({
      name: 'Weekly report',
      content: 'select 10'
    });
  });

  test('does not change the type when updating the file', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<SaveFileResponse>(
      SAVE_FILE_MUTATION,
      {
        input: {
          ...validInput,
          id: FileConstants.MonthlyReportFileId,
          name: 'Monthly report',
          type: 'TXT'
        }
      },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.saveFile).toEqual({
      apiErrors: [],
      file: {
        id: FileConstants.MonthlyReportFileId,
        name: 'Monthly report',
        type: 'SQL',
        content: 'select 10'
      }
    });
    expect((await findFile(FileConstants.MonthlyReportFileId))?.type).toBe('sql');
  });

  test('removes the extension of its type from the name', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<SaveFileResponse>(
      SAVE_FILE_MUTATION,
      { input: { ...validInput, name: 'Weekly report.sql' } },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.saveFile.apiErrors).toEqual([]);
    expect(response.data?.saveFile.file?.name).toBe('Weekly report');
    expect((await findFile(response.data?.saveFile.file?.id ?? ''))?.name).toBe('Weekly report');
  });

  test('adds a file with the name of a file of another type', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<SaveFileResponse>(
      SAVE_FILE_MUTATION,
      { input: { ...validInput, name: 'Monthly report', type: 'TXT' } },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.saveFile.apiErrors).toEqual([]);
    expect(response.data?.saveFile.file).toMatchObject({ name: 'Monthly report', type: 'TXT' });
    expect(await findFile(response.data?.saveFile.file?.id ?? '')).toMatchObject({
      name: 'Monthly report',
      type: 'txt'
    });
  });

  test('returns FILE_NAME_ALREADY_EXISTS when adding a file with a taken name', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<SaveFileResponse>(
      SAVE_FILE_MUTATION,
      { input: { ...validInput, name: 'Monthly report' } },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.saveFile).toEqual({
      apiErrors: [
        {
          code: 'FILE_NAME_ALREADY_EXISTS',
          message: 'File name Monthly report already exists'
        }
      ],
      file: null
    });
    expect(await findConnectionFiles(ConnectionConstants.ProductionConnectionId)).toHaveLength(2);
  });

  test('returns FILE_NAME_ALREADY_EXISTS when renaming a file to a taken name', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<SaveFileResponse>(
      SAVE_FILE_MUTATION,
      {
        input: { ...validInput, id: FileConstants.ActiveUsersFileId, name: 'Monthly report' }
      },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.saveFile).toEqual({
      apiErrors: [
        {
          code: 'FILE_NAME_ALREADY_EXISTS',
          message: 'File name Monthly report already exists'
        }
      ],
      file: null
    });
    expect(await findFile(FileConstants.ActiveUsersFileId)).toMatchObject({
      name: 'Active users',
      content: 'select 2'
    });
  });

  test('returns FILE_NOT_FOUND when the file does not exist', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<SaveFileResponse>(
      SAVE_FILE_MUTATION,
      { input: { ...validInput, id: '00000000-0000-0000-0000-000000000099' } },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.saveFile).toEqual({
      apiErrors: [
        {
          code: 'FILE_NOT_FOUND',
          message: 'File not found with id 00000000-0000-0000-0000-000000000099'
        }
      ],
      file: null
    });
    expect(await findConnectionFiles(ConnectionConstants.ProductionConnectionId)).toHaveLength(2);
  });

  test('returns FILE_NOT_FOUND when the file is of another connection', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<SaveFileResponse>(
      SAVE_FILE_MUTATION,
      {
        input: {
          ...validInput,
          id: FileConstants.MonthlyReportFileId,
          connectionId: ConnectionConstants.StagingConnectionId
        }
      },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.saveFile).toEqual({
      apiErrors: [
        {
          code: 'FILE_NOT_FOUND',
          message: `File not found with id ${FileConstants.MonthlyReportFileId}`
        }
      ],
      file: null
    });
    expect(await findFile(FileConstants.MonthlyReportFileId)).toMatchObject({
      name: 'Monthly report',
      connectionId: ConnectionConstants.ProductionConnectionId
    });
  });

  test('returns CONNECTION_NOT_FOUND when the connection does not exist', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<SaveFileResponse>(
      SAVE_FILE_MUTATION,
      { input: { ...validInput, connectionId: '00000000-0000-0000-0000-000000000099' } },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.saveFile).toEqual({
      apiErrors: [
        {
          code: 'CONNECTION_NOT_FOUND',
          message: 'Connection not found with id 00000000-0000-0000-0000-000000000099'
        }
      ],
      file: null
    });
    expect(await findConnectionFiles(ConnectionConstants.ProductionConnectionId)).toHaveLength(2);
  });

  test('returns INVALID_INPUT when the name is blank', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<SaveFileResponse>(
      SAVE_FILE_MUTATION,
      { input: { ...validInput, name: '   ' } },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.saveFile).toEqual({
      apiErrors: [
        {
          code: 'INVALID_INPUT',
          message: '✖ Too small: expected string to have >=1 characters\n  → at name'
        }
      ],
      file: null
    });
    expect(await findConnectionFiles(ConnectionConstants.ProductionConnectionId)).toHaveLength(2);
  });

  test('returns CONNECTION_NOT_FOUND for a connection of another workspace', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<SaveFileResponse>(
      SAVE_FILE_MUTATION,
      { input: { ...validInput, connectionId: ConnectionConstants.OtherWorkspaceConnectionId } },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.saveFile).toEqual({
      apiErrors: [
        {
          code: 'CONNECTION_NOT_FOUND',
          message: `Connection not found with id ${ConnectionConstants.OtherWorkspaceConnectionId}`
        }
      ],
      file: null
    });
    expect(await findConnectionFiles(ConnectionConstants.OtherWorkspaceConnectionId)).toHaveLength(
      1
    );
  });

  test('returns FILE_NOT_FOUND for a file of another workspace', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<SaveFileResponse>(
      SAVE_FILE_MUTATION,
      { input: { ...validInput, id: FileConstants.OtherWorkspaceFileId } },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.saveFile).toEqual({
      apiErrors: [
        {
          code: 'FILE_NOT_FOUND',
          message: `File not found with id ${FileConstants.OtherWorkspaceFileId}`
        }
      ],
      file: null
    });
    expect((await findFile(FileConstants.OtherWorkspaceFileId))?.name).toBe('Warehouse load');
  });

  test('returns UNAUTHENTICATED when there is no session', async () => {
    const response = await testServer.query<SaveFileResponse>(SAVE_FILE_MUTATION, {
      input: validInput
    });

    expect(response.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
    expect(await findConnectionFiles(ConnectionConstants.ProductionConnectionId)).toHaveLength(2);
  });
});

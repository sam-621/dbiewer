import { destroyDatabase, loadFixtures, resetDatabase, testDatabase } from '@tests/utils/database';
import { TestServer } from '@tests/utils/test-server';
import { eq } from 'drizzle-orm';
import { afterAll, afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { connection } from '@/persistence/schema';

import { ConnectionConstants, ConnectionFixtures } from './fixtures/connection.fixtures';
import { UserConstants, UserFixtures } from './fixtures/user.fixtures';
import { WorkspaceFixtures } from './fixtures/workspace.fixtures';

const REMOVE_CONNECTION_MUTATION = /* GraphQL */ `
  mutation RemoveConnection($id: ID!) {
    removeConnection(id: $id) {
      apiErrors {
        code
        message
      }
      success
    }
  }
`;

type RemoveConnectionResponse = {
  removeConnection: {
    apiErrors: Array<{ code: string; message: string }>;
    success: boolean | null;
  };
};

const findConnection = async (id: string) => {
  const [row] = await testDatabase.select().from(connection).where(eq(connection.id, id));

  return row;
};

describe('removeConnection', () => {
  const testServer = new TestServer();

  beforeEach(async () => {
    await loadFixtures([new UserFixtures(), new WorkspaceFixtures(), new ConnectionFixtures()]);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await resetDatabase();
  });

  afterAll(async () => {
    await destroyDatabase();
    await testServer.teardown();
  });

  test('removes the connection', async () => {
    const discardPool = vi.spyOn(testServer.appContext.services.postgresService, 'discardPool');
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<RemoveConnectionResponse>(
      REMOVE_CONNECTION_MUTATION,
      { id: ConnectionConstants.ProductionConnectionId },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.removeConnection).toEqual({ apiErrors: [], success: true });
    expect(await findConnection(ConnectionConstants.ProductionConnectionId)).toBeUndefined();
    expect(discardPool).toHaveBeenCalledWith(ConnectionConstants.ProductionConnectionId);
  });

  test('returns CONNECTION_NOT_FOUND when the connection does not exist', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<RemoveConnectionResponse>(
      REMOVE_CONNECTION_MUTATION,
      { id: '00000000-0000-0000-0000-000000000099' },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.removeConnection).toEqual({
      apiErrors: [
        {
          code: 'CONNECTION_NOT_FOUND',
          message: 'Connection not found with id 00000000-0000-0000-0000-000000000099'
        }
      ],
      success: null
    });
    expect(await findConnection(ConnectionConstants.ProductionConnectionId)).toBeDefined();
  });

  test('returns CONNECTION_NOT_FOUND for a connection of another workspace', async () => {
    const discardPool = vi.spyOn(testServer.appContext.services.postgresService, 'discardPool');
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<RemoveConnectionResponse>(
      REMOVE_CONNECTION_MUTATION,
      { id: ConnectionConstants.OtherWorkspaceConnectionId },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.removeConnection).toEqual({
      apiErrors: [
        {
          code: 'CONNECTION_NOT_FOUND',
          message: `Connection not found with id ${ConnectionConstants.OtherWorkspaceConnectionId}`
        }
      ],
      success: null
    });
    expect(await findConnection(ConnectionConstants.OtherWorkspaceConnectionId)).toBeDefined();
    expect(discardPool).not.toHaveBeenCalled();
  });

  test('returns UNAUTHENTICATED when there is no session', async () => {
    const response = await testServer.query<RemoveConnectionResponse>(REMOVE_CONNECTION_MUTATION, {
      id: ConnectionConstants.ProductionConnectionId
    });

    expect(response.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
    expect(await findConnection(ConnectionConstants.ProductionConnectionId)).toBeDefined();
  });
});

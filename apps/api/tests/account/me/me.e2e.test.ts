import { destroyDatabase, loadFixtures, resetDatabase } from '@tests/utils/database';
import { TestServer } from '@tests/utils/test-server';
import { afterAll, afterEach, beforeEach, describe, expect, test } from 'vitest';

import { UserConstants, UserFixtures } from './fixtures/user.fixtures';
import { WorkspaceConstants, WorkspaceFixtures } from './fixtures/workspace.fixtures';

const ME_QUERY = /* GraphQL */ `
  query Me {
    me {
      user {
        id
        name
        email
        image
      }
      workspace {
        id
        name
      }
    }
  }
`;

type MeResponse = {
  me: {
    user: { id: string; name: string; email: string; image: string | null };
    workspace: { id: string; name: string } | null;
  } | null;
};

describe('me', () => {
  const testServer = new TestServer();

  beforeEach(async () => {
    await loadFixtures([new UserFixtures(), new WorkspaceFixtures()]);
  });

  afterEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await destroyDatabase();
    await testServer.teardown();
  });

  test('returns the user and the workspace of the session', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<MeResponse>(ME_QUERY, {}, headers);

    expect(response.errors).toBeUndefined();
    expect(response.data?.me).toEqual({
      user: {
        id: UserConstants.OwnerUserId,
        name: 'Ada',
        email: 'ada@example.com',
        image: 'https://example.com/ada.png'
      },
      workspace: { id: WorkspaceConstants.OwnerWorkspaceId, name: "Ada's workspace" }
    });
  });

  test('returns a null workspace instead of the workspace of another user', async () => {
    const headers = await testServer.signIn(UserConstants.UserWithoutWorkspaceEmail);

    const response = await testServer.query<MeResponse>(ME_QUERY, {}, headers);

    expect(response.errors).toBeUndefined();
    expect(response.data?.me).toEqual({
      user: {
        id: UserConstants.UserWithoutWorkspaceId,
        name: 'Alan',
        email: 'alan@example.com',
        image: null
      },
      workspace: null
    });
  });

  test('returns null when there is no session', async () => {
    const response = await testServer.query<MeResponse>(ME_QUERY);

    expect(response.errors).toBeUndefined();
    expect(response.data?.me).toBeNull();
  });
});

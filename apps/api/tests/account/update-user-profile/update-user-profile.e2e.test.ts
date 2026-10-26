import { destroyDatabase, loadFixtures, resetDatabase, testDatabase } from '@tests/utils/database';
import { TestServer } from '@tests/utils/test-server';
import { eq } from 'drizzle-orm';
import { afterAll, afterEach, beforeEach, describe, expect, test } from 'vitest';

import { user } from '@/persistence/schema';

import { UserConstants, UserFixtures } from './fixtures/user.fixtures';

const UPDATE_USER_PROFILE_MUTATION = /* GraphQL */ `
  mutation UpdateUserProfile($input: UpdateUserProfileInput!) {
    updateUserProfile(input: $input) {
      apiErrors {
        code
        message
      }
      user {
        id
        name
        email
        image
      }
    }
  }
`;

const ME_QUERY = /* GraphQL */ `
  query Me {
    me {
      user {
        name
      }
    }
  }
`;

type UpdateUserProfileResponse = {
  updateUserProfile: {
    apiErrors: Array<{ code: string; message: string }>;
    user: { id: string; name: string; email: string; image: string | null } | null;
  };
};

type MeResponse = {
  me: { user: { name: string } } | null;
};

const findNameOf = async (userId: string) => {
  const [row] = await testDatabase
    .select({ name: user.name })
    .from(user)
    .where(eq(user.id, userId));

  return row?.name;
};

describe('updateUserProfile', () => {
  const testServer = new TestServer();

  beforeEach(async () => {
    await loadFixtures([new UserFixtures()]);
  });

  afterEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await destroyDatabase();
    await testServer.teardown();
  });

  test('updates the name of the user with the given name trimmed', async () => {
    const headers = await testServer.signIn(UserConstants.UserEmail);

    const response = await testServer.query<UpdateUserProfileResponse>(
      UPDATE_USER_PROFILE_MUTATION,
      { input: { name: '  José Ñandú  ' } },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.updateUserProfile).toEqual({
      apiErrors: [],
      user: {
        id: UserConstants.UserId,
        name: 'José Ñandú',
        email: 'ada@example.com',
        image: 'https://example.com/ada.png'
      }
    });
    expect(await findNameOf(UserConstants.UserId)).toBe('José Ñandú');

    const meResponse = await testServer.query<MeResponse>(ME_QUERY, {}, headers);

    expect(meResponse.data?.me?.user.name).toBe('José Ñandú');
  });

  test('returns USER_NAME_REQUIRED when the name is blank', async () => {
    const headers = await testServer.signIn(UserConstants.UserEmail);

    const response = await testServer.query<UpdateUserProfileResponse>(
      UPDATE_USER_PROFILE_MUTATION,
      { input: { name: '   ' } },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.updateUserProfile).toEqual({
      apiErrors: [
        {
          code: 'USER_NAME_REQUIRED',
          message: `Name is required for user ${UserConstants.UserId}`
        }
      ],
      user: null
    });
    expect(await findNameOf(UserConstants.UserId)).toBe('Ada');
  });

  test('returns USER_NAME_TOO_LONG when the name exceeds 50 characters', async () => {
    const headers = await testServer.signIn(UserConstants.UserEmail);

    const response = await testServer.query<UpdateUserProfileResponse>(
      UPDATE_USER_PROFILE_MUTATION,
      { input: { name: 'a'.repeat(51) } },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.updateUserProfile).toEqual({
      apiErrors: [
        {
          code: 'USER_NAME_TOO_LONG',
          message: `Name of user ${UserConstants.UserId} has 51 characters and exceeds 50`
        }
      ],
      user: null
    });
    expect(await findNameOf(UserConstants.UserId)).toBe('Ada');
  });

  test('does not modify the name of another user', async () => {
    const headers = await testServer.signIn(UserConstants.UserEmail);

    const response = await testServer.query<UpdateUserProfileResponse>(
      UPDATE_USER_PROFILE_MUTATION,
      { input: { name: 'Lovelace' } },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.updateUserProfile.apiErrors).toEqual([]);
    expect(await findNameOf(UserConstants.OtherUserId)).toBe('Grace');
  });

  test('returns UNAUTHENTICATED when there is no session', async () => {
    const response = await testServer.query<UpdateUserProfileResponse>(
      UPDATE_USER_PROFILE_MUTATION,
      { input: { name: 'Lovelace' } }
    );

    expect(response.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
    expect(await findNameOf(UserConstants.UserId)).toBe('Ada');
  });
});

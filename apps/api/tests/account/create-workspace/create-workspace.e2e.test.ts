import { destroyDatabase, loadFixtures, resetDatabase, testDatabase } from '@tests/utils/database';
import { TestServer } from '@tests/utils/test-server';
import { eq } from 'drizzle-orm';
import { afterAll, afterEach, beforeEach, describe, expect, test } from 'vitest';

import { workspace } from '@/persistence/schema';

import { UserConstants, UserFixtures } from './fixtures/user.fixtures';
import { WorkspaceConstants, WorkspaceFixtures } from './fixtures/workspace.fixtures';

const CREATE_WORKSPACE_MUTATION = /* GraphQL */ `
  mutation CreateWorkspace($input: CreateWorkspaceInput!) {
    createWorkspace(input: $input) {
      apiErrors {
        code
        message
      }
      workspace {
        id
        name
      }
    }
  }
`;

type CreateWorkspaceResponse = {
  createWorkspace: {
    apiErrors: Array<{ code: string; message: string }>;
    workspace: { id: string; name: string } | null;
  };
};

const findWorkspacesOf = (ownerUserId: string) =>
  testDatabase.select().from(workspace).where(eq(workspace.ownerUserId, ownerUserId));

describe('createWorkspace', () => {
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

  test('creates the workspace of the user with the given name', async () => {
    const headers = await testServer.signIn(UserConstants.UserWithoutWorkspaceEmail);

    const response = await testServer.query<CreateWorkspaceResponse>(
      CREATE_WORKSPACE_MUTATION,
      { input: { name: "José & Ñandú's team" } },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.createWorkspace.apiErrors).toEqual([]);
    expect(response.data?.createWorkspace.workspace?.name).toBe("José & Ñandú's team");

    const workspaces = await findWorkspacesOf(UserConstants.UserWithoutWorkspaceId);

    expect(workspaces).toHaveLength(1);
    expect(workspaces[0]).toMatchObject({
      id: response.data?.createWorkspace.workspace?.id,
      name: "José & Ñandú's team",
      slug: 'jose-and-nandus-team'
    });
  });

  test('returns WORKSPACE_ALREADY_EXISTS when the user already has a workspace', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<CreateWorkspaceResponse>(
      CREATE_WORKSPACE_MUTATION,
      { input: { name: 'My team' } },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.createWorkspace).toEqual({
      apiErrors: [
        {
          code: 'WORKSPACE_ALREADY_EXISTS',
          message: `Workspace already exists for user ${UserConstants.OwnerUserId}`
        }
      ],
      workspace: null
    });

    const workspaces = await findWorkspacesOf(UserConstants.OwnerUserId);

    expect(workspaces).toHaveLength(1);
    expect(workspaces[0]?.id).toBe(WorkspaceConstants.OwnerWorkspaceId);
  });

  test('does not modify the workspace of another user with the same slug', async () => {
    const headers = await testServer.signIn(UserConstants.UserWithoutWorkspaceEmail);

    const response = await testServer.query<CreateWorkspaceResponse>(
      CREATE_WORKSPACE_MUTATION,
      { input: { name: 'Acme' } },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.createWorkspace.apiErrors).toEqual([]);

    const [created] = await findWorkspacesOf(UserConstants.UserWithoutWorkspaceId);
    const [other] = await findWorkspacesOf(UserConstants.OtherOwnerUserId);

    expect(created?.slug).toMatch(/^acme-[a-z0-9]{6}$/);
    expect(other).toMatchObject({
      id: WorkspaceConstants.OtherOwnerWorkspaceId,
      name: 'Acme',
      slug: WorkspaceConstants.OtherOwnerWorkspaceSlug
    });
  });

  test('returns UNAUTHENTICATED when there is no session', async () => {
    const response = await testServer.query<CreateWorkspaceResponse>(CREATE_WORKSPACE_MUTATION, {
      input: { name: 'My team' }
    });

    expect(response.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
    expect(await findWorkspacesOf(UserConstants.UserWithoutWorkspaceId)).toHaveLength(0);
  });
});

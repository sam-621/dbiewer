/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type { DocumentTypeDecoration } from '@graphql-typed-document-node/core';
export type ConnectionErrorCode =
  | 'CONNECTION_NAME_ALREADY_EXISTS'
  | 'CONNECTION_NOT_FOUND'
  | 'INVALID_INPUT';

export type ConnectionSslMode =
  | 'DISABLE'
  | 'REQUIRE'
  | 'VERIFY_FULL';

export type CreateConnectionInput = {
  database: string;
  host: string;
  name: string;
  password?: string | null | undefined;
  port: number;
  sslMode: ConnectionSslMode;
  username: string;
};

export type CreateWorkspaceInput = {
  name: string;
};

export type TestConnectionInput = {
  database?: string | null | undefined;
  host?: string | null | undefined;
  password?: string | null | undefined;
  port?: number | null | undefined;
  sslMode?: ConnectionSslMode | null | undefined;
  username?: string | null | undefined;
};

export type UpdateUserProfileInput = {
  name: string;
};

export type UserErrorCode =
  | 'USER_NAME_REQUIRED'
  | 'USER_NAME_TOO_LONG';

export type WorkspaceErrorCode =
  | 'WORKSPACE_ALREADY_EXISTS';

export type GetMeQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMeQuery = { me: { user: { id: string, name: string, email: string, image: string | null }, workspace: { id: string, name: string } | null } | null };

export type UpdateUserProfileMutationVariables = Exact<{
  input: UpdateUserProfileInput;
}>;


export type UpdateUserProfileMutation = { updateUserProfile: { apiErrors: Array<{ code: UserErrorCode, message: string }>, user: { id: string, name: string } | null } };

export type CreateWorkspaceMutationVariables = Exact<{
  input: CreateWorkspaceInput;
}>;


export type CreateWorkspaceMutation = { createWorkspace: { apiErrors: Array<{ code: WorkspaceErrorCode, message: string }>, workspace: { id: string, name: string } | null } };

export type CommonConnectionFragment = { id: string, name: string, host: string, port: number, database: string, username: string, hasPassword: boolean, sslMode: ConnectionSslMode } & { ' $fragmentName'?: 'CommonConnectionFragment' };

export type GetConnectionsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetConnectionsQuery = { connections: { items: Array<{ ' $fragmentRefs'?: { 'CommonConnectionFragment': CommonConnectionFragment } }> } };

export type CreateConnectionMutationVariables = Exact<{
  input: CreateConnectionInput;
}>;


export type CreateConnectionMutation = { createConnection: { apiErrors: Array<{ code: ConnectionErrorCode, message: string }>, connection: { ' $fragmentRefs'?: { 'CommonConnectionFragment': CommonConnectionFragment } } | null } };

export type RemoveConnectionMutationVariables = Exact<{
  connectionId: string | number;
}>;


export type RemoveConnectionMutation = { removeConnection: { success: boolean | null, apiErrors: Array<{ code: ConnectionErrorCode, message: string }> } };

export type TestConnectionMutationVariables = Exact<{
  input: TestConnectionInput;
}>;


export type TestConnectionMutation = { testConnection: { success: boolean | null, apiErrors: Array<{ code: ConnectionErrorCode, message: string }> } };

export class TypedDocumentString<TResult, TVariables>
  extends String
  implements DocumentTypeDecoration<TResult, TVariables>
{
  __apiType?: NonNullable<DocumentTypeDecoration<TResult, TVariables>['__apiType']>;
  private value: string;
  public __meta__?: Record<string, any> | undefined;

  constructor(value: string, __meta__?: Record<string, any> | undefined) {
    super(value);
    this.value = value;
    this.__meta__ = __meta__;
  }

  override toString(): string & DocumentTypeDecoration<TResult, TVariables> {
    return this.value;
  }
}
export const CommonConnectionFragmentDoc = new TypedDocumentString(`
    fragment CommonConnection on Connection {
  id
  name
  host
  port
  database
  username
  hasPassword
  sslMode
}
    `, {"fragmentName":"CommonConnection"}) as unknown as TypedDocumentString<CommonConnectionFragment, unknown>;
export const GetMeDocument = new TypedDocumentString(`
    query GetMe {
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
    `) as unknown as TypedDocumentString<GetMeQuery, GetMeQueryVariables>;
export const UpdateUserProfileDocument = new TypedDocumentString(`
    mutation UpdateUserProfile($input: UpdateUserProfileInput!) {
  updateUserProfile(input: $input) {
    apiErrors {
      code
      message
    }
    user {
      id
      name
    }
  }
}
    `) as unknown as TypedDocumentString<UpdateUserProfileMutation, UpdateUserProfileMutationVariables>;
export const CreateWorkspaceDocument = new TypedDocumentString(`
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
    `) as unknown as TypedDocumentString<CreateWorkspaceMutation, CreateWorkspaceMutationVariables>;
export const GetConnectionsDocument = new TypedDocumentString(`
    query GetConnections {
  connections {
    items {
      ...CommonConnection
    }
  }
}
    fragment CommonConnection on Connection {
  id
  name
  host
  port
  database
  username
  hasPassword
  sslMode
}`) as unknown as TypedDocumentString<GetConnectionsQuery, GetConnectionsQueryVariables>;
export const CreateConnectionDocument = new TypedDocumentString(`
    mutation CreateConnection($input: CreateConnectionInput!) {
  createConnection(input: $input) {
    apiErrors {
      code
      message
    }
    connection {
      ...CommonConnection
    }
  }
}
    fragment CommonConnection on Connection {
  id
  name
  host
  port
  database
  username
  hasPassword
  sslMode
}`) as unknown as TypedDocumentString<CreateConnectionMutation, CreateConnectionMutationVariables>;
export const RemoveConnectionDocument = new TypedDocumentString(`
    mutation RemoveConnection($connectionId: ID!) {
  removeConnection(id: $connectionId) {
    apiErrors {
      code
      message
    }
    success
  }
}
    `) as unknown as TypedDocumentString<RemoveConnectionMutation, RemoveConnectionMutationVariables>;
export const TestConnectionDocument = new TypedDocumentString(`
    mutation TestConnection($input: TestConnectionInput!) {
  testConnection(input: $input) {
    apiErrors {
      code
      message
    }
    success
  }
}
    `) as unknown as TypedDocumentString<TestConnectionMutation, TestConnectionMutationVariables>;
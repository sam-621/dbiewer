/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type { DocumentTypeDecoration } from '@graphql-typed-document-node/core';
export type CreateWorkspaceInput = {
  name: string;
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
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

export type DbFilterInput = {
  column: string;
  operator: DbFilterOperator;
  value?: string | null | undefined;
};

export type DbFilterOperator =
  | 'CONTAINS'
  | 'EQ'
  | 'GT'
  | 'GTE'
  | 'IS_NOT_NULL'
  | 'IS_NULL'
  | 'LT'
  | 'LTE'
  | 'NEQ';

export type DbFunctionKind =
  | 'FUNCTION'
  | 'PROCEDURE';

export type DbObjectInput = {
  connectionId: string | number;
  name: string;
  schema: string;
};

export type DbOrderInput = {
  column: string;
  direction: SortDirection;
};

export type RunQueryInput = {
  connectionId: string | number;
  sql: string;
};

export type ShellErrorCode =
  | 'CONNECTION_FAILED'
  | 'CONNECTION_NOT_FOUND'
  | 'INVALID_INPUT'
  | 'OBJECT_NOT_FOUND'
  | 'QUERY_FAILED';

export type SortDirection =
  | 'ASC'
  | 'DESC';

export type TableRowsInput = {
  connectionId: string | number;
  filters?: Array<DbFilterInput> | null | undefined;
  name: string;
  orderBy?: DbOrderInput | null | undefined;
  page: number;
  schema: string;
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

export type TestConnectionMutationVariables = Exact<{
  input: TestConnectionInput;
}>;


export type TestConnectionMutation = { testConnection: { success: boolean | null, apiErrors: Array<{ code: ConnectionErrorCode, message: string }> } };

export type GetConnectionSchemaQueryVariables = Exact<{
  connectionId: string | number;
}>;


export type GetConnectionSchemaQuery = { connectionSchema: { apiErrors: Array<{ code: ShellErrorCode, message: string }>, schemas: Array<{ name: string, tables: Array<{ name: string, columns: Array<{ name: string, type: string, isPrimaryKey: boolean, isForeignKey: boolean }> }>, views: Array<{ name: string, columns: Array<{ name: string, type: string, isPrimaryKey: boolean, isForeignKey: boolean }> }>, functions: Array<{ name: string, arguments: string, kind: DbFunctionKind }> }> | null } };

export type GetTableStructureQueryVariables = Exact<{
  input: DbObjectInput;
}>;


export type GetTableStructureQuery = { tableStructure: { apiErrors: Array<{ code: ShellErrorCode, message: string }>, structure: { definition: string, columns: Array<{ name: string, type: string, isNullable: boolean, default: string | null, isPrimaryKey: boolean }>, indexes: Array<{ name: string, definition: string, isUnique: boolean }>, foreignKeys: Array<{ columns: Array<string>, referencedSchema: string, referencedTable: string, referencedColumns: Array<string>, onDelete: string }> } | null } };

export type GetTableRowsQueryVariables = Exact<{
  input: TableRowsInput;
}>;


export type GetTableRowsQuery = { tableRows: { apiErrors: Array<{ code: ShellErrorCode, message: string }>, tableRows: { rows: Array<Array<string | null>>, totalRows: number, columns: Array<{ name: string, type: string }> } | null } };

export type RunQueryMutationVariables = Exact<{
  input: RunQueryInput;
}>;


export type RunQueryMutation = { runQuery: { apiErrors: Array<{ code: ShellErrorCode, message: string }>, execution: { rows: Array<Array<string | null>>, rowCount: number, isTruncated: boolean, durationMs: number, command: string, columns: Array<{ name: string, type: string }> } | null } };

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
export const GetConnectionSchemaDocument = new TypedDocumentString(`
    query GetConnectionSchema($connectionId: ID!) {
  connectionSchema(connectionId: $connectionId) {
    apiErrors {
      code
      message
    }
    schemas {
      name
      tables {
        name
        columns {
          name
          type
          isPrimaryKey
          isForeignKey
        }
      }
      views {
        name
        columns {
          name
          type
          isPrimaryKey
          isForeignKey
        }
      }
      functions {
        name
        arguments
        kind
      }
    }
  }
}
    `) as unknown as TypedDocumentString<GetConnectionSchemaQuery, GetConnectionSchemaQueryVariables>;
export const GetTableStructureDocument = new TypedDocumentString(`
    query GetTableStructure($input: DbObjectInput!) {
  tableStructure(input: $input) {
    apiErrors {
      code
      message
    }
    structure {
      columns {
        name
        type
        isNullable
        default
        isPrimaryKey
      }
      indexes {
        name
        definition
        isUnique
      }
      foreignKeys {
        columns
        referencedSchema
        referencedTable
        referencedColumns
        onDelete
      }
      definition
    }
  }
}
    `) as unknown as TypedDocumentString<GetTableStructureQuery, GetTableStructureQueryVariables>;
export const GetTableRowsDocument = new TypedDocumentString(`
    query GetTableRows($input: TableRowsInput!) {
  tableRows(input: $input) {
    apiErrors {
      code
      message
    }
    tableRows {
      columns {
        name
        type
      }
      rows
      totalRows
    }
  }
}
    `) as unknown as TypedDocumentString<GetTableRowsQuery, GetTableRowsQueryVariables>;
export const RunQueryDocument = new TypedDocumentString(`
    mutation RunQuery($input: RunQueryInput!) {
  runQuery(input: $input) {
    apiErrors {
      code
      message
    }
    execution {
      columns {
        name
        type
      }
      rows
      rowCount
      isTruncated
      durationMs
      command
    }
  }
}
    `) as unknown as TypedDocumentString<RunQueryMutation, RunQueryMutationVariables>;
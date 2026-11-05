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

export type DbFunctionKind =
  | 'FUNCTION'
  | 'PROCEDURE';

export type DbObjectInput = {
  connectionId: string | number;
  name: string;
  schema: string;
};

export type DiagramRelationType =
  | 'MANY_TO_MANY'
  | 'MANY_TO_ONE'
  | 'ONE_TO_ONE';

export type FileErrorCode =
  | 'CONNECTION_NOT_FOUND'
  | 'FILE_NAME_ALREADY_EXISTS'
  | 'FILE_NOT_FOUND'
  | 'INVALID_INPUT';

export type FileType =
  | 'SQL'
  | 'TXT';

export type FunctionDefinitionInput = {
  arguments: string;
  connectionId: string | number;
  name: string;
  schema: string;
};

export type RunQueryInput = {
  connectionId: string | number;
  sql: string;
};

export type SaveFileInput = {
  connectionId: string | number;
  content: string;
  id?: string | number | null | undefined;
  name: string;
  type: FileType;
};

export type ShellErrorCode =
  | 'CONNECTION_FAILED'
  | 'CONNECTION_NOT_FOUND'
  | 'INVALID_INPUT'
  | 'OBJECT_NOT_FOUND'
  | 'QUERY_FAILED';

export type TableRowsInput = {
  connectionId: string | number;
  name: string;
  orderBy?: string | null | undefined;
  page: number;
  schema: string;
  where?: string | null | undefined;
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

export type GetFunctionDefinitionQueryVariables = Exact<{
  input: FunctionDefinitionInput;
}>;


export type GetFunctionDefinitionQuery = { functionDefinition: { definition: string | null, apiErrors: Array<{ code: ShellErrorCode, message: string }> } };

export type GetSchemaDiagramQueryVariables = Exact<{
  connectionId: string | number;
}>;


export type GetSchemaDiagramQuery = { schemaDiagram: { apiErrors: Array<{ code: ShellErrorCode, message: string }>, diagram: { entities: Array<{ id: string, schema: string, name: string, properties: Array<{ name: string, type: string, default: string | null, isNullable: boolean, isPrimaryKey: boolean, isForeignKey: boolean }> }>, relations: Array<{ id: string, type: DiagramRelationType, fromEntityId: string, fromProperties: Array<string>, toEntityId: string, toProperties: Array<string> }> } | null } };

export type CommonFileFragment = { id: string, name: string, type: FileType, content: string, updatedAt: string } & { ' $fragmentName'?: 'CommonFileFragment' };

export type GetFilesQueryVariables = Exact<{
  connectionId: string | number;
}>;


export type GetFilesQuery = { files: { items: Array<{ ' $fragmentRefs'?: { 'CommonFileFragment': CommonFileFragment } }> } };

export type GetFileQueryVariables = Exact<{
  id: string | number;
}>;


export type GetFileQuery = { file: { ' $fragmentRefs'?: { 'CommonFileFragment': CommonFileFragment } } | null };

export type SaveFileMutationVariables = Exact<{
  input: SaveFileInput;
}>;


export type SaveFileMutation = { saveFile: { apiErrors: Array<{ code: FileErrorCode, message: string }>, file: { ' $fragmentRefs'?: { 'CommonFileFragment': CommonFileFragment } } | null } };

export type RemoveFileMutationVariables = Exact<{
  id: string | number;
}>;


export type RemoveFileMutation = { removeFile: { success: boolean | null, apiErrors: Array<{ code: FileErrorCode, message: string }> } };

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
export const CommonFileFragmentDoc = new TypedDocumentString(`
    fragment CommonFile on File {
  id
  name
  type
  content
  updatedAt
}
    `, {"fragmentName":"CommonFile"}) as unknown as TypedDocumentString<CommonFileFragment, unknown>;
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
export const GetFunctionDefinitionDocument = new TypedDocumentString(`
    query GetFunctionDefinition($input: FunctionDefinitionInput!) {
  functionDefinition(input: $input) {
    apiErrors {
      code
      message
    }
    definition
  }
}
    `) as unknown as TypedDocumentString<GetFunctionDefinitionQuery, GetFunctionDefinitionQueryVariables>;
export const GetSchemaDiagramDocument = new TypedDocumentString(`
    query GetSchemaDiagram($connectionId: ID!) {
  schemaDiagram(connectionId: $connectionId) {
    apiErrors {
      code
      message
    }
    diagram {
      entities {
        id
        schema
        name
        properties {
          name
          type
          default
          isNullable
          isPrimaryKey
          isForeignKey
        }
      }
      relations {
        id
        type
        fromEntityId
        fromProperties
        toEntityId
        toProperties
      }
    }
  }
}
    `) as unknown as TypedDocumentString<GetSchemaDiagramQuery, GetSchemaDiagramQueryVariables>;
export const GetFilesDocument = new TypedDocumentString(`
    query GetFiles($connectionId: ID!) {
  files(connectionId: $connectionId) {
    items {
      ...CommonFile
    }
  }
}
    fragment CommonFile on File {
  id
  name
  type
  content
  updatedAt
}`) as unknown as TypedDocumentString<GetFilesQuery, GetFilesQueryVariables>;
export const GetFileDocument = new TypedDocumentString(`
    query GetFile($id: ID!) {
  file(id: $id) {
    ...CommonFile
  }
}
    fragment CommonFile on File {
  id
  name
  type
  content
  updatedAt
}`) as unknown as TypedDocumentString<GetFileQuery, GetFileQueryVariables>;
export const SaveFileDocument = new TypedDocumentString(`
    mutation SaveFile($input: SaveFileInput!) {
  saveFile(input: $input) {
    apiErrors {
      code
      message
    }
    file {
      ...CommonFile
    }
  }
}
    fragment CommonFile on File {
  id
  name
  type
  content
  updatedAt
}`) as unknown as TypedDocumentString<SaveFileMutation, SaveFileMutationVariables>;
export const RemoveFileDocument = new TypedDocumentString(`
    mutation RemoveFile($id: ID!) {
  removeFile(id: $id) {
    apiErrors {
      code
      message
    }
    success
  }
}
    `) as unknown as TypedDocumentString<RemoveFileMutation, RemoveFileMutationVariables>;
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
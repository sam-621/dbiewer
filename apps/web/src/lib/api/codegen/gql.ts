/* eslint-disable */
import * as types from './graphql';



/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  query GetMe {\n    me {\n      user {\n        id\n        name\n        email\n        image\n      }\n      workspace {\n        id\n        name\n      }\n    }\n  }\n": typeof types.GetMeDocument,
    "\n  mutation UpdateUserProfile($input: UpdateUserProfileInput!) {\n    updateUserProfile(input: $input) {\n      apiErrors {\n        code\n        message\n      }\n      user {\n        id\n        name\n      }\n    }\n  }\n": typeof types.UpdateUserProfileDocument,
    "\n  mutation CreateWorkspace($input: CreateWorkspaceInput!) {\n    createWorkspace(input: $input) {\n      apiErrors {\n        code\n        message\n      }\n      workspace {\n        id\n        name\n      }\n    }\n  }\n": typeof types.CreateWorkspaceDocument,
    "\n  fragment CommonConnection on Connection {\n    id\n    name\n    host\n    port\n    database\n    username\n    hasPassword\n    sslMode\n  }\n": typeof types.CommonConnectionFragmentDoc,
    "\n  query GetConnections {\n    connections {\n      items {\n        ...CommonConnection\n      }\n    }\n  }\n": typeof types.GetConnectionsDocument,
    "\n  mutation CreateConnection($input: CreateConnectionInput!) {\n    createConnection(input: $input) {\n      apiErrors {\n        code\n        message\n      }\n      connection {\n        ...CommonConnection\n      }\n    }\n  }\n": typeof types.CreateConnectionDocument,
    "\n  mutation RemoveConnection($connectionId: ID!) {\n    removeConnection(id: $connectionId) {\n      apiErrors {\n        code\n        message\n      }\n      success\n    }\n  }\n": typeof types.RemoveConnectionDocument,
    "\n  mutation TestConnection($input: TestConnectionInput!) {\n    testConnection(input: $input) {\n      apiErrors {\n        code\n        message\n      }\n      success\n    }\n  }\n": typeof types.TestConnectionDocument,
    "\n  query GetConnectionSchema($connectionId: ID!) {\n    connectionSchema(connectionId: $connectionId) {\n      apiErrors {\n        code\n        message\n      }\n      schemas {\n        name\n        tables {\n          name\n          columns {\n            name\n            type\n            isPrimaryKey\n            isForeignKey\n          }\n        }\n        views {\n          name\n          columns {\n            name\n            type\n            isPrimaryKey\n            isForeignKey\n          }\n        }\n        functions {\n          name\n          arguments\n          kind\n        }\n      }\n    }\n  }\n": typeof types.GetConnectionSchemaDocument,
    "\n  query GetTableStructure($input: DbObjectInput!) {\n    tableStructure(input: $input) {\n      apiErrors {\n        code\n        message\n      }\n      structure {\n        columns {\n          name\n          type\n          isNullable\n          default\n          isPrimaryKey\n        }\n        indexes {\n          name\n          definition\n          isUnique\n        }\n        foreignKeys {\n          columns\n          referencedSchema\n          referencedTable\n          referencedColumns\n          onDelete\n        }\n        definition\n      }\n    }\n  }\n": typeof types.GetTableStructureDocument,
    "\n  query GetTableRows($input: TableRowsInput!) {\n    tableRows(input: $input) {\n      apiErrors {\n        code\n        message\n      }\n      tableRows {\n        columns {\n          name\n          type\n        }\n        rows\n        totalRows\n      }\n    }\n  }\n": typeof types.GetTableRowsDocument,
};
const documents: Documents = {
    "\n  query GetMe {\n    me {\n      user {\n        id\n        name\n        email\n        image\n      }\n      workspace {\n        id\n        name\n      }\n    }\n  }\n": types.GetMeDocument,
    "\n  mutation UpdateUserProfile($input: UpdateUserProfileInput!) {\n    updateUserProfile(input: $input) {\n      apiErrors {\n        code\n        message\n      }\n      user {\n        id\n        name\n      }\n    }\n  }\n": types.UpdateUserProfileDocument,
    "\n  mutation CreateWorkspace($input: CreateWorkspaceInput!) {\n    createWorkspace(input: $input) {\n      apiErrors {\n        code\n        message\n      }\n      workspace {\n        id\n        name\n      }\n    }\n  }\n": types.CreateWorkspaceDocument,
    "\n  fragment CommonConnection on Connection {\n    id\n    name\n    host\n    port\n    database\n    username\n    hasPassword\n    sslMode\n  }\n": types.CommonConnectionFragmentDoc,
    "\n  query GetConnections {\n    connections {\n      items {\n        ...CommonConnection\n      }\n    }\n  }\n": types.GetConnectionsDocument,
    "\n  mutation CreateConnection($input: CreateConnectionInput!) {\n    createConnection(input: $input) {\n      apiErrors {\n        code\n        message\n      }\n      connection {\n        ...CommonConnection\n      }\n    }\n  }\n": types.CreateConnectionDocument,
    "\n  mutation RemoveConnection($connectionId: ID!) {\n    removeConnection(id: $connectionId) {\n      apiErrors {\n        code\n        message\n      }\n      success\n    }\n  }\n": types.RemoveConnectionDocument,
    "\n  mutation TestConnection($input: TestConnectionInput!) {\n    testConnection(input: $input) {\n      apiErrors {\n        code\n        message\n      }\n      success\n    }\n  }\n": types.TestConnectionDocument,
    "\n  query GetConnectionSchema($connectionId: ID!) {\n    connectionSchema(connectionId: $connectionId) {\n      apiErrors {\n        code\n        message\n      }\n      schemas {\n        name\n        tables {\n          name\n          columns {\n            name\n            type\n            isPrimaryKey\n            isForeignKey\n          }\n        }\n        views {\n          name\n          columns {\n            name\n            type\n            isPrimaryKey\n            isForeignKey\n          }\n        }\n        functions {\n          name\n          arguments\n          kind\n        }\n      }\n    }\n  }\n": types.GetConnectionSchemaDocument,
    "\n  query GetTableStructure($input: DbObjectInput!) {\n    tableStructure(input: $input) {\n      apiErrors {\n        code\n        message\n      }\n      structure {\n        columns {\n          name\n          type\n          isNullable\n          default\n          isPrimaryKey\n        }\n        indexes {\n          name\n          definition\n          isUnique\n        }\n        foreignKeys {\n          columns\n          referencedSchema\n          referencedTable\n          referencedColumns\n          onDelete\n        }\n        definition\n      }\n    }\n  }\n": types.GetTableStructureDocument,
    "\n  query GetTableRows($input: TableRowsInput!) {\n    tableRows(input: $input) {\n      apiErrors {\n        code\n        message\n      }\n      tableRows {\n        columns {\n          name\n          type\n        }\n        rows\n        totalRows\n      }\n    }\n  }\n": types.GetTableRowsDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetMe {\n    me {\n      user {\n        id\n        name\n        email\n        image\n      }\n      workspace {\n        id\n        name\n      }\n    }\n  }\n"): typeof import('./graphql').GetMeDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateUserProfile($input: UpdateUserProfileInput!) {\n    updateUserProfile(input: $input) {\n      apiErrors {\n        code\n        message\n      }\n      user {\n        id\n        name\n      }\n    }\n  }\n"): typeof import('./graphql').UpdateUserProfileDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateWorkspace($input: CreateWorkspaceInput!) {\n    createWorkspace(input: $input) {\n      apiErrors {\n        code\n        message\n      }\n      workspace {\n        id\n        name\n      }\n    }\n  }\n"): typeof import('./graphql').CreateWorkspaceDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment CommonConnection on Connection {\n    id\n    name\n    host\n    port\n    database\n    username\n    hasPassword\n    sslMode\n  }\n"): typeof import('./graphql').CommonConnectionFragmentDoc;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetConnections {\n    connections {\n      items {\n        ...CommonConnection\n      }\n    }\n  }\n"): typeof import('./graphql').GetConnectionsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateConnection($input: CreateConnectionInput!) {\n    createConnection(input: $input) {\n      apiErrors {\n        code\n        message\n      }\n      connection {\n        ...CommonConnection\n      }\n    }\n  }\n"): typeof import('./graphql').CreateConnectionDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RemoveConnection($connectionId: ID!) {\n    removeConnection(id: $connectionId) {\n      apiErrors {\n        code\n        message\n      }\n      success\n    }\n  }\n"): typeof import('./graphql').RemoveConnectionDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation TestConnection($input: TestConnectionInput!) {\n    testConnection(input: $input) {\n      apiErrors {\n        code\n        message\n      }\n      success\n    }\n  }\n"): typeof import('./graphql').TestConnectionDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetConnectionSchema($connectionId: ID!) {\n    connectionSchema(connectionId: $connectionId) {\n      apiErrors {\n        code\n        message\n      }\n      schemas {\n        name\n        tables {\n          name\n          columns {\n            name\n            type\n            isPrimaryKey\n            isForeignKey\n          }\n        }\n        views {\n          name\n          columns {\n            name\n            type\n            isPrimaryKey\n            isForeignKey\n          }\n        }\n        functions {\n          name\n          arguments\n          kind\n        }\n      }\n    }\n  }\n"): typeof import('./graphql').GetConnectionSchemaDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetTableStructure($input: DbObjectInput!) {\n    tableStructure(input: $input) {\n      apiErrors {\n        code\n        message\n      }\n      structure {\n        columns {\n          name\n          type\n          isNullable\n          default\n          isPrimaryKey\n        }\n        indexes {\n          name\n          definition\n          isUnique\n        }\n        foreignKeys {\n          columns\n          referencedSchema\n          referencedTable\n          referencedColumns\n          onDelete\n        }\n        definition\n      }\n    }\n  }\n"): typeof import('./graphql').GetTableStructureDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetTableRows($input: TableRowsInput!) {\n    tableRows(input: $input) {\n      apiErrors {\n        code\n        message\n      }\n      tableRows {\n        columns {\n          name\n          type\n        }\n        rows\n        totalRows\n      }\n    }\n  }\n"): typeof import('./graphql').GetTableRowsDocument;


export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

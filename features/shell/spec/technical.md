# Shell — especificación técnica

Reglas de negocio y decisiones en `product.md`.

## Conexión a la base del usuario (api)

- `PostgresService` (`src/services/postgres/`) suma un pool de `pg` por id de conexión, guardado en memoria. Cada pool tiene como máximo 3 clientes, se cierra tras 5 min sin uso y se descarta al actualizar o eliminar la conexión.
- Las credenciales se leen del repositorio dentro del `UnitOfWork` del workspace, y la contraseña se descifra con `EncryptionService.decrypt(passwordEncrypted, id)`. El service recibe las credenciales ya descifradas, sin tocar la base de la api.
- Cada cliente se abre con `statement_timeout` de 30 s (`options: '-c statement_timeout=30000'`) y los mismos modos de SSL que `testConnection`.
- Si no conecta, lanza `PostgresConnectionFailedError`. Si la query falla, lanza `PostgresQueryFailedError` con el mensaje de Postgres.
- Los identificadores se citan con `escapeIdentifier` de `pg` y los valores van siempre como parámetros (`$1`, `$2`…).

## Modelo

| Tabla | Columnas | Notas |
|-------|----------|-------|
| `query_history` | `id uuid`, `tenant_id uuid`, `connection_id uuid`, `sql text`, `status text`, `row_count integer` (nullable), `duration_ms integer`, `error_message text` (nullable), `executed_at timestamptz`, `created_at`, `updated_at` | Tenant con RLS. |
| `saved_query` | `id uuid`, `tenant_id uuid`, `connection_id uuid`, `name text`, `sql text`, `created_at`, `updated_at` | Tenant con RLS. |

- Las dos llevan `tenant_id` con el default, la policy, `ENABLE` y `FORCE` de `database.md`, y FK a `connection(id)` con `ON DELETE CASCADE`.
- `query_history.status` guarda `success` o `error`. Índice `query_history_connection_id_executed_at_idx` sobre `(connection_id, executed_at desc)`.
- Índice único `saved_query_connection_id_name_idx` sobre `(connection_id, lower(name))`.

## API GraphQL

Todo requiere sesión con workspace (`requireSession`). Cada operación recibe `connectionId` y devuelve `CONNECTION_NOT_FOUND` si la conexión no existe o es de otro workspace.

Errores nuevos en `ConnectionErrorCode` o en un enum propio del módulo:

| Código | Cuándo |
|--------|--------|
| `CONNECTION_FAILED` | No se pudo conectar a la base del usuario. |
| `QUERY_FAILED` | Postgres devolvió un error. El `message` es el de Postgres. |
| `OBJECT_NOT_FOUND` | La tabla, vista o función ya no existe. |
| `SAVED_QUERY_NOT_FOUND` | La query guardada no existe o es de otra conexión. |
| `SAVED_QUERY_NAME_ALREADY_EXISTS` | Nombre repetido en la conexión. |

### Esquema

```graphql
type DbSchema {
  name: String!
  tables: [DbTable!]!
  views: [DbView!]!
  functions: [DbFunction!]!
}

type DbTable {
  name: String!
  estimatedRows: Int
  columns: [DbColumn!]!
}

type DbView {
  name: String!
  columns: [DbColumn!]!
}

type DbColumn {
  name: String!
  type: String!
  isPrimaryKey: Boolean!
  isForeignKey: Boolean!
}

type DbFunction {
  name: String!
  arguments: String!
  kind: DbFunctionKind!
}

enum DbFunctionKind {
  FUNCTION
  PROCEDURE
}

type ConnectionSchemaResult {
  apiErrors: [ShellErrorResult!]!
  schemas: [DbSchema!]
}

type Query {
  connectionSchema(connectionId: ID!): ConnectionSchemaResult!
}
```

- Una sola consulta a `pg_catalog` (`pg_namespace`, `pg_class`, `pg_attribute`, `pg_constraint`, `pg_proc`) para todo el árbol. Excluye `pg_catalog`, `information_schema`, `pg_toast`, `pg_temp_*` y los esquemas sin objetos.
- Tablas: `relkind` `r` y `p` (particionadas). Vistas: `v` y `m` (materializadas). Funciones: `prokind` `f` y `p`, con `arguments` de `pg_get_function_identity_arguments`.
- `type` con `format_type(atttypid, atttypmod)`. `estimatedRows` es `reltuples`, o `null` si es `-1`.
- Orden alfabético en esquemas, objetos y por posición en columnas.

### Tabla

```graphql
input DbObjectInput {
  connectionId: ID!
  schema: String!
  name: String!
}

type DbTableStructure {
  columns: [DbColumnDetail!]!
  indexes: [DbIndex!]!
  foreignKeys: [DbForeignKey!]!
  definition: String!
}

type DbColumnDetail {
  name: String!
  type: String!
  isNullable: Boolean!
  default: String
  isPrimaryKey: Boolean!
}

type DbIndex {
  name: String!
  definition: String!
  isUnique: Boolean!
}

type DbForeignKey {
  columns: [String!]!
  referencedSchema: String!
  referencedTable: String!
  referencedColumns: [String!]!
  onDelete: String!
}

enum DbFilterOperator {
  EQ
  NEQ
  GT
  GTE
  LT
  LTE
  CONTAINS
  IS_NULL
  IS_NOT_NULL
}

input DbFilterInput {
  column: String!
  operator: DbFilterOperator!
  value: String
}

input DbOrderInput {
  column: String!
  direction: SortDirection!
}

input TableRowsInput {
  connectionId: ID!
  schema: String!
  name: String!
  filters: [DbFilterInput!]
  orderBy: DbOrderInput
  page: Int!
}

type DbResultColumn {
  name: String!
  type: String!
}

type TableRows {
  columns: [DbResultColumn!]!
  rows: [[String]!]!
  totalRows: Int!
}

type TableStructureResult {
  apiErrors: [ShellErrorResult!]!
  structure: DbTableStructure
}

type TableRowsResult {
  apiErrors: [ShellErrorResult!]!
  tableRows: TableRows
}

type FunctionDefinitionResult {
  apiErrors: [ShellErrorResult!]!
  definition: String
}

type Query {
  tableStructure(input: DbObjectInput!): TableStructureResult!
  tableRows(input: TableRowsInput!): TableRowsResult!
  functionDefinition(input: DbObjectInput!): FunctionDefinitionResult!
}
```

- Sirven para tablas y vistas. `definition` es el DDL armado de las columnas y constraints en una tabla, y `pg_get_viewdef` en una vista. Una vista devuelve `indexes` y `foreignKeys` vacíos.
- `functionDefinition` usa `pg_get_functiondef`.
- `tableRows` valida `filters` y `orderBy` contra las columnas reales: una columna que no existe es `INVALID_INPUT`. `CONTAINS` es `<col>::text ILIKE '%' || $n || '%'`. Los operadores de comparación y `CONTAINS` requieren `value`; sin él, `INVALID_INPUT`. Páginas de 50 con `LIMIT/OFFSET`, `page` desde 1. Sin `orderBy`, ordena por la PK si hay; con `orderBy`, desempata por la PK. El service arma el orden y la página, así lo cubre la integración.
- `totalRows` es un `count(*)` con los mismos filtros.
- Los valores salen como texto (`null` para `NULL`), tal como los devuelve `pg` con los parsers de tipo en texto, para no perder precisión en `numeric`, `bigint` o fechas.

### Ejecutar

```graphql
input RunQueryInput {
  connectionId: ID!
  sql: String!
}

type QueryExecution {
  columns: [DbResultColumn!]!
  rows: [[String]!]!
  rowCount: Int!
  isTruncated: Boolean!
  durationMs: Int!
  commands: [String!]!
}

type RunQueryResult {
  apiErrors: [ShellErrorResult!]!
  execution: QueryExecution
}

type QueryHistoryEntry {
  id: ID!
  sql: String!
  status: QueryHistoryStatus!
  rowCount: Int
  durationMs: Int!
  errorMessage: String
  executedAt: DateTime!
}

type QueryHistoryList {
  items: [QueryHistoryEntry!]!
}

type Query {
  queryHistory(connectionId: ID!): QueryHistoryList!
}

type Mutation {
  runQuery(input: RunQueryInput!): RunQueryResult!
}
```

- `runQuery` corre el SQL en un cliente del pool con el protocolo simple, así se aceptan varias sentencias. Las filas son las del último resultado que tenga filas; `commands` trae el tag de cada sentencia (`SELECT 7`, `UPDATE 3`).
- Devuelve como máximo 1,000 filas con `isTruncated` si había más. `rowCount` es el total que devolvió Postgres.
- Guarda una fila en `query_history` siempre, también si falla. Si falla, responde `QUERY_FAILED` con el mensaje de Postgres.
- `queryHistory` devuelve las últimas 100, ordenadas por `executed_at desc, id`.
- `status` se traduce con un enum resolver y `enumValues`, como `ConnectionSslMode`.

### Queries guardadas

```graphql
type SavedQuery {
  id: ID!
  name: String!
  sql: String!
  updatedAt: DateTime!
}

type SavedQueryList {
  items: [SavedQuery!]!
}

input CreateSavedQueryInput {
  connectionId: ID!
  name: String!
  sql: String!
}

input UpdateSavedQueryInput {
  id: ID!
  name: String!
  sql: String!
}

type SavedQueryResult {
  apiErrors: [ShellErrorResult!]!
  savedQuery: SavedQuery
}

type RemoveSavedQueryResult {
  apiErrors: [ShellErrorResult!]!
  success: Boolean
}

type Query {
  savedQueries(connectionId: ID!): SavedQueryList!
}

type Mutation {
  createSavedQuery(input: CreateSavedQueryInput!): SavedQueryResult!
  updateSavedQuery(input: UpdateSavedQueryInput!): SavedQueryResult!
  removeSavedQuery(id: ID!): RemoveSavedQueryResult!
}
```

- `savedQueries` ordena por `updated_at desc, id`.
- Nombre según `product.md`, validado con zod en el use-case. El nombre se guarda sin `.sql`; si el usuario lo escribe, se quita.

### Capas

| Capa | Archivo |
|------|---------|
| Schema | `src/api/schema/database-schema.gql`, `query.gql`, `saved-query.gql` |
| Resolvers | uno por archivo de schema en `src/api/resolvers/` |
| Use-cases | `src/modules/database-schema/use-cases/` (lectura del esquema, estructura, filas, definición), `src/modules/query/use-cases/` (`query-runner.ts`), `src/modules/saved-query/use-cases/` (creator, updater, remover) |
| Services | `src/services/postgres/`: pool, introspección y ejecución |
| Repositorios | `src/persistence/repositories/query-history/`, `src/persistence/repositories/saved-query/` |

Las operaciones que leen la base del usuario sí llevan use-case: tienen que leer la conexión, descifrar la contraseña y llamar al service.

## Web

- **Conexión activa:** `useActiveConnection` en `src/lib/workspace/hooks/`, con el id en `localStorage` (`dbiewer:active-connection`). Si el id guardado ya no existe, usa la conexión más reciente.
- **Pestañas:** estado por conexión en `localStorage` (`dbiewer:tabs:<connectionId>`): lista de pestañas, activa y cuál es provisional. Los borradores sin guardar van en `dbiewer:draft:<connectionId>:<tabKey>`. Todo leído y escrito con `try/catch`: si falla, el shell arranca sin pestañas.
- **Clave de pestaña:** `table:<schema>.<name>`, `view:<schema>.<name>`, `function:<schema>.<name>(<args>)`, `query:<savedQueryId>` y `draft:<uuid>` para una query sin guardar.
- **Módulos:**
  - `src/lib/workspace/`: `WorkspaceLayout` con el selector de conexión, el shell (sidebar y área de pestañas) y el estado de pestañas.
  - `src/lib/database-schema/`: explorador, pestaña de tabla o vista (Data y Structure) y pestaña de función.
  - `src/lib/query/`: pestaña SQL, editor, panel de resultados, historial y queries guardadas.
- **Editor:** CodeMirror 6 con `@codemirror/lang-sql` (dialecto Postgres) y `sql-formatter` para "Format". La sentencia bajo el cursor se toma separando por `;` fuera de strings y comentarios.
- **Grilla:** el componente `table` de coss, con encabezado fijo y scroll horizontal. Sin virtualización: el máximo es 1,000 filas.
- **Cache keys:** el esquema por `connectionId`; la estructura y las filas por `connectionId`, objeto, filtros, orden y página. "Reload" en el explorador o en la tabla los vuelve a pedir.
- Después de `runQuery` se refresca `queryHistory`. Después de crear, editar o eliminar una query guardada, `savedQueries`.

## Impacto en código existente

- `apps/api/src/services/postgres/postgres-service.ts`: pool, introspección y ejecución, además de `testConnection`.
- `apps/api/src/modules/connection/use-cases/connection-updater.ts` y `connection-remover.ts`: descartan el pool de la conexión.
- `apps/api/src/persistence/schema/`: tablas `query_history` y `saved_query`, con sus migraciones generada y custom.
- `apps/api/codegen.ts`: `enumValues` de `QueryHistoryStatus`.
- `apps/web/src/lib/workspace/components/workspace-layout/workspace-layout.tsx`: suma el selector de conexión en el header.
- `apps/web/src/lib/workspace/pages/workspace-page.tsx`: muestra el shell en lugar del listado temporal.
- `apps/web/src/lib/connection/components/connections-dev-list/`: se borra.
- `apps/web/package.json`: CodeMirror y `sql-formatter`.
- Locales `en.json` y `es.json`: textos del shell.

## Tests

- **api, integración:** repositorios de `query_history` y `saved_query`, incluido el índice único por nombre.
- **api, e2e:** contra la DB de test como base del usuario. `connectionSchema` con esquemas, vistas y funciones de un fixture; `tableStructure`, `tableRows` (filtros, orden, paginación, columna inválida, `OBJECT_NOT_FOUND`); `runQuery` (varias sentencias, truncado, error de Postgres, que guarda historial en los dos casos); `queryHistory`; CRUD de `saved_query` con sus errores; `CONNECTION_NOT_FOUND`, `CONNECTION_FAILED`, aislamiento entre workspaces y `UNAUTHENTICATED`.
- **web, unit:** estado de pestañas (provisional, reemplazo, fijar, persistencia por conexión, `localStorage` que falla), sentencia bajo el cursor, explorador (buscador, un solo esquema), pestaña de tabla y pestaña SQL con el fetcher mockeado.

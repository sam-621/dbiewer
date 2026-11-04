# Shell — especificación técnica

Reglas de negocio y decisiones en `product.md`.

## Conexión a la base del usuario (api)

- `PostgresService` (`src/services/postgres/`) suma un pool de `pg` por id de conexión, guardado en memoria. Cada pool tiene como máximo 3 clientes, se cierra tras 5 min sin uso y se descarta al actualizar o eliminar la conexión.
- Las credenciales se leen del repositorio dentro del `UnitOfWork` del workspace, y la contraseña se descifra con `EncryptionService.decrypt(passwordEncrypted, id)`. El service recibe las credenciales ya descifradas, sin tocar la base de la api.
- Cada cliente se abre con `statement_timeout` de 30 s (`options: '-c statement_timeout=30000'`) y los mismos modos de SSL que `testConnection`.
- Si no conecta, lanza `PostgresConnectionFailedError`. Si la query falla, lanza `PostgresQueryFailedError` con el mensaje de Postgres.
- Los identificadores se citan con `escapeIdentifier` de `pg` y los valores van siempre como parámetros (`$1`, `$2`…). La excepción son los fragmentos `where` y `orderBy` de `tableRows`, que escribe el usuario.

## Modelo

| Tabla | Columnas | Notas |
|-------|----------|-------|
| `file` | `id uuid`, `tenant_id uuid`, `connection_id uuid`, `name text`, `type text`, `content text`, `created_at`, `updated_at` | Tenant con RLS. `type` es `text` en la base y enum (`sql`, `txt`) en el código. |

- Lleva `tenant_id` con el default, la policy, `ENABLE` y `FORCE` de `database.md`, y FK a `connection(id)` con `ON DELETE CASCADE`.
- Índice único `file_connection_id_type_name_idx` sobre `(connection_id, type, lower(name))`.

## API GraphQL

Todo requiere sesión con workspace (`requireSession`). Cada operación recibe `connectionId` y devuelve `CONNECTION_NOT_FOUND` si la conexión no existe o es de otro workspace.

Errores nuevos en `ConnectionErrorCode` o en un enum propio del módulo:

| Código | Cuándo |
|--------|--------|
| `CONNECTION_FAILED` | No se pudo conectar a la base del usuario. |
| `QUERY_FAILED` | Postgres devolvió un error. El `message` es el de Postgres. |
| `OBJECT_NOT_FOUND` | La tabla, vista o función ya no existe. |
| `FILE_NOT_FOUND` | El archivo no existe o es de otra conexión. |
| `FILE_NAME_ALREADY_EXISTS` | Nombre repetido en la conexión para ese tipo. |

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

input TableRowsInput {
  connectionId: ID!
  schema: String!
  name: String!
  where: String
  orderBy: String
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

input FunctionDefinitionInput {
  connectionId: ID!
  schema: String!
  name: String!
  arguments: String!
}

type FunctionDefinitionResult {
  apiErrors: [ShellErrorResult!]!
  definition: String
}

type Query {
  tableStructure(input: DbObjectInput!): TableStructureResult!
  tableRows(input: TableRowsInput!): TableRowsResult!
  functionDefinition(input: FunctionDefinitionInput!): FunctionDefinitionResult!
}
```

- Sirven para tablas y vistas. `definition` es el DDL armado de las columnas y constraints en una tabla, y `pg_get_viewdef` en una vista. Una vista devuelve `indexes` y `foreignKeys` vacíos.
- `functionDefinition` usa `pg_get_functiondef`. Recibe `arguments`, el mismo texto de `DbFunction.arguments`, para distinguir funciones sobrecargadas. Si no existe, `OBJECT_NOT_FOUND`.
- `tableRows` recibe `where` y `orderBy` como fragmentos de SQL y los pega tal cual, cada uno en su propia línea para que un comentario `--` no se coma lo que sigue, con `where` entre paréntesis. Un fragmento vacío o solo con espacios cuenta como ausente. Como máximo 10,000 caracteres cada uno, validado con zod en el use-case. Si Postgres los rechaza, `QUERY_FAILED` con su mensaje. Páginas de 50 con `LIMIT/OFFSET`, `page` desde 1. Sin `orderBy`, ordena por la PK si hay; con `orderBy`, desempata por la PK. El service arma el orden y la página, así lo cubre la integración.
- `totalRows` es un `count(*)` con el mismo `where`.
- Al terminar, `tableRows` destruye el cliente en vez de devolverlo al pool, como `runQuery`: un fragmento puede cambiar el estado de sesión (`set_config`).
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
  command: String!
}

type RunQueryResult {
  apiErrors: [ShellErrorResult!]!
  execution: QueryExecution
}

type Mutation {
  runQuery(input: RunQueryInput!): RunQueryResult!
}
```

- `runQuery` corre el SQL en un cliente del pool con el protocolo simple, así se aceptan varias sentencias. Al terminar, el cliente se destruye en vez de volver al pool, para que el estado de sesión que deje el SQL (`begin` sin cerrar, `set search_path`) no pase a otras queries. Las filas son las del último resultado que tenga filas; `command` trae el tag de ese resultado o, si ninguno tiene filas, el de la última sentencia (`SELECT 7`, `UPDATE 3`).
- Devuelve como máximo 1,000 filas con `isTruncated` si había más. `rowCount` es el total que devolvió Postgres.
- `sql` tiene como máximo 100,000 caracteres, validado con zod en el use-case.
- No guarda nada en la base de la api. Si falla, responde `QUERY_FAILED` con el mensaje de Postgres.

### Archivos

```graphql
enum FileType {
  SQL
  TXT
}

type File {
  id: ID!
  name: String!
  type: FileType!
  content: String!
  updatedAt: DateTime!
}

type FileList {
  items: [File!]!
}

input CreateFileInput {
  connectionId: ID!
  name: String!
  type: FileType!
  content: String!
}

input UpdateFileInput {
  id: ID!
  name: String!
  content: String!
}

type FileResult {
  apiErrors: [ShellErrorResult!]!
  file: File
}

type RemoveFileResult {
  apiErrors: [ShellErrorResult!]!
  success: Boolean
}

type Query {
  files(connectionId: ID!): FileList!
}

type Mutation {
  createFile(input: CreateFileInput!): FileResult!
  updateFile(input: UpdateFileInput!): FileResult!
  removeFile(id: ID!): RemoveFileResult!
}
```

- `files` ordena por `updated_at desc, id`.
- El tipo no cambia después de crear el archivo.
- Nombre según `product.md`, validado con zod en el use-case. El nombre se guarda sin extensión; si el usuario escribe la de su tipo, se quita.

### Capas

| Capa | Archivo |
|------|---------|
| Schema | `src/api/schema/database-schema.gql`, `query.gql`, `file.gql` |
| Resolvers | uno por archivo de schema en `src/api/resolvers/` |
| Use-cases | `src/modules/database-schema/use-cases/` (lectura del esquema, estructura, filas, definición), `src/modules/query/use-cases/` (`query-runner.ts`), `src/modules/file/use-cases/` (creator, updater, remover) |
| Services | `src/services/postgres/`: pool, introspección y ejecución |
| Repositorios | `src/persistence/repositories/file/` |

Las operaciones que leen la base del usuario sí llevan use-case: tienen que leer la conexión, descifrar la contraseña y llamar al service.

## Web

- **Conexión activa:** `useActiveConnection` en `src/lib/workspace/hooks/`, con el id en `localStorage` (`dbiewer:active-connection`). Si el id guardado ya no existe, usa la conexión más reciente.
- **Ancho del sidebar:** en `localStorage` (`dbiewer:sidebar-width`), con `try/catch`.
- **Pestañas:** estado por conexión en `localStorage` (`dbiewer:tabs:<connectionId>`): lista de pestañas, activa y cuál es provisional. Los borradores sin guardar van en `dbiewer:draft:<connectionId>:<tabKey>`. Todo leído y escrito con `try/catch`: si falla, el shell arranca sin pestañas.
- **Clave de pestaña:** `table:<schema>.<name>`, `view:<schema>.<name>`, `function:<schema>.<name>(<args>)`, `query:<fileId>` y `draft:<uuid>` para una query sin guardar.
- **Módulos:**
  - `src/lib/workspace/`: `WorkspaceLayout` con el selector de conexión, el shell (sidebar y área de pestañas) y el estado de pestañas.
  - `src/lib/database-schema/`: explorador, pestaña de tabla o vista (Data y Structure) y pestaña de función.
  - `src/lib/query/`: pestaña SQL, editor, panel de resultados y queries guardadas.
- **Editor:** CodeMirror 6 con `@codemirror/lang-sql` (dialecto Postgres) y `sql-formatter` para "Format". La sentencia bajo el cursor se toma separando por `;` fuera de strings y comentarios. El autocompletado usa `@codemirror/autocomplete` con la opción `schema` de `sql()`, armada desde la cache de `connectionSchema` (sin pedidos nuevos), con `defaultSchema: 'public'`.
- **Filtro y orden de la tabla:** dos campos de una línea con CodeMirror y `@codemirror/lang-sql`, sin números de línea. Autocompletan las columnas de la tabla (desde la cache de `connectionSchema`) y palabras clave de Postgres. Enter aplica y vuelve a la página 1; con el popup de autocompletado abierto, Enter acepta la sugerencia y no aplica.
- **Historial de filtro y orden:** en `sessionStorage` (`dbiewer:table-history:<connectionId>:<schema>.<name>:where` y `:order-by`), con `try/catch`. Guarda hasta 50 textos.
- **Columnas visibles:** en memoria, por conexión y clave de pestaña, fuera de `localStorage`. Se borra al cerrar la pestaña o al reemplazar la provisional. Guarda las columnas ocultas, así una columna nueva aparece visible.
- **Grilla:** el componente `table` de coss, con encabezado fijo y scroll horizontal. Sin virtualización: el máximo es 1,000 filas.
- **Cache keys:** el esquema por `connectionId`; la estructura y las filas por `connectionId`, objeto, filtros, orden y página; la definición de una función por `connectionId`, esquema, nombre y argumentos. "Reload" en el explorador o en la tabla los vuelve a pedir.
- Después de crear, editar o eliminar un archivo, `files`.

## Impacto en código existente

- `apps/api/src/services/postgres/postgres-service.ts`: pool, introspección y ejecución, además de `testConnection`.
- `apps/api/src/modules/connection/use-cases/connection-updater.ts` y `connection-remover.ts`: descartan el pool de la conexión.
- `apps/api/src/persistence/schema/`: tabla `file`, que reemplaza a `saved_query`, con sus migraciones generada y custom.
- `apps/web/src/lib/workspace/components/workspace-layout/workspace-layout.tsx`: suma el selector de conexión en el header.
- `apps/web/src/lib/workspace/pages/workspace-page.tsx`: muestra el shell en lugar del listado temporal.
- `apps/web/src/lib/connection/components/connections-dev-list/`: se borra.
- `apps/web/package.json`: CodeMirror y `sql-formatter`.
- Locales `en.json` y `es.json`: textos del shell.

## Tests

- **api, integración:** repositorio de `file`, incluido el índice único por tipo y nombre.
- **api, e2e:** con `PostgresService` mockeado, como pide `testing.md`; la ejecución real se cubre en la integración. `functionDefinition`; `connectionSchema` con esquemas, vistas y funciones de un fixture; `tableStructure`, `tableRows` (`where`, `orderBy`, paginación, fragmento inválido, fragmento demasiado largo, `OBJECT_NOT_FOUND`); `runQuery` (varias sentencias, truncado, error de Postgres, SQL demasiado largo); CRUD de `file` con sus errores; `CONNECTION_NOT_FOUND`, `CONNECTION_FAILED`, aislamiento entre workspaces y `UNAUTHENTICATED`.
- **web, unit:** estado de pestañas (provisional, reemplazo, fijar, persistencia por conexión, `localStorage` que falla), sentencia bajo el cursor, explorador (buscador, un solo esquema), pestaña de tabla y pestaña SQL con el fetcher mockeado.

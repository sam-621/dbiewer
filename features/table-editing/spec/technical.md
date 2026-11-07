# Edición de tabla — especificación técnica

Reglas de negocio y decisiones en `product.md`.

## API GraphQL

Requiere sesión con workspace (`requireSession`). Devuelve `CONNECTION_NOT_FOUND` si la conexión no existe o es de otro workspace, `CONNECTION_FAILED` si no conecta, `OBJECT_NOT_FOUND` si la tabla ya no existe o es una vista, y `QUERY_FAILED` con el mensaje de Postgres si una sentencia falla. Reutiliza `ShellErrorResult`.

Error nuevo en `ShellErrorCode`:

| Código | Cuándo |
|--------|--------|
| `PRIMARY_KEY_REQUIRED` | Hay updates o deletes y la tabla no tiene PK, o la `key` de una fila no trae exactamente las columnas de la PK. |

```graphql
input DbCellValueInput {
  column: String!
  value: String
}

input DbRowUpdateInput {
  key: [DbCellValueInput!]!
  values: [DbCellValueInput!]!
}

input DbRowInsertInput {
  values: [DbCellValueInput!]!
}

input SaveTableChangesInput {
  connectionId: ID!
  schema: String!
  name: String!
  updates: [DbRowUpdateInput!]!
  inserts: [DbRowInsertInput!]!
}

input DeleteTableRowsInput {
  connectionId: ID!
  schema: String!
  name: String!
  keys: [[DbCellValueInput!]!]!
}

type SaveTableChangesResult {
  apiErrors: [ShellErrorResult!]!
  success: Boolean
}

type DeleteTableRowsResult {
  apiErrors: [ShellErrorResult!]!
  deletedRows: Int
}

type Mutation {
  saveTableChanges(input: SaveTableChangesInput!): SaveTableChangesResult!
  deleteTableRows(input: DeleteTableRowsInput!): DeleteTableRowsResult!
}
```

- `value: null` es `NULL`. En `inserts`, una columna que no viene en `values` toma su default; si `values` está vacío, se usa `INSERT ... DEFAULT VALUES`.
- `key` son los valores originales de las columnas de la PK. `values` son solo las columnas editadas.
- Validación con zod en el use-case: al menos un update o insert en `saveTableChanges` y al menos una key en `deleteTableRows`; sin columnas repetidas dentro de `key` o `values`; un update con al menos un valor.

## Escritura (api)

- `PostgresService` suma `saveTableChanges` y `deleteTableRows`. Cada uno abre un cliente del pool, corre `BEGIN`, las sentencias y `COMMIT`; si una falla, `ROLLBACK` y `PostgresQueryFailedError`.
- Antes de escribir, lee de `pg_catalog` las columnas de la tabla y su PK, en el mismo cliente. Si la tabla no existe o no es `relkind in ('r', 'p')`, `OBJECT_NOT_FOUND`. Una columna que no existe la rechaza Postgres con `QUERY_FAILED`.
- Identificadores con `escapeIdentifier` y valores siempre como parámetros (`$1`, `$2`…). Postgres convierte el texto al tipo de la columna.
- Update: `UPDATE <tabla> SET a = $1, b = $2 WHERE pk1 = $3 AND pk2 = $4`, en el orden en que llegan. Delete: un `DELETE ... WHERE` por key; `deletedRows` es la suma de filas afectadas.
- Use-cases `TableChangesSaver` y `TableRowsDeleter` en `src/modules/database-schema/use-cases/`, igual a `TableRowsReader`.
- Resolvers en `database-schema-resolver.ts` y tipos en `database-schema.gql`.

## Vista de tabla (web)

- Los cambios pendientes son estado por pestaña, como `hiddenColumns`: celdas editadas por `key` de fila y columna, y filas nuevas con un id local. Viven en memoria mientras la pestaña está abierta, fuera de `localStorage`.
- La `key` de una fila se arma con los valores de todas las columnas `isPrimaryKey` de `structure.columns`. Hoy `TableData` toma solo la primera PK: pasa a manejar todas.
- Como los pendientes van por `key` y no por índice, sobreviven a la recarga de filas tras un borrado.
- Al guardar o borrar bien se invalidan `tableRows` de esa tabla.
- La selección de filas es estado local de `TableData`, por `key`, y no depende del borrado: las acciones sobre la selección la reciben como entrada.
- Al borrar bien, se quitan de los pendientes las celdas editadas de las `key` borradas antes de invalidar `tableRows`.

## Impacto en código existente

- `TableTabHeader`: botones `+`, `−`, Guardar y Deshacer junto al nombre y el número de filas.
- `TableGrid`: doble clic para editar, marcas de celda cambiada y fila nueva, numeral como checkbox.
- `TableData`: confirmación al cambiar de página, filtro u orden con pendientes.
- Render de pestañas del workspace: los pendientes cuentan como cambios sin guardar al cerrar la pestaña.
- Operaciones nuevas en `lib/api/operations/database-schema.operations.ts` y codegen.
- `apps/web/src/shared/i18n/locales/`: textos nuevos.

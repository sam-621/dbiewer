# Diagrama del esquema — especificación técnica

Reglas de negocio y decisiones en `product.md`.

## API GraphQL

Requiere sesión con workspace (`requireSession`). Devuelve `CONNECTION_NOT_FOUND` si la conexión no existe o es de otro workspace, `CONNECTION_FAILED` si no conecta y `QUERY_FAILED` si Postgres devuelve un error. Reutiliza `ShellErrorResult`.

```graphql
enum DiagramRelationType {
  ONE_TO_ONE
  MANY_TO_ONE
  MANY_TO_MANY
}

type DiagramProperty {
  name: String!
  type: String!
  default: String
  isNullable: Boolean!
  isPrimaryKey: Boolean!
  isForeignKey: Boolean!
}

type DiagramEntity {
  id: ID!
  schema: String!
  name: String!
  properties: [DiagramProperty!]!
}

type DiagramRelation {
  id: ID!
  type: DiagramRelationType!
  fromEntityId: ID!
  fromProperties: [String!]!
  toEntityId: ID!
  toProperties: [String!]!
}

type SchemaDiagram {
  entities: [DiagramEntity!]!
  relations: [DiagramRelation!]!
}

type SchemaDiagramResult {
  apiErrors: [ShellErrorResult!]!
  diagram: SchemaDiagram
}

type Query {
  schemaDiagram(connectionId: ID!): SchemaDiagramResult!
}
```

- `DiagramEntity.id` es `<schema>.<tabla>`, por ejemplo `public.users`.
- `DiagramRelation.id` es `<schema>.<tabla>.<constraint>`, porque en Postgres el nombre del constraint solo es único por tabla.
- `from` es siempre la tabla que tiene la FK. `fromProperties` y `toProperties` son listas por las FKs compuestas, y van en el mismo orden.
- `default` es la expresión tal como la guarda Postgres (`now()`, `'active'::text`), igual que `DbColumnDetail.default`.
- La query nunca devuelve `MANY_TO_MANY`.

## Lectura (api)

- `PostgresService.readDiagram(connection)` lee entidades y relaciones en una sola consulta a `pg_catalog`, con los mismos filtros de esquemas que `SCHEMAS_SQL`.
- Entidades: `relkind in ('r', 'p')`.
- Relaciones: `pg_constraint` con `contype = 'f'`, descartando las que apuntan a una tabla fuera del diagrama.
- `ONE_TO_ONE`: existe un índice único o PK en la tabla origen cuyas columnas son exactamente las de la FK.
- Use-case `SchemaDiagramReader` en `src/modules/database-schema/use-cases/`, igual a `ConnectionSchemaReader`, más el manejo de `QUERY_FAILED`.
- Resolver `schemaDiagram` en `database-schema-resolver.ts`, y los tipos en `database-schema.gql`.

## Diagrama (web)

- Dependencias nuevas: `@xyflow/react` para el lienzo y `@dagrejs/dagre` para el acomodo automático.
- Los componentes del diagrama reciben `{ entities, relations }` con tipos propios y no importan de `lib/api` ni conocen la conexión. La pestaña es la que usa el hook de la query y les pasa los datos.
- Read only en React Flow: sin crear ni reconectar edges y sin borrar con teclado. Solo se arrastran nodos.
- Las líneas salen de la propiedad FK y llegan a la propiedad referenciada, con un handle por propiedad. En FKs compuestas se usa la primera propiedad de cada lista.
- Las posiciones se guardan en `localStorage` en `dbiewer:diagram-positions:<connectionId>`, como un mapa de `entity.id` a `{ x, y }`.

## Impacto en código existente

- `workspace-tabs.utils.ts`: nuevo `kind: 'diagram'` en `WorkspaceTabSchema`, con key fija `diagram`, porque hay una sola pestaña de diagrama por conexión.
- `WorkspaceSidebar`: acción para abrir el diagrama en los controles del tab Explorer.
- Render de pestañas del workspace: caso para el `kind` nuevo.
- `apps/web/src/shared/i18n/locales/`: textos nuevos.

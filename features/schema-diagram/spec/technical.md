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

- Dependencias nuevas: `@xyflow/react` para el lienzo y `d3-force` para el acomodo automático.
- Acomodo automático: simulación de fuerzas por componente conexo, con colisión rectangular según el tamaño de cada caja, y componentes empaquetados en filas con proporción de pantalla ancha. Es síncrono y determinista.
- Los componentes del diagrama reciben `{ entities, relations }` con tipos propios y no importan de `lib/api` ni conocen la conexión. `Diagram` también recibe el modelo completo, para ubicar la tabla de una FK aunque no esté visible, y delega en la pestaña lo que no está visible: la pestaña cambia el esquema, remonta `Diagram` por `key` y le indica qué tabla centrar. La pestaña es la que usa el hook de la query y les pasa los datos.
- Read only en React Flow: sin crear ni reconectar edges y sin borrar con teclado. Solo se arrastran nodos.
- Las líneas salen de la propiedad FK y llegan a la propiedad referenciada, con un handle de llegada por propiedad y uno de salida en cada FK. En FKs compuestas se usa la primera propiedad de cada lista.
- `getDiagramHubs(model)` calcula las tablas centrales sobre las tablas visibles. El acomodo ignora las relaciones hacia ellas.
- El foco usa eventos de nodo y de lienzo, no la selección de React Flow.
- El recorrido y el esquema elegido son estado de `DiagramTab`, y se copian a un ref de `WorkspaceTabsProvider` para sobrevivir al cambio de pestaña sin re-renderizar el workspace.
- El resaltado y la pastilla viven en un store con selector por tabla, para que un salto solo re-renderice las tablas afectadas.
- Las posiciones se guardan en `localStorage` en `dbiewer:diagram-positions:<connectionId>`, como un mapa de `entity.id` a `{ x, y }`.

## Impacto en código existente

- `workspace-tabs.utils.ts`: nuevo `kind: 'diagram'` en `WorkspaceTabSchema`, con key fija `diagram`, porque hay una sola pestaña de diagrama por conexión.
- `WorkspaceSidebar`: acción para abrir el diagrama en los controles del tab Explorer.
- Render de pestañas del workspace: caso para el `kind` nuevo.
- `apps/web/src/shared/i18n/locales/`: textos nuevos.

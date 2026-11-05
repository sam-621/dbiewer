# Diagrama del esquema — log

## 2026-11-04 — samuel.corrales621

**Hecho:**
- (api, web) Se crea la feature `schema-diagram`: spec de producto, técnico y de UI, y plan de trabajo.
- (api) Paso 1: `PostgresService.readDiagram`, use-case `SchemaDiagramReader` y query `schemaDiagram`, con tests de integración y e2e.

**Decisiones:**
- Primera etapa en solo lectura: el usuario solo acomoda las tablas. Los componentes se reutilizarán en los diagramas propios.
- Query `schemaDiagram` con entidades y relaciones en listas planas, y tipo de relación como enum. La api solo expone el diagrama; cómo se pinta lo decide la web.
- React Flow para el lienzo.
- `ONE_TO_ONE`: un índice único parcial no cuenta, las columnas `INCLUDE` no son parte del índice, y las columnas del índice y de la FK se comparan como conjuntos.
- El filtro de esquemas se comparte entre `SCHEMAS_SQL` y `DIAGRAM_SQL` con la constante `NAMESPACES_SQL`.

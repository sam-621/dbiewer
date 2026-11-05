# Diagrama del esquema — log

## 2026-11-04 — samuel.corrales621

**Hecho:**
- (api, web) Se crea la feature `schema-diagram`: spec de producto, técnico y de UI, y plan de trabajo.

**Decisiones:**
- Primera etapa en solo lectura: el usuario solo acomoda las tablas. Los componentes se reutilizarán en los diagramas propios.
- Query `schemaDiagram` con entidades y relaciones en listas planas, y tipo de relación como enum. La api solo expone el diagrama; cómo se pinta lo decide la web.
- React Flow para el lienzo.

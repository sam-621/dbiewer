# Diagrama del esquema — log

## 2026-11-04 — samuel.corrales621

**Hecho:**
- (api, web) Se crea la feature `schema-diagram`: spec de producto, técnico y de UI, y plan de trabajo.
- (api) Paso 1: `PostgresService.readDiagram`, use-case `SchemaDiagramReader` y query `schemaDiagram`, con tests de integración y e2e.
- (web) Pasos 2 a 4: módulo `lib/diagram` con React Flow, pestaña de diagrama, acción en el Explorer, acomodo automático, posiciones por conexión, filtro de esquemas, recarga y vuelta al acomodo automático.
- (web) El scroll con dos dedos mueve el lienzo en vez de hacer zoom.
- (web) Legibilidad del diagrama: modo foco con toggle, tablas centrales con líneas ocultas hasta enfocarlas, y buscador por nombre de tabla que resalta el texto y atenúa las que no coinciden.
- (web) Se prueba y se quita el modo compacto: las tablas muestran siempre todas sus propiedades.
- (web) Un solo esquema a la vez con un select, e ir a la tabla referenciada desde el ícono de una FK.
- (web) Botón para volver a la tabla anterior, con recorrido en memoria.
- (web) Se quita el botón de foco y queda apagado, conservando la lógica. Cada tabla tiene un botón con menú para ir a sus tablas relacionadas.
- (web) La tabla de destino se resalta por un momento al saltar a ella.
- (web) Optimización de renders: en un salto ninguna fila se re-renderiza y las cajas pasan de 140 a 3 renders.
- (web) Se quita el tooltip del valor por defecto en las propiedades.
- (web) Se oculta la atribución de React Flow.
- (api, web) Puertos propios del proyecto: web 3100, api 4100.
- (web) El acomodo automático pasa de dagre a `d3-force`, con colisión rectangular y componentes empaquetados en filas.

**Decisiones:**
- Primera etapa en solo lectura: el usuario solo acomoda las tablas. Los componentes se reutilizarán en los diagramas propios.
- Query `schemaDiagram` con entidades y relaciones en listas planas, y tipo de relación como enum. La api solo expone el diagrama; cómo se pinta lo decide la web.
- React Flow para el lienzo.
- `ONE_TO_ONE`: un índice único parcial no cuenta, las columnas `INCLUDE` no son parte del índice, y las columnas del índice y de la FK se comparan como conjuntos.
- El filtro de esquemas se comparte entre `SCHEMAS_SQL` y `DIAGRAM_SQL` con la constante `NAMESPACES_SQL`.
- Módulo genérico `lib/diagram`, sin dependencias de la api; la pestaña y sus hooks viven en `lib/database-schema`.
- Cada propiedad tiene un handle de llegada y las FK además uno de salida, porque React Flow distingue origen y destino.
- Al soltar una tabla se guarda solo esa posición, como pide `product.md`.
- El esquema elegido y el recorrido se guardan en memoria por pestaña, para que no se pierdan al cambiar de pestaña.
- Acomodo por fuerzas en vez de por capas: por capas, una base real salía en pocas columnas muy altas.
- El acomodo corre sobre las tablas visibles, así que ocultar un esquema reacomoda las tablas sin posición guardada.
- Con un foco fijo, pasar sobre otra tabla no cambia el foco.

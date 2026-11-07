# Edición de tabla — log

## 2026-11-07 — samuel.corrales621

**Hecho:**
- (api, web) Se crea la feature `table-editing`: spec de producto, técnico y de UI, y plan de trabajo.
- (api) Mutations `saveTableChanges` y `deleteTableRows` en una transacción, con tests de integración y e2e (paso 1 del plan).

**Decisiones:**
- Ediciones e inserts quedan pendientes y se guardan juntos en una sola transacción; el borrado es inmediato, con confirmación.
- Una celda vacía en una fila nueva toma el default de la columna.
- Selección múltiple desde el numeral, independiente del borrado para sumar otras acciones después.
- Borrar una fila con celdas editadas quita esos cambios de los pendientes.
- Editar y borrar necesitan PK; sin PK solo se agregan filas.
- La validación de PK (`OBJECT_NOT_FOUND`, `PRIMARY_KEY_REQUIRED`) va en el use-case, que la lee antes con `PostgresService.readPrimaryKeyColumns`; el service no lleva esa regla.

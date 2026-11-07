# Edición de tabla — log

## 2026-11-07 — samuel.corrales621

**Hecho:**
- (api, web) Se crea la feature `table-editing`: spec de producto, técnico y de UI, y plan de trabajo.
- (api) Mutations `saveTableChanges` y `deleteTableRows` en una transacción, con tests de integración y e2e (paso 1 del plan).
- (web) Selección de filas desde el numeral y borrado con confirmación; la `key` de fila usa todas las columnas de la PK (paso 2 del plan).
- (web) Edición de celdas con cambios pendientes, filas nuevas con `+`, Guardar y Deshacer con `saveTableChanges`, y confirmación al descartar (pasos 3 y 4 del plan).
- (web) La columna del numeral tiene ancho fijo para que agregar filas no desfase la grilla.
- (web) Selección de celda con clic, edición en el lugar con doble clic y guardado en vivo; se quita el detalle de fila de la vista de tabla.

**Decisiones:**
- Ediciones e inserts quedan pendientes y se guardan juntos en una sola transacción; el borrado es inmediato, con confirmación.
- Una celda vacía en una fila nueva toma el default de la columna.
- Selección múltiple desde el numeral, independiente del borrado para sumar otras acciones después.
- Borrar una fila con celdas editadas quita esos cambios de los pendientes.
- Editar y borrar necesitan PK; sin PK solo se agregan filas.
- La validación de PK (`OBJECT_NOT_FOUND`, `PRIMARY_KEY_REQUIRED`) va en el use-case, que la lee antes con `PostgresService.readPrimaryKeyColumns`; el service no lleva esa regla.
- La selección de filas vive en `TableTab`, porque el botón `−` del encabezado y la grilla la comparten.
- El numeral selecciona la fila con un clic, sin mostrar checkbox: sigue mostrando el número y la fila seleccionada se resalta.
- La fila seleccionada se resalta con el amarillo de la marca; el hover no cambia.
- Los cambios pendientes viven por pestaña en `WorkspaceTabsProvider` y cuentan como cambios sin guardar al cerrarla.
- La celda se edita en el lugar, sin input visible ni cambio de tamaño; "Poner NULL" es un botón de texto discreto dentro de la celda.
- Lo escrito cuenta como pendiente al instante: Enter, Tab y salir de la celda lo conservan; Escape vuelve al valor previo a la edición.
- Se quita el detalle de fila (sheet) de la vista de tabla: el clic selecciona celdas.

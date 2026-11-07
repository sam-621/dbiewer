---
status: active
apps: [api, web]
created: 2026-11-07
---

# Edición de tabla

## Contexto

Con `shell` el usuario ve los datos de una tabla, los filtra, los ordena y abre el detalle de una fila, pero no puede cambiarlos sin escribir SQL a mano en una pestaña SQL. Esta feature termina la vista de tabla: editar celdas, agregar filas y borrarlas desde la misma grilla, con los cambios revisados antes de guardarlos.

Cubre la parte de "edición inline con revisión" del milestone 9 de `docs/roadmap.md`. En la decisión pendiente de lectura vs. escritura, las ediciones y los inserts se guardan solo con una acción explícita y los borrados piden confirmación.

## Historia de usuario

Como usuario con una base Postgres conectada, quiero editar, agregar y borrar filas desde la vista de tabla, revisando los cambios antes de aplicarlos, para corregir datos sin escribir `UPDATE`, `INSERT` ni `DELETE`.

## Flujo

1. El usuario abre una tabla en Data.
2. Con doble clic en una celda, la edita. Con Enter, el valor queda como cambio pendiente y la celda se marca.
3. Con el botón `+`, se agrega una fila nueva al final de la grilla y la vista baja hasta ella. Llena los campos que quiera.
4. Junto al nombre de la tabla y el número de filas aparecen Guardar y Deshacer mientras haya cambios pendientes.
5. Con Guardar, se aplican todos los cambios: un `UPDATE` por fila editada y un `INSERT` por fila nueva. Si algo falla, se muestra el error y los cambios siguen pendientes. Con Deshacer, se descartan.
6. Con clic en el numeral de una o varias filas, las selecciona. Con el botón `−`, confirma y las borra.

## Reglas de negocio

### Alcance

- Solo se editan, agregan y borran filas de tablas. Las vistas siguen en solo lectura.
- Editar y borrar necesitan la PK de la tabla para ubicar la fila. En una tabla sin PK solo se pueden agregar filas.
- Si la PK es compuesta, la fila se ubica por todas sus columnas.

### Editar celdas

- Doble clic en una celda la pone en modo edición con su valor actual. El clic simple en la fila sigue abriendo el detalle.
- Enter confirma el valor como cambio pendiente. Escape sale sin cambiar nada.
- El valor se escribe como texto y Postgres lo convierte al tipo de la columna al guardar. Si no puede, el error sale al guardar.
- Se puede poner `NULL` explícito en una celda.
- Una celda con un valor distinto al original se marca como cambiada. Si se vuelve a dejar el valor original, deja de estar pendiente.
- Se pueden editar las columnas de la PK: el `UPDATE` ubica la fila por el valor original.

### Agregar filas

- El botón `+` agrega una fila vacía al final de la página actual, baja hasta ella y pone en edición su primera celda visible.
- Se pueden agregar varias filas antes de guardar.
- Una fila nueva se marca distinto de una celda editada.
- Una celda vacía de una fila nueva no se manda en el `INSERT`: toma el default de la columna. Si la columna es `NOT NULL` y no tiene default, Postgres devuelve el error al guardar. `NULL` explícito sí se manda.
- Las columnas ocultas en Data no se muestran en la fila nueva y toman su default.
- Una fila nueva se quita seleccionándola y con el botón `−`, sin confirmación, porque no existe en la base.

### Cambios pendientes

- Los cambios pendientes son las celdas editadas y las filas nuevas de la tabla. Mientras haya alguno, se ven Guardar y Deshacer con la cantidad de cambios.
- Guardar aplica todo en una sola transacción: si un cambio falla, no se aplica ninguno, se muestra el mensaje de Postgres y los cambios siguen pendientes para corregirlos.
- Al guardar bien, se descartan los pendientes y se recargan las filas y el conteo.
- Deshacer descarta todos los cambios pendientes, sin confirmación.
- Los cambios pendientes viven en memoria mientras la pestaña esté abierta: se mantienen al cambiar de pestaña o de conexión y se pierden al recargar el navegador.
- Cambiar de página, filtro u orden o recargar la tabla con cambios pendientes pide confirmación para descartarlos.
- Cerrar la pestaña con cambios pendientes pide confirmación, igual que un archivo sin guardar.

### Seleccionar y borrar filas

- Un clic en el numeral de una fila la agrega o la quita de la selección. Se pueden seleccionar varias.
- La selección es independiente de lo que se haga con ella: borrar es la primera acción sobre las filas seleccionadas, y pueden sumarse otras más adelante.
- El botón `−` se habilita solo con filas seleccionadas.
- Con `−`, se pide confirmación con la cantidad de filas y, al confirmar, se borran en ese momento, en una sola transacción, aparte de los cambios pendientes.
- Si el borrado falla (por ejemplo, una FK que lo impide), se muestra el mensaje de Postgres y no se borra ninguna.
- Al borrar bien, se limpia la selección y se recargan las filas y el conteo.
- Si una fila borrada tenía celdas editadas, esos cambios se quitan de los pendientes, así el siguiente Guardar no intenta actualizar una fila que ya no existe. El resto de los pendientes se mantiene.
- La selección se limpia al cambiar de página, filtro u orden.

## Decisiones

- **Ediciones e inserts pendientes, borrado inmediato**: editar es de a muchas celdas y conviene revisarlas juntas; borrar es una acción puntual que se confirma en el momento.
- **Guardar todo o nada**: dejar aplicados unos cambios y otros no obliga al usuario a averiguar qué quedó. En una transacción, corrige y vuelve a guardar.
- **Fila ubicada por la PK**: es lo único que identifica una fila sin ambigüedad. Se descarta usar `ctid` o todos los valores de la fila para tablas sin PK.
- **Celda vacía en fila nueva toma el default**: así las PK `serial` o `uuid` con default y columnas como `created_at` se llenan solas. El `NULL` explícito queda para cuando se quiere.
- **Valores como texto**: la grilla ya los recibe como texto. Postgres los convierte al tipo de la columna, igual que si se escribieran en SQL, sin que la web tenga que conocer cada tipo.
- **Seleccionar desde el numeral**: no agrega una columna a la grilla y no choca con el clic en la fila, que abre el detalle.
- **Selección separada del borrado**: la selección es un estado propio de la grilla, para que otras acciones sobre filas seleccionadas se sumen sin rehacerla.

## Fuera de alcance

- Editar desde el detalle de fila (sheet).
- Deshacer celda por celda o rehacer.
- Copiar y pegar varias celdas o filas.
- Editores por tipo (fecha, booleano, JSON): todo se edita como texto.
- Editar resultados de una pestaña SQL.
- El resto del milestone 9: pantalla completa, constructor visual de `WHERE`, paginación por cursor y saltar de una FK a la fila referenciada.

## Plan de trabajo recomendado

1. [x] api: mutations `saveTableChanges` y `deleteTableRows` en una transacción, con sus tests de integración y e2e.
2. [x] web: selección de filas desde el numeral y borrado con confirmación.
3. [ ] web: edición de celdas con cambios pendientes, Guardar y Deshacer.
4. [ ] web: agregar filas nuevas con `+`.

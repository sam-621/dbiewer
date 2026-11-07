# Edición de tabla — UI

Capacidades que debe tener la UI, sin estilos ni componentes concretos: como si fuera HTML sin CSS. Reglas de negocio en `product.md`; aquí se referencian, no se repiten.

Las capacidades (qué muestra, qué permite, estados) son obligatorias. La forma (diálogo, página, ruta, posición) es una propuesta: si el diseño la resuelve distinto, se actualiza este archivo para reflejar lo construido.

## Pantallas nuevas

### Confirmación de borrado

- **Ubicación:** diálogo que se abre con el botón `−` de la pestaña de tabla.
- **Muestra:** cuántas filas se van a borrar y de qué tabla. Ejemplo: "¿Borrar 3 filas de orders?".
- **Permite:** confirmar o cancelar.
- **Referencia:** confirmación de eliminar un archivo en el tab Files.
- **Estados:** cargando mientras se borra; error con el mensaje de Postgres, sin cerrar el diálogo.

### Confirmación de descartar cambios

- **Ubicación:** diálogo al cambiar de página, filtro u orden, o al recargar, con cambios pendientes.
- **Muestra:** que hay cambios sin guardar y cuántos.
- **Permite:** descartarlos y seguir, o cancelar.

## Cambios a UI existente

### Encabezado de la pestaña de tabla

- **Ubicación:** fila con el nombre de la tabla (`orders`) y el número de filas, sobre Data y Structure.
- **Cambia:** a la derecha del número de filas se agregan, solo en tablas y en Data:
  - `+`: agrega una fila nueva.
  - `−`: borra o quita las filas seleccionadas. Deshabilitado sin selección.
  - Guardar y Deshacer, visibles solo con cambios pendientes, con la cantidad. Ejemplo: `orders 1,234 filas  + −  Guardar (3)  Deshacer`.
- **Cambia:** en una tabla sin PK, `−` no aparece y no se pueden editar celdas existentes; un tooltip en `+` o un aviso explica que sin PK solo se agregan filas.
- **Estados:** Guardar en carga mientras se guarda; error de Postgres visible cerca de la grilla o como aviso, con los cambios aún marcados.

### Grilla de Data

- **Ubicación:** pestaña de tabla, vista Data.
- **Cambia:**
  - Doble clic en una celda abre un input con su valor. Enter confirma, Escape cancela. Hay una forma de poner `NULL` (acción en el input o atajo).
  - Celda cambiada con un tono distinto. Ejemplo: `status` de `pending` a `paid`.
  - Fila nueva al final, con otro tono y todas sus celdas visibles editables; las vacías muestran que tomarán el default.
  - El numeral sigue mostrando el número de fila, sin checkbox (ni al pasar el mouse). Un clic en él agrega o quita la fila de la selección, y la fila seleccionada se ve resaltada.
  - Al agregar una fila, la grilla baja hasta ella y pone en edición su primera celda.
- **Estados:** las vistas no permiten seleccionar filas ni muestran `+`, `−` ni edición.

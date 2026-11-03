# Shell — UI

Capacidades que debe tener la UI, sin estilos ni componentes concretos: como si fuera HTML sin CSS. Reglas de negocio en `product.md`; aquí se referencian, no se repiten.

Las capacidades (qué muestra, qué permite, estados) son obligatorias. La forma (diálogo, página, ruta, posición) es una propuesta: si el diseño la resuelve distinto, se actualiza este archivo para reflejar lo construido.

Maqueta de referencia: https://claude.ai/artifact/1xFf1W9L8owgCoSrEYNPhb. Es una idea, no un diseño literal.

## Pantallas nuevas

### Shell

- **Ubicación:** ruta `/`, cuando el workspace tiene conexiones. Reemplaza el listado temporal de `connections`.
- **Muestra:** el header del workspace arriba; debajo, el sidebar a la izquierda y el área de pestañas a la derecha, ocupando toda la altura.
- **Estados:** carga mientras se leen las conexiones; error al leerlas, con reintento.

### Selector de conexión

- **Ubicación:** header del workspace, a la derecha de la marca.
- **Muestra:** minimalista: la conexión activa con un indicador y su nombre, sin el motor ni el host. Al abrirlo, la lista de conexiones con el ícono del motor, su nombre y host, la activa marcada con un check a la derecha, y la acción "New connection".
- **Permite:**
  - Cambiar la conexión activa. Cambian el sidebar y las pestañas.
  - Abrir el modal de nueva conexión de `connections`. Al guardar, la nueva pasa a ser la activa.

### Sidebar

- **Ubicación:** a la izquierda del shell.
- **Muestra:** dos tabs, "Explorer" y "Queries", y un buscador debajo ("Search tables, views…" o "Filter queries…").
- **Permite:** cambiar de tab; filtrar lo que se ve en el tab activo; cambiar el ancho arrastrando el borde (también con las flechas, y doble clic vuelve al ancho por defecto), entre 200 y 520 px. El ancho se recuerda en el navegador.

### Explorer

- **Ubicación:** tab "Explorer" del sidebar.
- **Muestra:**
  - Un nivel por esquema (`public`, `billing`), salvo que haya uno solo.
  - Dentro, los grupos "Tables", "Views" y "Functions" con su cantidad. Un grupo vacío no se muestra.
  - Por tabla: nombre, sin número de filas. Al expandirla, sus columnas con tipo, y un ícono para PK y otro para FK. El tipo se muestra con su alias corto de Postgres (`timestamptz`, `varchar(255)`) y se corta si no entra; el nombre de la columna tiene prioridad.
  - Por vista: nombre, y sus columnas al expandirla.
  - Por función: nombre con sus argumentos (`refresh_stats()`).
  - Los nombres largos de tablas, vistas, funciones y columnas se cortan y se ven completos al pasar el mouse.
  - Una acción "Reload" para volver a leer el esquema.
- **Permite:**
  - Expandir y contraer esquemas, grupos y tablas.
  - Tabla: un clic en la fila la abre en la pestaña provisional; la flechita expande o contrae sus columnas.
  - Vista: toda la fila es un solo botón: un clic expande o contrae sus columnas y un doble clic la abre en la pestaña provisional. Al pasar el mouse aparece a la derecha un botón "Open" que también la abre en la pestaña provisional. Con una función, doble clic la abre en la pestaña provisional.
  - Buscar por nombre: filtra en todos los esquemas y expande los grupos con resultados.
- **Estados:** cargando el esquema; no se pudo conectar, con reintento; base sin objetos; búsqueda sin resultados.

### Queries

- **Ubicación:** tab "Queries" del sidebar.
- **Muestra:** "Saved" con la cantidad y una acción "New query"; la lista de queries guardadas de la conexión con su nombre (`top_customers.sql`), cuándo se editó (`2d`) y un indicador si tiene cambios sin guardar.
- **Permite:** abrir una query en una pestaña fija; crear una query nueva; renombrar y eliminar una query (con confirmación) desde un menú en la fila.
- **Estados:** cargando; error con reintento; sin queries, con la acción para crear la primera.

### Barra de pestañas

- **Ubicación:** arriba del área de pestañas.
- **Muestra:** una pestaña por objeto o query abierta, con un ícono por tipo (tabla, vista, función, SQL) y el nombre. La provisional se distingue (por ejemplo, en cursiva). Una con cambios sin guardar muestra un indicador en lugar de cerrar. Al final, una acción "New query".
- **Permite:** activar una pestaña; cerrarla; fijar la provisional con doble clic; crear una query nueva.
- **Estados:** sin pestañas, un estado vacío en el área con las acciones "New query" y una línea que invita a abrir una tabla desde el explorador. Cerrar una con cambios sin guardar pide confirmación.

### Pestaña de tabla o vista

- **Ubicación:** área de pestañas, al abrir una tabla o vista.
- **Muestra:** arriba, el nombre (con el esquema si hay más de uno), las filas exactas y la cantidad de columnas, un aviso "View · read only" si es una vista, el selector "Data" / "Structure" y "Reload".
- **Data:**
  - Barra de filtros: `WHERE` con un chip por condición (`plan = 'pro'`), cada uno con quitar, y "Add filter"; a la derecha, `ORDER BY` con la columna y dirección.
  - Grilla: número de fila y una columna por campo con su nombre y tipo, la PK marcada. `NULL` se ve distinto de un texto vacío. Los valores largos se cortan.
  - Pie: `14 of 14,823 rows · 38 ms`, página actual y total, anterior y siguiente.
- **Detalle de fila:** al hacer clic en una fila de la grilla se abre un panel a la derecha con un campo por columna (nombre, tipo, PK) y su valor en un input de solo lectura, con copiar. `NULL` se ve distinto del texto vacío. La fila abierta queda marcada. Más adelante será un form para editar la fila (milestone 9).
- **Structure:** columnas (nombre, tipo, si admite null, default), índices (nombre, definición, si es único), FKs (columnas, referencia, acción al borrar) y el DDL o la definición de la vista, con copiar.
- **Permite:** agregar, editar y quitar filtros; ordenar por una columna, también desde el encabezado de la grilla; paginar; abrir el detalle de una fila (desde ahí se copia cada valor); pasar entre Data y Structure. Cualquiera de estas acciones fija la pestaña.
- **Estados:** cargando; error de conexión o de query, con reintento; la tabla ya no existe; sin filas, o sin filas con esos filtros.

### Pestaña SQL

- **Ubicación:** área de pestañas, al abrir o crear una query.
- **Muestra:**
  - Barra: "Run" con `⌘↵`, "Save" y "Format", y a la derecha la conexión contra la que corre (la activa, solo informativa).
  - Editor de SQL con números de línea y resaltado.
  - Separador que se puede arrastrar.
  - Panel de abajo con tres tabs: "Results" (con la cantidad), "Messages" e "History" (con la cantidad). A la derecha, `7 rows · 124 ms`.
  - Results: grilla como la de la tabla, con aviso si el resultado está truncado en 1,000 filas.
  - Messages: el tag de cada sentencia (`SELECT 7`, `UPDATE 3`) o el error de Postgres.
  - History: las ejecuciones de la conexión con hora, SQL, duración y filas, y las fallidas marcadas.
- **Permite:**
  - Escribir SQL.
  - Ejecutar con "Run" o `⌘↵` lo seleccionado o la sentencia bajo el cursor.
  - Guardar con "Save" o `⌘S`. Si es nueva, pide el nombre.
  - Formatear el SQL.
  - Desde History, abrir una ejecución en una pestaña nueva.
- **Estados:** sin ejecutar ("Run the query with ⌘↵ to see results here"); ejecutando, con indicador y "Run" deshabilitado; error, que abre Messages; guardando; nombre inválido o repetido, en el diálogo del nombre.

### Pestaña de función

- **Ubicación:** área de pestañas, al abrir una función o procedimiento.
- **Muestra:** el aviso "Function · read only" y su definición en el editor, sin poder editarla ni ejecutarla, y sin panel de resultados.
- **Permite:** copiar la definición.
- **Estados:** cargando; error; la función ya no existe.

## Cambios a UI existente

### Header del workspace

- **Ubicación:** `WorkspaceLayout`, arriba de `/`.
- **Cambia:** suma el selector de conexión a la derecha de la marca, solo cuando hay conexiones. El perfil (avatar, nombre y email) ocupa todo el alto del header pegado a la derecha y abre un menú: fila Idioma (banderas), fila Tema (Sistema, Claro, Oscuro, con sus íconos), separador y Cerrar sesión en rojo.

### Workspace (inicio)

- **Ubicación:** `src/lib/workspace/pages/workspace-page.tsx`, en `/`.
- **Cambia:** con conexiones, muestra el shell en lugar del listado temporal. Sin conexiones, sigue el estado vacío.

### Listado temporal de conexiones

- **Cambia:** se elimina. Crear conexiones pasa al selector del header.

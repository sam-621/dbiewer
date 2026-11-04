# Shell — UI

Capacidades que debe tener la UI, sin estilos ni componentes concretos: como si fuera HTML sin CSS. Reglas de negocio en `product.md`; aquí se referencian, no se repiten.

Las capacidades (qué muestra, qué permite, estados) son obligatorias. La forma (diálogo, página, ruta, posición) es una propuesta: si el diseño la resuelve distinto, se actualiza este archivo para reflejar lo construido.

Maqueta de referencia: https://claude.ai/artifact/1xFf1W9L8owgCoSrEYNPhb. Es una idea, no un diseño literal. La maqueta del layout en paneles es https://claude.ai/artifact/WaVAVXDDdQY5fTMu5i14zN y manda sobre la anterior en layout.

## Pantallas nuevas

### Shell

- **Ubicación:** ruta `/`, cuando el workspace tiene conexiones. Reemplaza el listado temporal de `connections`.
- **Muestra:** un fondo más oscuro que ocupa toda la ventana y, sobre él, el header arriba, dos paneles redondeados separados por un espacio chico (sidebar a la izquierda, área de pestañas a la derecha) y una barra de estado abajo. Header y barra de estado van sobre el fondo, sin borde ni panel propio.
- **Estados:** carga mientras se leen las conexiones; error al leerlas, con reintento.

### Selector de conexión

- **Ubicación:** header del workspace, a la derecha de la marca.
- **Muestra:** minimalista: la conexión activa con un indicador y su nombre, sin el motor ni el host. Al abrirlo, la lista de conexiones con el ícono del motor, su nombre y host, la activa marcada con un check a la derecha, y la acción "New connection".
- **Permite:**
  - Cambiar la conexión activa. Cambian el sidebar y las pestañas.
  - Abrir el modal de nueva conexión de `connections`. Al guardar, la nueva pasa a ser la activa.

### Sidebar

- **Ubicación:** a la izquierda del shell.
- **Muestra:** arriba, dos tabs del mismo ancho, "Explorer" y "Files", sin abarcar toda la fila, con "Collapse all" y "Reload" a la derecha en Explorer; debajo, un buscador a todo el ancho ("Search tables, views…" o "Filter files…"). Los items del sidebar van en la tipografía normal de la aplicación, no en mono.
- **Marca:** la fila del recurso de la pestaña activa (tabla, vista, función o archivo) queda con el estilo del hover, si está visible en el tab del sidebar que se esté viendo. Abrir o cambiar de pestaña nunca cambia el tab del sidebar ni expande grupos.
- **Permite:** cambiar de tab; filtrar lo que se ve en el tab activo; cambiar el ancho arrastrando el espacio entre los paneles (también con las flechas, y doble clic vuelve al ancho por defecto), entre 200 y 520 px. El ancho se recuerda en el navegador.

### Explorer

- **Ubicación:** tab "Explorer" del sidebar.
- **Muestra:**
  - Un nivel por esquema (`public`, `billing`), salvo que haya uno solo.
  - Dentro, los grupos "Tables", "Views" y "Functions" con su cantidad. Un grupo vacío no se muestra.
  - Por tabla: nombre, sin número de filas. Al expandirla, sus columnas con tipo, y un ícono para PK y otro para FK. El tipo se muestra con su alias corto de Postgres (`timestamptz`, `varchar(255)`) y se corta si no entra; el nombre de la columna tiene prioridad.
  - Por vista: nombre, y sus columnas al expandirla.
  - Por función: nombre con sus argumentos (`refresh_stats()`).
  - Los nombres largos de tablas, vistas, funciones y columnas se cortan. Al pasar el mouse, el nombre completo aparece al instante en el mismo lugar, sobrepasando el borde del sidebar, con fondo para que se lea. En una vista con el nombre cortado, tapa el botón "Open" hasta que el mouse llega a él.
  - Una acción "Reload" para volver a leer el esquema.
- **Permite:**
  - Expandir y contraer esquemas, grupos, tablas y vistas. Por defecto está todo contraído, y lo expandido se recuerda al volver al Explorer, al cambiar de conexión y al recargar. "Collapse all", un botón con ícono a la izquierda de "Reload", los contrae todos.
  - Tabla: un clic en la fila la abre en la pestaña provisional; la flechita expande o contrae sus columnas.
  - Vista: toda la fila es un solo botón: un clic expande o contrae sus columnas y un doble clic la abre en la pestaña provisional. Al pasar el mouse aparece a la derecha un botón "Open" que también la abre en la pestaña provisional. Con una función, un clic la abre en la pestaña provisional.
  - Buscar por nombre: filtra en todos los esquemas y expande los grupos con resultados. Esa expansión automática no cambia lo que se recuerda: al vaciar la búsqueda vuelve lo que estaba expandido. Expandir a mano una tabla o vista durante la búsqueda sí se recuerda.
- **Estados:** cargando el esquema; no se pudo conectar, con reintento; base sin objetos; búsqueda sin resultados.

### Files

- **Ubicación:** tab "Files" del sidebar.
- **Muestra:** "Saved" con la cantidad y un botón "New file" solo con ícono; la lista de archivos de la conexión con un ícono por tipo, su nombre con extensión (`top_customers.sql`, `notes.txt`), cuándo se editó (`2d`) y un indicador si tiene cambios sin guardar.
- **Permite:** crear un archivo eligiendo su tipo (SQL o texto) en el menú de "New file", que lo abre sin nombre en una pestaña fija; abrir un archivo en una pestaña fija; filtrar por nombre; renombrar y eliminar un archivo (con confirmación) desde un menú en la fila. Al eliminarlo se cierra su pestaña; al renombrarlo, la pestaña muestra el nombre nuevo.
- **Estados:** cargando; error con reintento; sin archivos, con el botón "New file" con su texto para crear el primero; filtro sin resultados.

### Barra de pestañas

- **Ubicación:** arriba del área de pestañas.
- **Muestra:** una pestaña por objeto o archivo abierto, con un ícono por tipo (tabla, vista, función, SQL, texto) y el nombre. El nombre va en la tipografía normal de la aplicación, no en mono. La activa es una píldora con fondo, sin subrayado. La provisional se distingue (por ejemplo, en cursiva). Una con cambios sin guardar muestra un indicador en lugar de cerrar.
- **Permite:** activar una pestaña; cerrarla; fijar la provisional con doble clic.
- **Estados:** sin pestañas, un estado vacío en el área con una línea que invita a abrir una tabla desde el explorador o un archivo desde Files, sin acciones. Cerrar una con cambios sin guardar pide confirmación.

### Barra de estado

- **Ubicación:** abajo del shell, sobre el fondo.
- **Muestra:** a la izquierda, la ruta de lo que está abierto (`conexión › esquema › objeto`, o solo la conexión sin pestañas); a la derecha, el host y el puerto de la conexión activa, que se ocultan en pantallas angostas.

### Pestaña de tabla o vista

- **Ubicación:** área de pestañas, al abrir una tabla o vista.
- **Muestra:** arriba, el nombre (el esquema se ve en la barra de estado), las filas exactas, un aviso "View · read only" si es una vista, el selector "Data" / "Structure" y "Reload".
- **Data:**
  - Barra de filtros: dos campos de texto discretos, sin borde, en la misma fila y separados por una línea: `WHERE` a la izquierda y `ORDER BY` a la derecha, cada uno con su ícono y su etiqueta como prefijo. El ícono es un botón que abre el historial de ese campo: un menú con lo aplicado antes, con 5 visibles y scroll para el resto, con un degradado arriba o abajo si hay más. Con texto, muestran una acción para quitarlo.
  - Grilla: cuadrícula con líneas horizontales y verticales, número de fila y una columna por campo con su nombre y tipo, la PK marcada. Los valores van en un tono más bajo que los encabezados, y `NULL` en uno aún más bajo, distinto de un texto vacío. Los valores largos se cortan.
  - Paginación: una pastilla flotante sobre la grilla, abajo al centro, con `1–50 of 14,823 · 38 ms`, página actual y total, anterior y siguiente. La grilla deja espacio al final para que no tape la última fila.
- **Columnas:** en la fila del nombre, a la izquierda de "Data" / "Structure", un botón "Columns" que solo se ve en Data. Siempre muestra cuántas se ven del total (`4/25`, `25/25`). Abre un menú con un buscador, "Show all" y una casilla por columna con su nombre y tipo, con scroll y el degradado del Explorer. La última columna visible no se puede ocultar.
- **Detalle de fila:** al hacer clic en una fila de la grilla se abre un panel a la derecha con un campo por columna (nombre, tipo, PK) y su valor en un input de solo lectura, con copiar. `NULL` se ve distinto del texto vacío. La fila abierta queda marcada. Más adelante será un form para editar la fila (milestone 9).
- **Structure:** columnas (nombre, tipo, si admite null, default), índices (nombre, definición, si es único), FKs (columnas, referencia, acción al borrar) y el DDL o la definición de la vista, con copiar.
- **Permite:** escribir el `WHERE` y el `ORDER BY` con autocompletado de columnas y palabras clave; aplicarlos con Enter (con sugerencias abiertas, Enter acepta la sugerencia); volver a aplicar uno del historial; quitarlos con su acción o vaciando el campo; ordenar por una columna desde el encabezado de la grilla, que escribe en el campo `ORDER BY`; paginar; elegir las columnas visibles; abrir el detalle de una fila (desde ahí se copia cada valor); pasar entre Data y Structure. Cualquiera de estas acciones fija la pestaña.
- **Estados:** cargando; error de conexión o de query, con reintento; `WHERE` u `ORDER BY` inválido, con el mensaje de Postgres en lugar de la grilla y la barra de filtros visible; la tabla ya no existe; sin filas, o sin filas con esos filtros.

### Pestaña SQL

- **Ubicación:** área de pestañas, al abrir o crear un archivo `sql`.
- **Muestra:**
  - Barra: "Run" con `⌘↵`, "Save" y "Format", y a la derecha la conexión contra la que corre (la activa, solo informativa).
  - Editor de SQL con números de línea y resaltado. La columna de números reserva 3 dígitos para que el texto no salte al agregar líneas.
  - Separador que se puede arrastrar.
  - Panel de abajo con Results, sin otros tabs. A la derecha, `7 rows · 124 ms`.
  - Results: grilla como la de la tabla, con aviso si el resultado está truncado en 1,000 filas. Si no hay filas, el tag de la sentencia (`UPDATE 3`).
- **Permite:**
  - Escribir SQL, con autocompletado de palabras clave, esquemas, tablas, vistas y columnas (también después de `tabla.` o del alias).
  - Ejecutar con "Run" o `⌘↵` lo seleccionado o la sentencia bajo el cursor.
  - Guardar con "Save" o `⌘S`. Si es nueva, pide el nombre.
  - Formatear el SQL.
- **Estados:** sin ejecutar ("Run the query with ⌘↵ to see results here"); ejecutando, con indicador y "Run" deshabilitado; error, con el mensaje de Postgres en el panel; guardando; nombre inválido o repetido, en el diálogo del nombre.

### Pestaña de texto

- **Ubicación:** área de pestañas, al abrir o crear un archivo `txt`.
- **Muestra:** barra con "Save" y el editor de texto plano a todo el alto, sin resaltado de SQL, sin "Run", sin "Format" y sin panel de resultados.
- **Permite:** escribir y guardar con "Save" o `⌘S`. Si es nuevo, pide el nombre.
- **Estados:** cargando; error; el archivo ya no existe; guardando; nombre inválido o repetido, en el diálogo del nombre.

### Pestaña de función

- **Ubicación:** área de pestañas, al abrir una función o procedimiento.
- **Muestra:** el aviso "Function · read only" y su definición en el editor, sin poder editarla ni ejecutarla, y sin panel de resultados.
- **Permite:** copiar la definición.
- **Estados:** cargando; error; la función ya no existe.

## Cambios a UI existente

### Header del workspace

- **Ubicación:** `WorkspaceLayout`, arriba de `/`.
- **Cambia:** header bajo, sin borde, sobre el fondo del shell. Suma el selector de conexión a la derecha de la marca, solo cuando hay conexiones. El perfil (solo el avatar) va pegado a la derecha y abre un menú: arriba el nombre y el email del usuario, separador, fila Idioma (banderas), fila Tema (Sistema, Claro, Oscuro, con sus íconos), separador y Cerrar sesión en rojo.

### Workspace (inicio)

- **Ubicación:** `src/lib/workspace/pages/workspace-page.tsx`, en `/`.
- **Cambia:** con conexiones, muestra el shell en lugar del listado temporal. Sin conexiones, sigue el estado vacío.

### Listado temporal de conexiones

- **Cambia:** se elimina. Crear conexiones pasa al selector del header.

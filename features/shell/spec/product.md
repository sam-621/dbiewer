---
status: active
apps: [api, web]
created: 2026-10-26
---

# Shell

## Contexto

Con `connections` el usuario ya puede guardar sus conexiones, pero en `/` solo ve un listado temporal y no puede hacer nada con ellas. Esta feature arma el espacio de trabajo de dbiewer: un header con la conexión activa, un sidebar para explorar el esquema y las queries guardadas, y pestañas para ver tablas y escribir SQL.

Cubre los milestones 3 (exploración del esquema), 4 (SQL playground) y 5 (queries guardadas, sin export) de `docs/roadmap.md`, y la parte de lectura del 9 (vista de tabla con filtros, orden y paginación). La maqueta de referencia es https://claude.ai/artifact/1xFf1W9L8owgCoSrEYNPhb.

## Historia de usuario

Como usuario con una base Postgres conectada, quiero explorar sus tablas, ver sus datos y correr queries desde el navegador, y guardar las que uso seguido, para trabajar con mi base sin instalar un cliente.

## Flujo

1. El usuario entra a `/`. Si no tiene conexiones, ve el estado vacío de `connections`. Si tiene, entra al shell con la última conexión que usó o, si no hay una, con la más reciente.
2. En el sidebar, el tab Explorer muestra el esquema de la conexión: tablas, vistas y funciones, agrupadas por esquema de Postgres.
3. Con un clic en una tabla, se abre una pestaña provisional con sus datos; con la flechita, ve sus columnas. Puede filtrar, ordenar, paginar o pasar a Structure para ver columnas, índices, FKs y DDL. En cuanto hace algo en ella, o con doble clic en la pestaña, se fija.
4. En el tab Files ve los archivos de esa conexión. Puede abrir uno o crear uno nuevo, eligiendo si es SQL o texto.
5. En una pestaña SQL escribe la query y la ejecuta. Abajo ve los resultados. En una pestaña de texto solo escribe. En las dos guarda con ⌘S.
6. Desde el header cambia de conexión. Todo el espacio de trabajo cambia, y al volver encuentra sus pestañas como las dejó.

## Reglas de negocio

### Conexión activa

- Siempre hay una conexión activa mientras el workspace tenga conexiones. Es la única de la que se muestra algo.
- Todo corre contra la conexión activa: el esquema, las tablas y las queries. No hay otro selector de conexión.
- Desde el selector del header también se crea una conexión nueva. Eliminar una conexión no se hace desde el web por ahora.

### Esquema

- El esquema no se guarda en dbiewer: se lee de la base del usuario cada vez que hace falta. El usuario puede recargarlo a mano.
- Se muestran los esquemas de la base que tienen objetos, menos los del sistema (`pg_catalog`, `information_schema`, `pg_toast` y los temporales).
- Si la base tiene un solo esquema con objetos, el explorador no muestra ese nivel.
- El explorador no muestra el número de filas de las tablas.
- El explorador arranca con todo contraído. Lo que el usuario expande se recuerda en ese navegador, por conexión.
- Dentro de la tabla, el número de filas es exacto y respeta los filtros aplicados.

### Tablas y vistas

- Una vista se ve igual que una tabla, en solo lectura.
- Las filas se leen de a 50 por página.
- Filtro: un campo de texto con la condición `WHERE` en SQL de Postgres (`plan = 'pro' and age > 30`), con autocompletado. Vacío, no filtra.
- Orden: un campo de texto con la expresión `ORDER BY` en SQL de Postgres (`created_at desc, name`), con autocompletado. Vacío, ordena por la PK si existe. Siempre se desempata por la PK para que las páginas no repitan ni pierdan filas.
- El filtro y el orden tienen cada uno su historial por tabla: lo aplicado con Enter, del más reciente al más antiguo y sin repetidos. Dura lo que la sesión del navegador. Elegir uno lo escribe en el campo y lo aplica.
- El usuario elige qué columnas ve en Data, al menos una. Es solo visual: no cambia lo que se pide a la api y el detalle de fila sigue mostrando todas. La elección vive en memoria mientras la pestaña esté abierta: se mantiene al cambiar de pestaña o de conexión y se pierde al cerrar la pestaña o recargar el navegador.
- Si el filtro o el orden no son válidos, se muestra el mensaje de error de Postgres y los campos siguen editables para corregirlos.

### Funciones

- Una función o procedimiento se abre en solo lectura con su definición. No se ejecuta desde ahí.

### Ejecutar queries

- Se ejecuta lo seleccionado o, si no hay selección, la sentencia bajo el cursor.
- El editor autocompleta palabras clave de Postgres y los esquemas, tablas, vistas y columnas de la conexión activa. Las tablas de `public` se sugieren también sin el esquema.
- Una query devuelve como máximo 1,000 filas. Si había más, se avisa que el resultado está truncado.
- Una query se corta a los 30 s.
- Si la ejecución tiene varias sentencias, se muestran las filas de la última que devuelva filas. Si ninguna devuelve filas, se muestra el resultado de la última (`UPDATE 3`).
- Si la query falla, se muestra el mensaje de error de Postgres en lugar de los resultados.
- Las ejecuciones no se guardan: no hay historial.
- Se ejecuta lo que el usuario escriba, incluidas escrituras, sin confirmación.

### Archivos

- Un archivo es de tipo `sql` o `txt`. Una query guardada es un archivo `sql`.
- Los archivos se crean solo desde el tab Files, eligiendo el tipo al crearlos.
- Un archivo `txt` es texto plano: no se ejecuta ni se formatea.
- Un archivo pertenece a una conexión. Al borrar la conexión, se borran sus archivos.
- Nombre: obligatorio, sin espacios a los lados, de 100 caracteres como máximo y único en la conexión por tipo, sin distinguir mayúsculas. Se muestra con su extensión al final (`.sql`, `.txt`).
- Se puede crear, renombrar, editar el contenido y eliminar (con confirmación).
- Un archivo nuevo se abre en una pestaña fija y no se guarda hasta que el usuario lo guarda y le pone nombre.

### Pestañas

- Las pestañas abiertas son de cada conexión y persisten en el navegador, junto con los cambios sin guardar.
- Hay una sola pestaña provisional a la vez. Abrir otro objeto desde el explorador la reemplaza.
- Si una pestaña apunta a algo que ya no existe en la base, muestra un estado vacío en vez de fallar.
- Cerrar una pestaña con cambios sin guardar pide confirmación.

## Decisiones

- **El esquema se lee en vivo y no se guarda**: copiarlo a nuestra base lo desincroniza en cuanto el usuario cambia su esquema. React Query lo guarda en caché mientras la app está abierta.
- **Un solo pedido para todo el árbol**: el buscador filtra todas las tablas y el árbol muestra columnas al expandir, así que el árbol completo llega en una sola consulta a `pg_catalog`. Lo pesado (índices, FKs, DDL, conteo exacto y filas) se pide al abrir la tabla.
- **Pestañas y borradores en `localStorage`, queries guardadas en la api**: las pestañas son estado de ese navegador; las queries son datos del usuario y deben verse desde cualquier navegador.
- **Pestañas por conexión**: al cambiar de conexión se cambia el espacio de trabajo entero, así nunca hay una pestaña abierta contra la conexión equivocada.
- **Un solo selector de conexión, en el header**: se descarta un selector en el editor (como en la captura original) porque compite con el del header.
- **Explorer en vez de "Schema"**: el árbol del sidebar se llama Explorer para no chocar con el diagrama, que llega con el milestone 6.
- **Pestaña provisional**: explorar tablas no llena la barra de pestañas. Mismo modelo que VS Code.
- **Índices, FKs y DDL en Structure, no en el árbol**: el árbol queda liviano, con columnas y tipos.
- **Sin pestaña fija de diagrama por ahora**: el diagrama es el milestone 6. Hasta entonces, sin pestañas abiertas se ve un estado vacío.
- **Sin historial ni Messages**: el panel de resultados de la pestaña SQL solo tiene Results. El usuario no los necesita.
- **`WHERE` y `ORDER BY` como texto libre**: escribir es más rápido que armar condiciones con menús y permite cualquier expresión de Postgres (`or`, funciones, casts). La api los pega tal cual en la consulta: no abre nada nuevo, porque el usuario ya puede ejecutar cualquier SQL contra esa conexión desde la pestaña SQL.
- **Layout en paneles flotantes**: dos paneles redondeados sobre un fondo más oscuro, con header y barra de estado sobre el fondo. Le da a dbiewer una identidad propia frente a los clientes web con sidebar y bordes.
- **Tabla genérica `file` en vez de `saved_query`**: además de queries se guardan archivos de texto. El tipo (`sql`, `txt`) coincide con la extensión que se muestra en el nombre.
- **Archivos solo desde el tab Files**: un único punto de creación, donde se elige el tipo. Se quita el "+" de la barra de pestañas.
- **Pool de conexiones por conexión en la api**: abrir un cliente por cada pedido es lento para navegar tablas.

## Fuera de alcance

- Diagrama del esquema (milestone 6).
- `EXPLAIN` (milestone 7).
- Asistente IA (milestone 8).
- Editar, insertar o borrar filas desde la vista de tabla, y saltar de una FK a la fila referenciada (milestone 9).
- Exportar resultados a CSV o JSON (milestone 5).
- Cancelar una query en curso.
- Confirmar escrituras o modo de solo lectura (decisión pendiente en `docs/roadmap.md`).
- Historial de ejecuciones y tab Messages.
- Carpetas de queries y queries compartidas.
- Editar o eliminar una conexión desde el web.

## Plan de trabajo recomendado

1. [x] api: pool de conexiones en `PostgresService` e introspección con la query `connectionSchema`, con sus tests e2e.
2. [x] web: shell con header y selector de conexión, sidebar con Explorer y buscador; reemplaza el listado temporal.
3. [x] api: queries `tableStructure` y `tableRows` con filtros, orden y paginación, con sus tests e2e.
4. [x] web: barra de pestañas (provisional, por conexión, en `localStorage`) y pestaña de tabla o vista con Data y Structure.
5. [x] api: mutation `runQuery` con límites, con sus tests e2e.
6. [x] web: pestaña SQL con editor, ejecutar y Results, y pestaña de función en solo lectura.
7. [x] api: tabla `file` con su CRUD, con sus tests e2e.
8. [x] web: tab Files del sidebar, nuevo archivo (SQL o texto), pestaña de texto, guardar con ⌘S, renombrar y eliminar.

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
3. Con un clic en una tabla, se abre una pestaña provisional con sus datos. Puede filtrar, ordenar, paginar o pasar a Structure para ver columnas, índices, FKs y DDL. Con doble clic, o en cuanto hace algo en ella, la pestaña se fija.
4. En el tab Queries ve sus queries guardadas de esa conexión. Puede abrir una o crear una nueva.
5. En una pestaña SQL escribe la query y la ejecuta. Abajo ve los resultados, los mensajes y el historial de la conexión. Guarda con ⌘S.
6. Desde el header cambia de conexión. Todo el espacio de trabajo cambia, y al volver encuentra sus pestañas como las dejó.

## Reglas de negocio

### Conexión activa

- Siempre hay una conexión activa mientras el workspace tenga conexiones. Es la única de la que se muestra algo.
- Todo corre contra la conexión activa: el esquema, las tablas, las queries y el historial. No hay otro selector de conexión.
- Desde el selector del header también se crea una conexión nueva y se elimina una existente (con confirmación). Al eliminar la conexión activa, pasa a ser activa la más reciente que quede. Al eliminar la última, se vuelve al estado vacío.

### Esquema

- El esquema no se guarda en dbiewer: se lee de la base del usuario cada vez que hace falta. El usuario puede recargarlo a mano.
- Se muestran los esquemas de la base que tienen objetos, menos los del sistema (`pg_catalog`, `information_schema`, `pg_toast` y los temporales).
- Si la base tiene un solo esquema con objetos, el explorador no muestra ese nivel.
- En el explorador, el número de filas de una tabla es un estimado. Si Postgres no tiene estimado (la tabla nunca se analizó), no se muestra ningún número.
- Dentro de la tabla, el número de filas es exacto y respeta los filtros aplicados.

### Tablas y vistas

- Una vista se ve igual que una tabla, en solo lectura.
- Las filas se leen de a 50 por página.
- Filtros: una o más condiciones unidas con `AND`, cada una con columna, operador y valor. Operadores: `=`, `!=`, `>`, `>=`, `<`, `<=`, `contains` (sin distinguir mayúsculas), `is null` e `is not null`.
- Orden: una columna, ascendente o descendente. Por defecto, por la PK si existe.
- La api solo acepta columnas que existen en la tabla. Los valores de los filtros nunca se concatenan al SQL.

### Funciones

- Una función o procedimiento se abre en solo lectura con su definición. No se ejecuta desde ahí.

### Ejecutar queries

- Se ejecuta lo seleccionado o, si no hay selección, la sentencia bajo el cursor.
- Una query devuelve como máximo 1,000 filas. Si había más, se avisa que el resultado está truncado.
- Una query se corta a los 30 s.
- Si la ejecución tiene varias sentencias, se muestran las filas de la última y en Messages el resultado de cada una.
- Si la query falla, se muestra el mensaje de error de Postgres.
- Se ejecuta lo que el usuario escriba, incluidas escrituras, sin confirmación.

### Historial

- Cada ejecución, exitosa o fallida, queda en el historial de la conexión: SQL, cuándo, duración, filas y error si lo hubo.
- El historial es de la conexión, no de la pestaña ni del archivo.
- Se muestran las últimas 100 ejecuciones. Al borrar la conexión, se borra su historial.

### Queries guardadas

- Una query guardada pertenece a una conexión. Al borrar la conexión, se borran sus queries.
- Nombre: obligatorio, sin espacios a los lados, de 100 caracteres como máximo y único en la conexión sin distinguir mayúsculas. Se muestra con `.sql` al final.
- Se puede crear, renombrar, editar el SQL y eliminar (con confirmación).
- Una query nueva no se guarda hasta que el usuario la guarda y le pone nombre.

### Pestañas

- Las pestañas abiertas son de cada conexión y persisten en el navegador, junto con los cambios sin guardar.
- Hay una sola pestaña provisional a la vez. Abrir otro objeto desde el explorador la reemplaza.
- Si una pestaña apunta a algo que ya no existe en la base, muestra un estado vacío en vez de fallar.
- Cerrar una pestaña con cambios sin guardar pide confirmación.

## Decisiones

- **El esquema se lee en vivo y no se guarda**: copiarlo a nuestra base lo desincroniza en cuanto el usuario cambia su esquema. React Query lo guarda en caché mientras la app está abierta.
- **Un solo pedido para todo el árbol**: el buscador filtra todas las tablas y el árbol muestra columnas al expandir, así que el árbol completo llega en una sola consulta a `pg_catalog`. Lo pesado (índices, FKs, DDL, conteo exacto y filas) se pide al abrir la tabla.
- **Pestañas y borradores en `localStorage`, queries guardadas e historial en la api**: las pestañas son estado de ese navegador; las queries y el historial son datos del usuario y deben verse desde cualquier navegador.
- **Pestañas por conexión**: al cambiar de conexión se cambia el espacio de trabajo entero, así nunca hay una pestaña abierta contra la conexión equivocada.
- **Un solo selector de conexión, en el header**: se descarta un selector en el editor (como en la captura original) porque compite con el del header.
- **Explorer en vez de "Schema"**: el árbol del sidebar se llama Explorer para no chocar con el diagrama, que llega con el milestone 6.
- **Pestaña provisional**: explorar tablas no llena la barra de pestañas. Mismo modelo que VS Code.
- **Índices, FKs y DDL en Structure, no en el árbol**: el árbol queda liviano, con columnas y tipos.
- **Sin pestaña fija de diagrama por ahora**: el diagrama es el milestone 6. Hasta entonces, sin pestañas abiertas se ve un estado vacío.
- **Historial de la conexión**: no se pierde al cerrar una pestaña o borrar un archivo.
- **Pool de conexiones por conexión en la api**: abrir un cliente por cada pedido es lento para navegar tablas.

## Fuera de alcance

- Diagrama del esquema (milestone 6).
- Autocompletado y `EXPLAIN` (milestone 7).
- Asistente IA (milestone 8).
- Editar, insertar o borrar filas desde la vista de tabla, y saltar de una FK a la fila referenciada (milestone 9).
- Exportar resultados a CSV o JSON (milestone 5).
- Cancelar una query en curso.
- Confirmar escrituras o modo de solo lectura (decisión pendiente en `docs/roadmap.md`).
- Retención del historial por plan (milestone 10).
- Carpetas de queries y queries compartidas.
- Editar una conexión desde el web.

## Plan de trabajo recomendado

1. [x] api: pool de conexiones en `PostgresService` e introspección con la query `connectionSchema`, con sus tests e2e.
2. [ ] web: shell con header y selector de conexión, sidebar con Explorer y buscador; reemplaza el listado temporal.
3. [ ] api: queries `tableStructure` y `tableRows` con filtros, orden y paginación, con sus tests e2e.
4. [ ] web: barra de pestañas (provisional, por conexión, en `localStorage`) y pestaña de tabla o vista con Data y Structure.
5. [ ] api: tabla `query_history`, mutation `runQuery` con límites y query `queryHistory`, con sus tests e2e.
6. [ ] web: pestaña SQL con editor, ejecutar, Results, Messages e History, y pestaña de función en solo lectura.
7. [ ] api: tabla `saved_query` con su CRUD, con sus tests e2e.
8. [ ] web: tab Queries del sidebar, nueva query, guardar con ⌘S, renombrar y eliminar.

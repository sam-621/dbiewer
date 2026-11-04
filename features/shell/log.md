# Shell — log

## 2026-10-26 — samuel.corrales621

**Hecho:**
- (api, web) Se crea la feature `shell`: spec de producto, técnico y de UI, y plan de trabajo. Maqueta de referencia en https://claude.ai/artifact/1xFf1W9L8owgCoSrEYNPhb.
- (api) Pool de conexiones en `PostgresService` (3 clientes, 5 min sin uso, `statement_timeout` de 30 s), descartado al actualizar o eliminar la conexión y cerrado al apagar. Falta la introspección del paso 1.
- (api) Los tests de integración pasan a `*.int.test.ts`; la config es `vitest.int.config.ts` y el comando `yarn test:int`. Docs actualizados.
- (api) Se quitan los `vi.spyOn` de los e2e de update y remove connection, y las constantes de `PostgresService` pasan a la clase. Reglas nuevas en `testing.md` y `code-style.md`.
- (api) `PostgresConnectionFailedError` recibe las `PostgresCredentials` y se instancia donde se lanza.
- (api) Query `connectionSchema`: una sola consulta a `pg_catalog` arma el árbol de esquemas, tablas, vistas, funciones y columnas. Con e2e e integración. Cierra el paso 1.
- (api) Los e2e de operaciones que usan `PostgresService` lo mockean en vez de preparar la DB de test. `apiResponse` vale también para queries. Reglas en `testing.md` y `architecture.md`.
- (api) Queries `tableStructure` y `tableRows` (filtros, orden con desempate por PK, páginas de 50 y conteo exacto), con e2e e integración. Cierra el paso 3.

**Decisiones:**
- El esquema se lee en vivo de la base del usuario y no se guarda. El árbol completo llega en una sola consulta; lo pesado se pide al abrir la tabla.
- Las pestañas y los borradores van en `localStorage` por conexión. Las queries guardadas y el historial, en la api.
- Un solo selector de conexión, en el header. El árbol del sidebar se llama Explorer.
- Pestaña provisional al explorar; índices, FKs y DDL en Structure, no en el árbol.
- El diagrama queda para el milestone 6: sin pestaña fija por ahora.
- El historial es de la conexión, no de la pestaña.
- El explorador no muestra esquemas sin objetos. Las vistas materializadas van como vistas y las tablas particionadas como tablas.

## 2026-11-02 — samuel.corrales621

**Hecho:**
- (web) Selector de conexiones en el header con `useActiveConnection`: la activa se guarda en `localStorage` (`dbiewer:active-connection`) y, si no hay o ya no existe, se usa la más reciente. Sin "New connection" ni eliminar todavía. Parte del paso 2.
- (web) Selector de conexiones más minimalista: el trigger muestra solo el indicador y el nombre; la lista, nombre y host, en la tipografía normal (sin mono). `ui.md` actualizado.
- (web) Sidebar del shell: conexión activa compartida con un context, layout a toda la altura, tabs Explorer y Queries (vacío hasta los pasos 7 y 8) con buscador, y Explorer con el árbol de `connectionSchema`, búsqueda, Reload y estados. El área principal sigue con el listado temporal hasta que el selector tenga "New connection" y eliminar.
- (web) Explorer: los tipos largos tapaban el nombre de la columna. El nombre tiene prioridad, el tipo se corta, y se muestra con su alias corto de Postgres (`timestamptz`, `varchar(255)`, `char(2)`).
- (web) Explorer: los nombres de tablas, vistas y funciones muestran el completo al pasar el mouse, y se quita el número de filas estimadas. El sidebar se puede redimensionar (200–520 px, con teclado y doble clic para volver al default) y recuerda el ancho en `localStorage`.
- (web) Explorer: toda la fila de una tabla o vista es un solo botón que la expande o contrae, sin un botón aparte para el chevron. Cómo se abre la vista de tabla queda para el paso 4.
- (web) `design-system.md`: si coss no tiene un componente, se puede armar propio con tokens.
- (web) Selector de conexiones: acción "New connection" que abre el modal de `connections`; al guardar, la nueva pasa a ser la activa. Las filas vuelven a tener el ícono de Postgres.
- (web) Barra de pestañas por conexión en `localStorage` (una provisional, se fija con doble clic o al actuar en ella) y pestaña de tabla o vista con Data (filtros, orden, paginación, copiar) y Structure (columnas, índices, FKs, DDL). Cierra el paso 4.
- (web) Eliminar conexión desde el selector, con confirmación. Se borra el listado temporal. Cierra el paso 2.
- (web) Las pestañas Data y Structure tienen el mismo ancho.
- (web) Detalle de fila: clic en una fila abre un panel a la derecha con un campo de solo lectura por columna, con copiar. Se quita el botón de copiar de las celdas de la grilla.
- (web) Explorer: clic despliega la tabla o vista y doble clic la abre en la pestaña provisional. La pestaña se fija con doble clic en la barra o al actuar en ella.

## 2026-11-03 — samuel.corrales621

**Hecho:**
- (web) Se quita eliminar conexión del selector del header, junto con su diálogo y la mutation. Eliminar una conexión queda fuera de alcance en el web. El check de la conexión activa pasa a la derecha, separado del texto.
- (web) Barra de pestañas: el subrayado de la pestaña activa abarca también el botón de cerrar.
- (web) Explorer: al pasar el mouse por una tabla o vista aparece un botón para abrirla en la pestaña provisional; el clic sigue expandiendo y el doble clic sigue abriéndola.
- (web) Las barras de scroll nativas usan el esquema oscuro en modo oscuro.
- (web) Explorer: en las tablas, el clic en la fila la abre en la pestaña provisional y la flechita despliega las columnas. Las vistas siguen expandiéndose con clic y abriéndose con doble clic o el botón al pasar el mouse.
- (web) Header: el perfil abre un menú con idioma (banderas), tema (Sistema, Claro, Oscuro) y cerrar sesión en rojo, ocupando todo el alto del header a la derecha. Se comparten las banderas, los íconos y las opciones de tema con el onboarding.
- (web) Los botones (`Button`) bajan 1 px al hacer clic, con la misma animación que vendyx.
- (web) Favicon con el logo de dbiewer.
- (api, web) Se quitan el historial de ejecuciones y el tab Messages: el panel de la pestaña SQL solo tiene Results, que muestra el error de Postgres o el tag de la sentencia cuando no hay filas. `runQuery` no guarda nada, devuelve `command` en vez de `commands` y acepta SQL de hasta 100,000 caracteres. Pasos 5 y 6 actualizados en el spec.
- (api) `PostgresService.runQuery`: corre SQL libre con el protocolo simple, toma las filas del último resultado con columnas (máximo 1,000, con `isTruncated`), devuelve `command` y `durationMs`, y destruye el cliente al terminar para no arrastrar estado de sesión. Con tests de integración. Parte del paso 5.
- (api) Mutation `runQuery` con el use-case `QueryRunner`: SQL obligatorio de hasta 100,000 caracteres y errores `CONNECTION_NOT_FOUND`, `CONNECTION_FAILED`, `QUERY_FAILED` e `INVALID_INPUT`. Con e2e. Cierra el paso 5.
- (api) Cada use-case define su schema zod en su propio archivo, sin compartirlo: se borran `connection-schemas.ts`, `database-schema-schemas.ts` y `query-schemas.ts`. Regla nueva en `architecture.md`.
- (web) Pestaña SQL: "New query" en la barra de pestañas y en el estado vacío abre un borrador ("Untitled N") guardado en `localStorage`; editor CodeMirror con Run (⌘↵) sobre la selección o la sentencia bajo el cursor, Format, separador arrastrable y panel Results (grilla, truncado a 1,000, tag sin filas, error de Postgres). El resaltado SQL tiene valores para claro y oscuro. Parte del paso 6; falta la pestaña de función.
- (web) Autocompletado en el editor SQL: palabras clave de Postgres, esquemas, tablas, vistas y columnas (también después de `tabla.` o del alias), desde la cache de `connectionSchema`. Sale de fuera de alcance; spec actualizado.
- (api) Query `functionDefinition` con `pg_get_functiondef`: recibe `arguments` para distinguir funciones sobrecargadas y devuelve `OBJECT_NOT_FOUND` si no existe. Con e2e e integración. Parte del paso 6; la pestaña de función en el web sigue pendiente.
- (web) Pestaña de función: doble clic en el Explorer la abre en la pestaña provisional, con el aviso de solo lectura, la definición en CodeMirror sin editar ni ejecutar y un botón de copiar. Cierra el paso 6.
- (web) Explorer: las funciones se abren en la pestaña provisional con un clic.
- (api) Tabla `saved_query` con RLS, FK a `connection` con cascade e índice único por `(connection_id, lower(name))`, con su migración generada y la custom. Parte del paso 7; falta el CRUD.
- (web) Explorer: al pasar el mouse por un nombre cortado aparece al instante el nombre completo en el mismo lugar, sobrepasando el borde del sidebar, con fondo opaco. Reemplaza el `title` en tablas, vistas, funciones y columnas. `ui.md` actualizado.
- (api) `tableRows` recibe `where` y `orderBy` como fragmentos de SQL de texto libre, hasta 10,000 caracteres cada uno, en vez de filtros estructurados. Si Postgres los rechaza, `QUERY_FAILED`. El cliente se destruye al terminar, como en `runQuery`. Se borran `DbFilterInput`, `DbFilterOperator`, `DbOrderInput` y `SortDirection`. Spec actualizado.
- (web) Pestaña de tabla: la barra de filtros pasa a dos campos de texto libre, `WHERE` y `ORDER BY`, con CodeMirror de una línea y autocompletado de columnas y palabras clave. Enter aplica, cada campo se puede quitar, el encabezado de la grilla escribe en `ORDER BY` y el error de Postgres se muestra con la barra editable. Se borran los chips y menús de filtros.
- (web) Historial de `WHERE` y `ORDER BY` por tabla en `sessionStorage`: se abre desde el ícono del campo, con 5 visibles y scroll, y elegir uno lo aplica.
- (web) Historial de `WHERE` y `ORDER BY`: la lista usa el mismo degradado del Explorer para indicar que hay más arriba o abajo.
- (web) Layout en paneles flotantes: fondo `shell`, header bajo sin borde, sidebar y área de pestañas en dos paneles redondeados con el resize en el espacio entre ellos, barra de estado con la ruta y el host, pestaña activa como píldora y paginación en una pastilla flotante. Token `shell` en `design-system.md`. Maqueta en https://claude.ai/artifact/WaVAVXDDdQY5fTMu5i14zN.
- (web) Encabezado de la tabla como la maqueta: solo el nombre, en sans, sin ícono ni esquema. Header del sidebar con tabs de igual ancho, Reload a la derecha y buscador a todo el ancho. Ícono de Reload más chico.
- (web) Grilla: los valores bajan de tono frente a los encabezados y `NULL` baja aún más. Aplica también a Results de la pestaña SQL.
- (web) Grilla: suma líneas verticales para marcar la cuadrícula. Aplica también a Results de la pestaña SQL.
- (web) Pestaña de tabla: botón "Columns" a la izquierda de Data / Structure para elegir las columnas visibles, con buscador y "Show all". La elección vive en memoria por pestaña: sobrevive a cambiar de pestaña o de conexión y se pierde al cerrarla o recargar.
- (web) El botón "Columns" siempre muestra cuántas columnas se ven del total.
- (web) El encabezado de la tabla ya no muestra la cantidad de columnas: esa información queda en el botón "Columns".
- (api) La tabla `saved_query` se reemplaza por `file`, genérica para archivos `sql` y `txt`: `content` en vez de `sql`, columna `type` (texto en la base, enum en el código) e índice único por `(connection_id, type, lower(name))`. Con su migración generada y la custom, sin backfill. Spec actualizado; el CRUD del paso 7 pasa a `File`.

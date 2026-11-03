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

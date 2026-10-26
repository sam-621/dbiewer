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

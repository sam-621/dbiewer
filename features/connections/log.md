# Conexiones — log

## 2026-10-26 — samuel.corrales621

**Hecho:**
- (api, web) Se crea la feature `connections`: spec de producto, técnico y de UI, y plan de trabajo.
- (api) Service de cifrado `EncryptionService` (AES-256-GCM, formato `v1`), `CONNECTIONS_ENCRYPTION_KEY` en la config, `services.encryptionService` en el app context y sus unit tests (paso 1).
- (api) `email-errors.ts` pasa a `src/services/emails/`. Docs de la api y `technical.md` actualizados con el cifrado, el service sin proveedor externo y los errores dentro de su service.
- (api) Tabla `connection` con RLS (migraciones `0003_create_connection` y `0004_connection_rls`), `ConnectionRepository` y sus tests de integración (paso 2).
- (api) Los métodos del `Repository` base (`findMany`, `findOne`, `insert`, `update`, `remove`) pasan a públicos. `ConnectionRepository` deja solo `findAll` y `existsByName`.
- (api) Los tests de repositorio corren como `app_user` (`testAppDatabase`), con RLS. `testing.md` actualizado.
- (api) `code-style.md` y `architecture.md` > Repositorios: se usan directo los métodos públicos del base, sin envolverlos.
- (api) Queries `connections` y `connection(id)` con sus e2e (parte del paso 3).
- (api) `architecture.md`, `testing.md` y `technical.md` actualizados: queries sin use-case, enum resolver con `enumValues` y fixtures con orden fijo.
- (api) Mutations `createConnection`, `updateConnection` y `removeConnection` con sus use-cases, `ConnectionValidator` y sus tests unit y e2e (paso 3).
- (api) Clase base `UseCase` con zod (`src/shared/use-case.ts`) e `InvalidInputError`. Los use-cases de conexiones la extienden; se borran `ConnectionValidator` y los 6 códigos de error de formato.
- (api) `INVALID_INPUT` con el mensaje de `z.prettifyError`; se borra la rama de `ZodError` del error handler. `architecture.md`, `code-style.md` y `technical.md` actualizados con `UseCase`, los schemas e `INVALID_INPUT`.
- (web) Avatar generado con `boring-avatars` (`UserAvatar`, variante `marble`, a partir del id del usuario) para los usuarios sin foto (parte del paso 4).
- (web) Estado vacío de conexiones en `/` con el perfil del usuario en sesión (`SessionUser`: avatar, nombre, email y Sign out), carga y error con reintento. `GET_CONNECTIONS_QUERY` y `useGetConnections` (parte del paso 4).
- (api) Los errores inesperados ya no salen con `originalError` en ningún ambiente. Se loguean con el patrón de vendyx: plugin `useErrorLogger` de yoga, `Logger` con `error(message, error, meta)` y `formatError`.
- (api) `architecture.md` y `testing.md` actualizados con `api/plugins/`, `useErrorLogger`, la firma del logger y el error genérico en todos los ambientes.
- (web) Header en `/` con la marca a la izquierda y el perfil (avatar, nombre y email, sin acciones) a la derecha. Se quita la marca del estado vacío y el botón "Sign out".
- (web) El estado vacío lleva arriba el ícono `grid-2x2` de amicons (`GridIcon`) en `EmptyMedia` con variante `icon`.
- (web) `ui.md` actualizado: header del workspace con el perfil, ícono del estado vacío y sin "Sign out".
- (web) Formulario de nueva conexión en `/connections/new` con el header del workspace (`WorkspaceLayout`), campo URL que autocompleta los campos (`parseConnectionUrl`), validaciones y errores de la api; al guardar vuelve a `/` (paso 4).
- (web) Listado temporal en `/` con eliminar y confirmación (`AlertDialog`), `useCreateConnection`, `useRemoveConnection` y sus tests (paso 5).
- (web) Se quita la nota de solo Postgres del formulario.
- (web) El formulario de nueva conexión pasa de la página `/connections/new` a un modal (`NewConnectionDialog`) con el ícono de Postgres (`PostgresIcon`) y "PostgreSQL" arriba, Name y SSL en la misma fila, y las secciones Server (host, puerto, base) y Authentication (usuario, contraseña). Se quitan el campo URL y `parseConnectionUrl`.
- (web) Se quitan las secciones Server y Authentication del modal: los campos quedan sin agrupar.
- (web) Vuelve el campo URL al modal, debajo de Name + SSL, para autocompletar los campos (`parseConnectionUrl`). Una URL inválida frena el guardado.
- (web) `product.md`, `ui.md` y `technical.md` actualizados con el modal de nueva conexión, la URL debajo de Name + SSL, `PostgresIcon`, `WorkspaceLayout` y `connection-row/`. `architecture.md` suma el patrón de modales con formulario y la excepción a `<X>Details` mientras el web no edite; `design-system.md`, los logos de motores.

**Decisiones:**
- Los use-cases validan el input crudo con zod extendiendo `UseCase`. Los errores de formato salen con un único `INVALID_INPUT` y el mensaje de zod; los códigos propios quedan solo para reglas de negocio.
- En `updateConnection`, una contraseña `""` mantiene la anterior, igual que `null` o ausente.
- Las queries que solo leen no llevan use-case: el resolver abre el `UnitOfWork` y llama directo al repositorio.
- Los valores de un enum de GraphQL que en la DB se guardan distinto se traducen con un enum resolver y `enumValues` en `codegen.ts`, no a mano en el resolver.
- Un repositorio no envuelve los métodos del base: se usan directo. Solo agrega lo que el base no resuelve (orden, `lower()`, `runWithoutRLS`).
- El código que se prueba corre siempre como `app_user`; el superusuario solo prepara y lee datos.
- El cifrado es una clase `EncryptionService`, sin interface ni adapters.
- Los errores de un service viven en su carpeta (`services/<servicio>/<servicio>-errors.ts`); `errors/` queda para los que no son de un módulo ni de un service.
- La api guarda y recibe cada campo por separado. La URL solo completa el formulario del web.
- Solo se cifra la contraseña, con AES-256-GCM (`node:crypto`), una llave en `CONNECTIONS_ENCRYPTION_KEY`, prefijo de versión `v1` y el id de la conexión como dato asociado. Se descartan `pgcrypto` y KMS por ahora.
- La contraseña nunca sale de la api. Al editar sin contraseña se mantiene la anterior.
- Los errores de la api siguen el patrón de vendyx: la api nunca devuelve el detalle de un error inesperado, y el plugin `useErrorLogger` lo loguea completo.
- En web solo van el estado vacío y el formulario de creación, que son de producción, y un listado temporal con eliminar para probar en local. La vista con conexiones llega con el shell.
- El formulario de nueva conexión es un modal sobre `/`, sin ruta propia. La URL queda como campo para autocompletar, sin tabs.

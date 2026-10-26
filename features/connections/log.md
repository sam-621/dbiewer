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

**Decisiones:**
- Las queries que solo leen no llevan use-case: el resolver abre el `UnitOfWork` y llama directo al repositorio.
- Los valores de un enum de GraphQL que en la DB se guardan distinto se traducen con un enum resolver y `enumValues` en `codegen.ts`, no a mano en el resolver.
- Un repositorio no envuelve los métodos del base: se usan directo. Solo agrega lo que el base no resuelve (orden, `lower()`, `runWithoutRLS`).
- El código que se prueba corre siempre como `app_user`; el superusuario solo prepara y lee datos.
- El cifrado es una clase `EncryptionService`, sin interface ni adapters.
- Los errores de un service viven en su carpeta (`services/<servicio>/<servicio>-errors.ts`); `errors/` queda para los que no son de un módulo ni de un service.
- La api guarda y recibe cada campo por separado. La URL solo completa el formulario del web.
- Solo se cifra la contraseña, con AES-256-GCM (`node:crypto`), una llave en `CONNECTIONS_ENCRYPTION_KEY`, prefijo de versión `v1` y el id de la conexión como dato asociado. Se descartan `pgcrypto` y KMS por ahora.
- La contraseña nunca sale de la api. Al editar sin contraseña se mantiene la anterior.
- En web solo van el estado vacío y el formulario de creación, que son de producción, y un listado temporal con eliminar para probar en local. La vista con conexiones llega con el shell.

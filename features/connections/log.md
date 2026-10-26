# Conexiones — log

## 2026-10-26 — samuel.corrales621

**Hecho:**
- (api, web) Se crea la feature `connections`: spec de producto, técnico y de UI, y plan de trabajo.
- (api) Service de cifrado `EncryptionService` (AES-256-GCM, formato `v1`), `CONNECTIONS_ENCRYPTION_KEY` en la config, `services.encryptionService` en el app context y sus unit tests (paso 1).
- (api) `email-errors.ts` pasa a `src/services/emails/`. Docs de la api y `technical.md` actualizados con el cifrado, el service sin proveedor externo y los errores dentro de su service.

**Decisiones:**
- El cifrado es una clase `EncryptionService`, sin interface ni adapters.
- Los errores de un service viven en su carpeta (`services/<servicio>/<servicio>-errors.ts`); `errors/` queda para los que no son de un módulo ni de un service.
- La api guarda y recibe cada campo por separado. La URL solo completa el formulario del web.
- Solo se cifra la contraseña, con AES-256-GCM (`node:crypto`), una llave en `CONNECTIONS_ENCRYPTION_KEY`, prefijo de versión `v1` y el id de la conexión como dato asociado. Se descartan `pgcrypto` y KMS por ahora.
- La contraseña nunca sale de la api. Al editar sin contraseña se mantiene la anterior.
- En web solo van el estado vacío y el formulario de creación, que son de producción, y un listado temporal con eliminar para probar en local. La vista con conexiones llega con el shell.

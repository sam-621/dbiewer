# Conexiones — log

## 2026-10-26 — samuel.corrales621

**Hecho:**
- (api, web) Se crea la feature `connections`: spec de producto, técnico y de UI, y plan de trabajo.

**Decisiones:**
- La api guarda y recibe cada campo por separado. La URL solo completa el formulario del web.
- Solo se cifra la contraseña, con AES-256-GCM (`node:crypto`), una llave en `CONNECTIONS_ENCRYPTION_KEY`, prefijo de versión `v1` y el id de la conexión como dato asociado. Se descartan `pgcrypto` y KMS por ahora.
- La contraseña nunca sale de la api. Al editar sin contraseña se mantiene la anterior.
- En web solo van el estado vacío y el formulario de creación, que son de producción, y un listado temporal con eliminar para probar en local. La vista con conexiones llega con el shell.

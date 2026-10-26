---
status: active
apps: [api, web]
created: 2026-10-26
---

# Conexiones

## Contexto

Al terminar el onboarding, el usuario entra a su workspace sin ninguna conexión y no tiene nada que hacer. Para explorar el esquema y ejecutar queries primero tiene que cargar una conexión a su base de datos. Esta feature agrega el estado vacío del workspace, el formulario para crear una conexión Postgres y el CRUD de conexiones en la api, con la contraseña guardada cifrada.

Es la primera parte del milestone 2 de `docs/roadmap.md`. La vista del workspace con conexiones cargadas llega con el shell de la app, en otra feature.

## Historia de usuario

Como usuario recién llegado a dbiewer, quiero cargar los datos de mi base Postgres desde el estado vacío del workspace, para dejarla guardada y empezar a trabajar con ella.

## Flujo

1. El usuario termina el onboarding y entra a `/`. Como no tiene conexiones, ve el estado vacío con la acción para crear una.
2. Abre el modal de nueva conexión. Puede pegar una URL `postgres://…` para que se completen los campos, o llenarlos a mano.
3. Guarda. La api cifra la contraseña y guarda la conexión en su workspace.
4. Se cierra el modal. Como ya tiene conexiones, ve un listado temporal con cada conexión y la opción de eliminarla. Si elimina todas, vuelve al estado vacío.

## Reglas de negocio

### Conexión

- Una conexión pertenece a un workspace. Solo la ve y la modifica su dueño.
- Por ahora el único motor es Postgres.
- Campos:
  - **Nombre**: obligatorio, sin espacios a los lados, de 50 caracteres como máximo y único en el workspace sin distinguir mayúsculas.
  - **Host**: obligatorio, sin espacios a los lados.
  - **Puerto**: entero entre 1 y 65535. Por defecto 5432.
  - **Base de datos**: obligatoria, sin espacios a los lados.
  - **Usuario**: obligatorio, sin espacios a los lados.
  - **Contraseña**: opcional. Se guarda tal cual, sin recortar.
  - **SSL**: `disable`, `require` o `verify-full`. Por defecto `require`.
- La URL pegada en el formulario solo sirve para completar los campos: no se guarda ni se manda a la api.

### Credenciales

- La contraseña se guarda cifrada. El resto de los campos se guarda en texto plano.
- La contraseña nunca sale de la api: ninguna respuesta la incluye, ni cifrada.
- Al editar, si no se manda una contraseña, se mantiene la que estaba.

### Eliminar

- Eliminar una conexión la borra definitivamente.

## Decisiones

- **Campos sueltos en vez de URL**: la api guarda y recibe cada campo por separado. La URL es solo una comodidad del formulario. Se descarta guardar la URL porque mete la contraseña en un string que no se puede cifrar por partes.
- **Solo se cifra la contraseña**: host, puerto, base, usuario y SSL quedan en texto plano para poder listarlos y editarlos sin descifrar.
- **AES-256-GCM con `node:crypto` y una llave de la api**: detecta si alguien alteró el valor cifrado y no agrega dependencias. La llave vive en una variable de entorno y nunca en la base de datos.
- **Valor cifrado con versión y atado a la conexión**: el valor lleva un prefijo de versión para poder rotar la llave o pasar a KMS sin romper lo guardado, y usa el id de la conexión como dato asociado, así una contraseña copiada a otra fila no se puede descifrar.
- **Se descarta `pgcrypto`**: la llave viajaría en cada query y podría quedar en los logs de Postgres.
- **Se descarta KMS o Vault por ahora**: es demasiado para esta etapa. El prefijo de versión deja la puerta abierta.
- **Listado temporal**: en web el listado con eliminar solo sirve para probar en local. Lo reemplaza el shell de la app en la siguiente feature.

## Fuera de alcance

- Probar la conexión antes de guardarla y conectarse a la base del usuario.
- Elegir los esquemas de la conexión.
- Editar una conexión desde el web. La api sí la permite.
- El shell de la app y la vista del workspace con conexiones cargadas.
- Pedir una sesión reciente para crear o editar credenciales.
- Bloquear localhost y redes internas (SSRF). Aplica cuando la api se conecte a la base del usuario.
- Límite de conexiones por plan (milestone 10).
- Otros motores (milestone 13) y SSH tunnel (milestone 14).

## Plan de trabajo recomendado

1. [x] api: service de cifrado con AES-256-GCM, variable `CONNECTIONS_ENCRYPTION_KEY` y sus tests.
2. [x] api: tabla `connection` con RLS, su migración y su repositorio.
3. [x] api: queries `connections` y `connection`, mutations `createConnection`, `updateConnection` y `removeConnection`, con sus tests e2e.
4. [x] web: estado vacío en `/` y modal de nueva conexión, con el parseo de la URL.
5. [x] web: listado temporal en `/` con eliminar.

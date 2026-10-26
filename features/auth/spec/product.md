---
status: active
apps: [api, web]
created: 2026-10-24
---

# Acceso y workspace

## Contexto

dbiewer todavía no tiene usuarios: cualquiera que abre `apps/web` ve lo mismo y la api no sabe quién llama. Todo lo que sigue en el roadmap (conexiones, queries guardadas, historial, chats de IA, planes) pertenece a alguien y tiene que quedar aislado del resto. Esta feature agrega el acceso con magic link, la sesión y un workspace por usuario, que es el tenant del que cuelga todo lo demás.

Es la primera de las tres features del milestone 1 de `docs/roadmap.md`. Después vienen `social-login` (GitHub y Google) y `account-settings` (configuración de cuenta y workspace).

## Historia de usuario

Como desarrollador que llega desde la landing, quiero entrar con mi email sin crear una contraseña, para empezar a usar dbiewer en segundos y encontrar mi espacio de trabajo cada vez que vuelvo.

## Flujo

1. El usuario llega a `apps/web` sin sesión y ve la pantalla de acceso.
2. Escribe su correo y recibe un magic link. Al abrirlo, queda con la sesión iniciada.
3. Si es la primera vez, se crea su cuenta. No hay un registro separado del login.
4. Entra a la app y ve su workspace. Por ahora es un estado vacío que invita a conectar una base (milestone 2).
5. Desde el menú de usuario puede cerrar sesión.
6. Al volver otro día, la sesión sigue activa mientras no venza ni la cierre.

## Reglas de negocio

### Acceso

- No hay contraseñas. En esta feature el único método es el magic link por email.
- Registro y login son el mismo flujo: si el email no existe, se crea la cuenta.
- Un email es una sola cuenta.
- El magic link vence a los 15 minutos y sirve una sola vez.
- La respuesta al pedir un magic link es la misma exista o no la cuenta, para no revelar qué emails están registrados.
- Toda cuenta tiene el email verificado desde que existe, porque el magic link prueba que el correo es del usuario. No hay un paso de verificación aparte.

### Sesión

- La sesión vence a los 30 días sin uso. Mientras el usuario la use, se extiende sola (como máximo una renovación por día).
- Cerrar sesión la invalida en el servidor, no solo en el navegador.
- Sin sesión, la única pantalla accesible de la app es la de acceso. Con sesión, la pantalla de acceso redirige al workspace.

### Workspace

- Cada usuario tiene exactamente un workspace. No se crea junto con la cuenta: se crea aparte.
- El nombre del workspace lo elige el usuario al crearlo.
- El workspace es el tenant: todo dato que se agregue después (conexiones, queries, historial) le pertenece y solo lo ve su dueño.

## Decisiones

- **Sin contraseñas**: el acceso es con magic link y, en `social-login`, con GitHub y Google. Se descarta email + contraseña. Por eso no hay recuperación de contraseña ni un paso de verificación de email.
- **Better Auth**: resuelve sesiones, magic link, OAuth y vinculación de cuentas con adaptador de Drizzle. Se descarta escribir la autenticación a mano.
- **Sesión larga en la base de datos, sin refresh tokens**: la sesión vive en Postgres y viaja en una cookie `httpOnly`, así que se revoca al instante al cerrar sesión o borrar la cuenta. Los refresh tokens resuelven el problema de los JWT sin estado, que aquí no existe. La sesión dura 30 días sin uso para no obligar a iniciar sesión seguido. Las acciones delicadas (borrar la cuenta, tocar credenciales de conexiones, cambiar el plan) piden una sesión reciente.
- **Un workspace por usuario, sin miembros**: alcanza para el producto solo. Los workspaces compartidos llegan con el milestone de Team (16).
- **Workspace = tenant**: el `tenant_id` del RLS es el id del workspace. Cuando llegue Team, se agrega membresía sin cambiar el aislamiento de los datos.
- **El milestone 1 se parte en tres features** (`auth`, `social-login`, `account-settings`) para que cada una sea chica y deje algo usable. Esta es la base de las otras dos.

## Fuera de alcance

- GitHub y Google (feature `social-login`).
- Cambiar el nombre, borrar la cuenta y renombrar el workspace (feature `account-settings`).
- Contraseñas, recuperación de contraseña y 2FA.
- Ver y cerrar sesiones activas en otros dispositivos.
- Varios workspaces por usuario, invitaciones y roles.
- Planes, límites y billing (milestone 10).
- Aceptación de términos y privacidad (milestone 12).

## Plan de trabajo recomendado

1. [x] api: Better Auth montado en Express con Drizzle, tablas de auth y `workspace` con su migración y RLS.
2. [x] api: magic link con envío de email y límite de pedidos.
3. [x] api: creación del workspace al crear la cuenta y contexto del request con usuario, workspace y `app.current_tenant_id`.
4. [ ] api: query `me` y sus tests e2e, incluido el aislamiento por RLS.
5. [ ] web: cliente de Better Auth, proxy de Vite, guards `protect` y `public`, y pantalla de acceso con magic link.
6. [ ] web: layout de la app con menú de usuario, logout y estado vacío del workspace.
7. [ ] web: e2e del acceso con magic link, las guards y el logout.

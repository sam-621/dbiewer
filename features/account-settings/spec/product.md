---
status: active
apps: [api, web]
created: 2026-10-24
---

# Configuración de cuenta y workspace

## Contexto

Con `auth`, el usuario tiene cuenta y workspace, pero no puede cambiar nada: el nombre lo pone el proveedor o queda vacío, el workspace se llama `<nombre>'s workspace` y no hay forma de irse. Esta feature agrega la configuración mínima de los dos.

Es la tercera feature del milestone 1 de `docs/roadmap.md`. Depende de `auth`.

## Historia de usuario

Como usuario de dbiewer, quiero cambiar mi nombre y el de mi workspace, y poder borrar mi cuenta, para tener control sobre mis datos.

## Flujo

1. Desde el menú de usuario abre "Account settings" o "Workspace settings".
2. En la cuenta, cambia su nombre y lo guarda, o borra la cuenta confirmando con su email.
3. En el workspace, cambia el nombre y lo guarda.
4. Si borra la cuenta, se cierra la sesión y vuelve a la pantalla de acceso.

## Reglas de negocio

### Cuenta

- El usuario puede cambiar su nombre, que tiene entre 1 y 80 caracteres.
- El email no se puede cambiar en esta versión.
- El avatar sale del proveedor OAuth, si hay. Si no, se muestran las iniciales.
- Se muestran los métodos de acceso vinculados (email, GitHub, Google), sin poder desvincularlos.
- Borrar la cuenta borra también el workspace y todo lo que cuelga de él, y cierra todas las sesiones. No se puede deshacer.
- Para borrar la cuenta, el usuario escribe su email como confirmación y tiene que haber iniciado sesión en las últimas 24 horas. Si no, tiene que volver a entrar.

### Workspace

- El nombre del workspace es obligatorio y tiene entre 1 y 60 caracteres.
- Solo el dueño puede renombrarlo. Hoy el dueño es el único usuario del workspace.

## Decisiones

- **Confirmar con el email y sesión fresca para borrar**: no hay contraseña que pedir, así que se exige escribir el email y haber entrado hace poco. Se descarta mandar un email de confirmación, porque agrega un paso y un estado intermedio.
- **El nombre del usuario se cambia con Better Auth y el del workspace con GraphQL**: el usuario es de Better Auth y el workspace es nuestro.

## Fuera de alcance

- Cambiar el email.
- Desvincular métodos de acceso.
- Ver y cerrar sesiones en otros dispositivos.
- Subir un avatar propio.
- Exportar los datos antes de borrar la cuenta.

## Plan de trabajo recomendado

1. [ ] api: mutations `renameWorkspace` y `deleteAccount` con sus tests e2e.
2. [ ] web: links de configuración en el menú de usuario y pantalla de configuración de la cuenta (nombre, métodos vinculados, borrar cuenta).
3. [ ] web: pantalla de configuración del workspace.
4. [ ] web: e2e de cambiar el nombre, renombrar el workspace y borrar la cuenta.

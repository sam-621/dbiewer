---
status: done
apps: [api, web]
created: 2026-11-07
---

# Login con GitHub

## Contexto

El acceso (`auth`) funcionaba solo con magic link, que depende de un servicio de correos (Resend) para salir a producción. Para no depender de él, y porque el público de dbiewer son devs, el acceso pasa a ser solo con GitHub: no hay correos que enviar, el email llega verificado y no hay contraseñas que guardar ni recuperar.

## Historia de usuario

Como dev, quiero entrar a dbiewer con mi cuenta de GitHub, para no tener que crear una contraseña ni esperar un correo.

## Flujo

1. El usuario abre la app sin sesión y llega a `/login`.
2. Hace clic en "Continuar con GitHub" y la app lo redirige a GitHub.
3. Autoriza la app en GitHub y vuelve a dbiewer con la sesión iniciada.
4. Si no tiene workspace, sigue al onboarding como antes; si ya tiene, entra a la app.

## Reglas de negocio

- El único método de acceso es GitHub. No hay magic link ni usuario y contraseña.
- Si GitHub devuelve un error (por ejemplo, el usuario cancela la autorización), vuelve a `/login` con un aviso.
- Si ya existe un usuario con el mismo email (creado con magic link), GitHub entra a esa misma cuenta.

## Decisiones

- **Solo GitHub**: evita el servicio de correos y encaja con el público de devs. Se descartó usuario y contraseña porque sin correo no hay recuperación de contraseña ni verificación del email.
- **Se quita el magic link**: no se usará más; se borran el plugin, su email y su UI.
- **El servicio de correos se queda en la api**: aunque ya nada lo usa, sigue disponible para correos futuros.
- **Una sola OAuth App de GitHub**: GitHub permite hasta 10 callback URLs por app, así que producción se agrega a la misma app.
- **El botón queda cargando hasta que redirige**: entre el clic y la redirección a GitHub hay un momento en que no pasa nada visible.

## Fuera de alcance

- Otros proveedores (Google).
- Suscripciones y planes. Quedó decidido para una feature aparte: Free con una conexión y un archivo SQL, y Pro a $9 al mes con todo abierto.
- Configurar la OAuth App de producción con el dominio real.

## Plan de trabajo recomendado

1. [x] api: proveedor GitHub en Better Auth con `GITHUB_CLIENT_ID` y `GITHUB_CLIENT_SECRET`.
2. [x] web: botón "Continuar con GitHub" en `/login`, con su aviso de error.
3. [x] api: quitar el plugin de magic link y su email; sesión directa en los tests e2e.
4. [x] web: quitar el formulario de magic link, la pantalla de link enviado y sus textos.
5. [x] web: el botón queda cargando hasta que la página redirige a GitHub.

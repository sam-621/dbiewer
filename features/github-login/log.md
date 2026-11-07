# Login con GitHub — log

## 2026-11-07 — samuel.corrales621

**Hecho:**
- (api) Proveedor GitHub en Better Auth con `GITHUB_CLIENT_ID` y `GITHUB_CLIENT_SECRET` obligatorias.
- (web) Botón "Continuar con GitHub" en `/login`, con aviso propio cuando GitHub devuelve un error.
- Se crea la OAuth App de GitHub en local, con logo y descripción en inglés.
- (api) Se quita el magic link: plugin, template y textos del email, regla de rate limit y util de idioma. `TestServer.signIn` crea la sesión directo con Better Auth.
- (web) Se quitan el formulario de magic link, la pantalla de link enviado, su hook, el error 429, el plugin del cliente y sus traducciones.
- (api) Se cambian en `docs/` los ejemplos que usaban el magic link por ejemplos reales del código.
- (web) El botón de GitHub queda cargando hasta que la página redirige.
- Se crea la feature `github-login` con lo ya construido. Feature terminada.

**Decisiones:**
- Solo GitHub como método de acceso, para no depender de un servicio de correos; usuario y contraseña se descartó por no tener recuperación ni verificación sin correo.
- El servicio de correos se mantiene en la api, sin usos.
- Una sola OAuth App de GitHub; la callback de producción se agrega a la misma app.
- Suscripciones, para una feature aparte: Free con una conexión y un archivo SQL, Pro a $9 al mes con todo abierto. Para mi propia cuenta, un cupón de 100% en Stripe.
- Se considera salir a producción antes de las suscripciones; lo obligatorio antes es bloquear hosts privados al crear conexiones.

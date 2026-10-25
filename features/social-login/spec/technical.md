# Acceso con GitHub y Google — especificación técnica

Reglas de negocio y decisiones en `product.md`. La base (Better Auth, tablas, sesión, workspace) está en `features/auth/spec/technical.md`.

## Better Auth (api)

En `src/shared/auth/auth.ts`:

- `socialProviders.github` con `clientId`, `clientSecret` y el scope `user:email`, para leer el email principal aunque no sea público.
- `socialProviders.google` con `clientId` y `clientSecret`.
- `account.accountLinking: { enabled: true, trustedProviders: ['github', 'google', 'email-link'] }`.
- Un email sin verificar se rechaza en `databaseHooks.user.create.before` y antes de vincular una cuenta, con el error `UNVERIFIED_EMAIL`. Better Auth redirige a `${WEB_URL}/login?error=UNVERIFIED_EMAIL`.
- Si la cuenta es nueva, `name` e `image` salen del perfil del proveedor. El workspace se crea con el mismo hook de `auth`.
- Callbacks: `${BETTER_AUTH_URL}/api/auth/callback/github` y `/callback/google`. Hay que registrarlos en las apps OAuth de cada proveedor, para desarrollo y producción.

## Modelo

No hay tablas nuevas: cada proveedor vinculado es una fila en `account` (`provider_id = 'github' | 'google'`).

## Errores

| `code` | Cuándo |
|--------|--------|
| `UNVERIFIED_EMAIL` | El proveedor devolvió el email sin verificar. |
| `OAUTH_CANCELLED` | El usuario canceló en el proveedor. El web no muestra error, solo vuelve a la pantalla de acceso. |

Llegan al web como query param `error` en `/login`, no como errores de GraphQL. Se traducen en `src/lib/api/errors/account.errors.ts`.

## Config (api)

| Variable | Uso |
|----------|-----|
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | OAuth de GitHub. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | OAuth de Google. |

Las apps OAuth de GitHub y Google las crea el usuario. La feature necesita sus credenciales en el `.env` para probar el flujo de punta a punta.

## Web

- `authClient.signIn.social({ provider: 'github' | 'google', callbackURL: '/' })` desde un hook `use-sign-in-social` en `src/lib/account/hooks/`.
- La pantalla de acceso lee `?error=` y muestra el mensaje según el `code`.

## Impacto en código existente

- `apps/api/src/shared/auth/auth.ts`: proveedores y vinculación.
- `apps/api/src/shared/config.ts`: variables de OAuth.
- Pantalla de acceso de `src/lib/account/pages/`: botones y errores.
- Locales `en.json` y `es.json`.

## Tests

- **api:** sin e2e contra los proveedores reales. Unit del rechazo de emails sin verificar en el hook.
- **web, e2e:** que cada botón navega a la URL de autorización del proveedor (se intercepta la request) y que `/login?error=UNVERIFIED_EMAIL` muestra el mensaje.

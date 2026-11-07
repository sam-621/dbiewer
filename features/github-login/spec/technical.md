# Login con GitHub — especificación técnica

Reglas de negocio y decisiones en `product.md`.

## api

- `socialProviders.github` en `createAuth` (`src/services/auth/auth.ts`), con `config.auth.github` (`clientId`, `clientSecret`).
- Variables de entorno nuevas y obligatorias: `GITHUB_CLIENT_ID` y `GITHUB_CLIENT_SECRET`. Están en `.env.example` y con valores falsos en el bloque `env` de `vitest.int.config.ts` y `vitest.e2e.config.ts`.
- Callback de GitHub: `<BETTER_AUTH_URL>/api/auth/callback/github` (en local, `http://localhost:4100/api/auth/callback/github`).
- `rateLimit` queda con los límites por defecto de Better Auth, sin reglas propias.
- Se borran `src/services/auth/plugins/magic-link/`, `src/services/emails/templates/magic-link-template.tsx`, `src/services/emails/locales/` y `src/shared/utils/locale.ts`.
- El servicio de correos (`src/services/emails/senders/`, `EMAIL_SENDER`, `EMAIL_FROM`, `RESEND_API_KEY`) se mantiene, sin usos.
- La tabla `verification` se mantiene: Better Auth la usa para el `state` del flujo OAuth.

## Tests de la api

- `TestServer.signIn(email)` (`tests/utils/test-server.ts`) ya no pasa por el magic link: busca o crea el usuario con `internalAdapter` de Better Auth, crea la sesión y firma la cookie con `makeSignature` de `better-auth/crypto`.

## web

- `authClient` (`src/lib/api/auth-client.ts`) sin plugins.
- Hook `useSignInGithub` (`src/lib/account/hooks/use-sign-in-github.ts`): `authClient.signIn.social({ provider: 'github', callbackURL, errorCallbackURL })`, con `callbackURL` en `/` y `errorCallbackURL` en `/login`, las dos absolutas.
- `useLoginForm` lee `?error=` al entrar a `/login`, muestra el aviso de GitHub y quita el parámetro de la URL. Tras una llamada exitosa queda en estado de carga hasta que el navegador redirige.
- Ícono de GitHub en `src/shared/components/icons/github-icon.tsx`, como los logos de marca.
- Se borran `use-sign-in-magic-link.ts`, `src/lib/api/errors/account.errors.ts`, `components/login/link-sent/` y las traducciones que solo usaba el magic link.

## OAuth App de GitHub

- App "dbiewer" en la cuenta del dueño del proyecto, con homepage `http://localhost:3100`, callback local, logo y descripción.
- El Client Secret vive solo en `apps/api/.env`.

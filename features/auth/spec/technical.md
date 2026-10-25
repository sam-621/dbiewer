# Acceso y workspace — especificación técnica

Reglas de negocio y decisiones en `product.md`.

## Better Auth (api)

- Paquete `better-auth` con `drizzleAdapter(db, { provider: 'pg' })` y el plugin `magicLink`.
- Instancia creada con `createAuth(appContext)` en `src/services/auth/auth.ts` (reexportado por `index.ts`). Usa `appContext.databases.admin` para el adaptador de Drizzle y, en `sendMagicLink`, instancia `MagicLinkUseCase` con `appContext.repositories.verification`, `appContext.repositories.magicLinkRequest` y `appContext.services.emailSender`. Las conexiones se arman en `src/index.ts` (y en `TestServer`), entran al app context y se cierran en el shutdown y en el teardown de los tests.
- Se monta en Express **antes** de Yoga, en `app.all('/api/auth/*splat', toNodeHandler(auth))` (Express 5 no acepta un `*` sin nombre), y sin `express.json()` delante de esa ruta.
- Configuración:
  - `magicLink({ expiresIn: 900, sendMagicLink })`. `sendMagicLink` usa el servicio de email.
  - `session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 }`.
  - `rateLimit` con una regla para `/sign-in/magic-link`: 3 pedidos cada 10 minutos por IP. Desactivado en `test`.
  - Límite por email en `MagicLinkUseCase.send`, contando la tabla propia `magic_link_request` (no `verification`, porque Better Auth borra la fila cuando el link se usa):
    - Primero registra el intento, siempre (también los rechazados y los que después fallan al enviarse).
    - Después cuenta los intentos del email en los últimos 10 minutos, sin distinguir mayúsculas, incluido el actual.
    - Si son más de 3, borra la fila de `verification` del token y lanza `MagicLinkLimitExceededError`. Si no, envía el email.
    - Registrar antes de contar evita que pedidos simultáneos pasen el límite: cada uno ve también a los demás.
  - Better Auth no pasa los errores por el mapper de GraphQL: en `sendMagicLink`, `MagicLinkLimitExceededError` se convierte en `APIError('TOO_MANY_REQUESTS', { code: 'MAGIC_LINK_LIMIT_EXCEEDED' })`, que responde 429.
  - `advanced.database.generateId: () => crypto.randomUUID()`, para cumplir con `id uuid` de `docs/database.md`.
  - `trustedOrigins: [config.webUrl]`.
  - Cookies `httpOnly` (default de Better Auth), `sameSite: 'lax'` y `useSecureCookies` fuera de desarrollo.

## Email

- Proveedor: Resend (`resend`). Service externo en `src/services/emails/`: interface `EmailSender` con los adapters `resend`, `console` y `dummy` (`getEmailSender(config.emailSender)`), template `templates/magic-link-template.tsx` (react-email) y textos en `locales/`. `MagicLinkUseCase` (`src/use-cases/magic-link-use-case.ts`) arma el email y lo envía.
- En `development` y `test` no se envía nada: el link se escribe en el log, y los tests e2e lo leen de la tabla `verification`.
- El texto del email va en inglés o en español, según el `Accept-Language` del request que pidió el link.

## Modelo

Tablas de Better Auth, generadas con `npx @better-auth/cli generate` al schema de Drizzle y ajustadas a `docs/database.md` (snake_case, singular, `id uuid`, `created_at`, `updated_at`):

| Tabla | Columnas relevantes | Tenant |
|-------|---------------------|--------|
| `user` | `id`, `name`, `email` (único), `email_verified`, `image` | no |
| `session` | `id`, `user_id`, `token` (único), `expires_at`, `ip_address`, `user_agent` | no |
| `account` | `id`, `user_id`, `provider_id`, `account_id`, tokens del proveedor | no |
| `verification` | `id`, `identifier`, `value`, `expires_at` | no |

`account` se crea ahora aunque recién se use en `social-login`, porque Better Auth la necesita desde el principio.

Tabla propia:

| Tabla | Columnas | Notas |
|-------|----------|-------|
| `workspace` | `id uuid`, `owner_user_id uuid` (FK a `user`, único, `ON DELETE CASCADE`), `name text`, `created_at`, `updated_at` | Su `id` es el `tenant_id` del resto de las tablas. |
| `magic_link_request` | `id uuid`, `email text`, `created_at`, `updated_at`; índice `(lower(email), created_at)` | Un registro por intento de pedir un magic link, para el límite por email. Sin tenant, solo la conexión de admin. |

- `workspace` no lleva `tenant_id` porque es el tenant. Tiene RLS (`ENABLE` y `FORCE`) con la policy `workspace_tenant_isolation`, que solo deja ver la fila cuyo `id` es `nullif(current_setting('app.current_tenant_id', true), '')::uuid`. Sin tenant en la conexión devuelve cero filas.
- Las tablas de auth no tienen RLS: solo las toca Better Auth, con la conexión de admin. La migración les hace `REVOKE ALL ... FROM app_user`, así la conexión de los requests no puede leer sesiones ni tokens.
- Fechas `timestamp with time zone`.
- Las tablas futuras con `tenant_id` llevan FK a `workspace(id)` con `ON DELETE CASCADE`.
- Migraciones: `0001_create_auth_and_workspace` (generada), `0002_auth_rls_and_privileges` (custom, con el `FORCE` de `workspace` y el `REVOKE` de las tablas de auth), `0003_create_magic_link_request` (generada) y `0004_magic_link_request_privileges` (custom, `REVOKE ALL` a `app_user`). Aplicarlas le toca al usuario.

## Creación del workspace

- `databaseHooks.user.create.after` llama a `WorkspaceUseCase.createForUser(user)`, que crea el workspace con el nombre inicial de `product.md`.
- `WorkspaceUseCase.createForUser` usa la conexión de admin, porque todavía no hay tenant en el contexto.
- Si el hook falla, el workspace se crea al resolver el contexto del siguiente request (`getOrCreateForUser`). Así una cuenta nunca queda sin workspace.

## Contexto del request

- El `context` de Yoga (o un middleware en `src/shared/middlewares/auth.middleware.ts`) llama a `auth.api.getSession({ headers })`.
- Con sesión: busca el workspace del usuario, abre la conexión del request con `set_config('app.current_tenant_id', workspace.id, true)` dentro de una transacción y arma el contexto.
- Hoy Yoga corre sin `context`. El contexto del request se crea en este paso con `session: { user, workspace } | null` y lo que haga falta para instanciar los use-cases de los resolvers (ver `architecture.md` > App context).
- Las operaciones que requieren sesión lanzan `UNAUTHENTICATED` si `session` es `null`. De eso se encarga un helper `requireSession(context)` en `src/services/auth/`, no cada resolver por su cuenta.

## API GraphQL

`src/api/schema/account.gql`:

```graphql
type User {
  id: ID!
  name: String!
  email: String!
  image: String
}

type Workspace {
  id: ID!
  name: String!
}

type Me {
  user: User!
  workspace: Workspace!
}

type Query {
  me: Me
}
```

- `me` devuelve `null` si no hay sesión, en lugar de lanzar un error. El web lo usa para saber si hay sesión.
- Login y logout no pasan por GraphQL: son endpoints de Better Auth en `/api/auth/*splat`.

### Capas

| Capa | Archivo |
|------|---------|
| Schema | `src/api/schema/account.gql` |
| Resolvers | `src/api/resolvers/account-resolver.ts` |
| Use-cases | `src/use-cases/account-use-case.ts`, `src/use-cases/workspace-use-case.ts`, `src/use-cases/magic-link-use-case.ts` |
| Services externos | `src/services/auth/` (Better Auth), `src/services/emails/` |
| Repositorios | `src/persistence/repositories/workspace/`, `src/persistence/repositories/verification/`, `src/persistence/repositories/magic-link-request/` |
| Errores | `src/errors/account-errors.ts`, `src/errors/magic-link-errors.ts`, `src/errors/email-errors.ts` |

### Errores

| `code` | Cuándo |
|--------|--------|
| `UNAUTHENTICATED` | Una operación que requiere sesión se llama sin sesión. |
| `MAGIC_LINK_LIMIT_EXCEEDED` | Más de 3 magic links para el mismo email en 10 minutos. Lo responde `/api/auth/sign-in/magic-link` con 429, no GraphQL. El web lo traduce. |

`UNAUTHENTICATED` se registra en el mapper de `src/shared/errors/error-handler.ts`. `MAGIC_LINK_LIMIT_EXCEEDED` no pasa por GraphQL: se arma como `APIError` en `src/services/auth/auth.ts`.

## Config (api)

Variables nuevas, validadas y mapeadas en `src/config/config.ts`:

| Variable | En `config` | Uso |
|----------|-------------|-----|
| `ADMIN_DATABASE_URL` | `database.adminUrl` | Conexión que se salta RLS, para Better Auth y la creación del workspace. |
| `BETTER_AUTH_SECRET` | `auth.secret` | Firma de cookies y tokens. |
| `BETTER_AUTH_URL` | `auth.url` | URL pública de la api. |
| `WEB_URL` | `webUrl` | Origen del web, para `trustedOrigins` y los redirects. |
| `EMAIL_SENDER` | `emailSender.adapter` | `resend`, `console` o `dummy`. Obligatoria, sin default. |
| `EMAIL_FROM` | `emailSender.from` | Remitente de los emails. Obligatoria. |
| `RESEND_API_KEY` | `emailSender.resend.apiKey` | Obligatoria si `EMAIL_SENDER=resend`. |

## Web

- Paquete `better-auth` y cliente en `src/lib/api/auth-client.ts`, con `createAuthClient({ plugins: [magicLinkClient()] })`.
- **Cookies en desarrollo:** el proxy de Vite manda `/api/auth` y `/graphql` a la api, así web y api comparten origen y la cookie es first-party. En producción, web y api van en el mismo dominio (`app.` y `api.` del mismo sitio).
- `fetcher.ts` envía `credentials: 'include'`.
- **Sesión:** `useGetMe` (query `me`) es la fuente de verdad de quién está logueado. Después del login o el logout se invalida `AccountCacheKeys.Me`.
- **Guards:** `src/shared/guards/protect.tsx` redirige a `/login` si `me` es `null`, y `public.tsx` redirige a `/` si hay sesión. Las dos muestran un estado de carga mientras se resuelve `me`.
- **Módulo:** `src/lib/account/` con `pages/`, `components/`, `hooks/` (`use-get-me`, `use-sign-in-magic-link`, `use-sign-out`) y `constants/cache-keys.ts`.
- **Errores:** `src/lib/api/errors/account.errors.ts` traduce los `code` de la tabla de errores.
- **Login:** `authClient.signIn.magicLink({ email, callbackURL })`. Los errores del redirect (link vencido o ya usado) llegan a `/login` como query param `error`.
- `/` pasa a ser el workspace, dentro de `protect`. La página de health check de `lib/system` deja de ocupar esa ruta.

## Impacto en código existente

- `apps/api/src/app.ts`: monta Better Auth antes de Yoga, y el contexto resuelve la sesión.
- `apps/api/src/context/`: el contexto del request, con `session`.
- `apps/api/docs/architecture.md`: el apartado Multi-tenant pasa a decir que el tenant es el workspace y cómo llega al contexto. El cambio se propone al terminar el paso 3.
- `apps/web/src/app/app.tsx`: rutas `/login` y `/`, con sus guards.
- `apps/web/vite.config.ts`: proxy a la api.
- `apps/web/src/lib/api/fetcher.ts`: `credentials: 'include'`.
- Locales `en.json` y `es.json`: textos de acceso, menú y estado vacío.

## Tests

- **api, e2e** (`tests/account/me/`): `me` con sesión y sin sesión, creación del workspace en el primer acceso, y que el RLS no deja leer el workspace de otro usuario. La sesión se crea con el magic link leído de `verification`.
- **api, unit:** el nombre inicial del workspace; `MagicLinkUseCase` (límite, registro del intento antes de contar y enviar, también el rechazado, contenido del email) y la resolución del idioma.
- **api, integración** (`*.integration.test.ts`): los repositorios `verification` y `magic-link-request` contra la DB, y los senders de email (`resend` con el SDK mockeado, `console`) y su factory. Better Auth, templates y logger no se testean.
- **web, e2e** (`e2e/account/`): acceso con magic link, redirects de las guards y logout.

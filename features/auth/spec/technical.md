# Acceso y workspace — especificación técnica

Reglas de negocio y decisiones en `product.md`.

## Better Auth (api)

- Paquete `better-auth` con `drizzleAdapter(db, { provider: 'pg' })` y el plugin `magicLink`.
- Instancia creada con `createAuth(adminDb)` en `src/shared/auth/auth.ts`. La conexión de admin se arma en `src/index.ts` (y en `TestServer`), se inyecta en `createApp` y se cierra en el shutdown y en el teardown de los tests.
- Se monta en Express **antes** de Yoga, en `app.all('/api/auth/*splat', toNodeHandler(auth))` (Express 5 no acepta un `*` sin nombre), y sin `express.json()` delante de esa ruta.
- Configuración:
  - `magicLink({ expiresIn: 900, sendMagicLink })`. `sendMagicLink` usa el servicio de email.
  - `session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 }`.
  - `rateLimit` con una regla para `/sign-in/magic-link`: 3 pedidos cada 10 minutos. El límite por email se aplica en `sendMagicLink`, contando las filas de `verification` del email en esa ventana.
  - `advanced.database.generateId: () => crypto.randomUUID()`, para cumplir con `id uuid` de `docs/database.md`.
  - `trustedOrigins: [config.WEB_URL]`.
  - Cookies `httpOnly` (default de Better Auth), `sameSite: 'lax'` y `useSecureCookies` fuera de desarrollo.

## Email

- Proveedor propuesto: Resend (`resend`). Servicio en `src/services/email.service.ts` con un método `sendMagicLink(email, url)`.
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

- `workspace` no lleva `tenant_id` porque es el tenant. Tiene RLS (`ENABLE` y `FORCE`) con la policy `workspace_tenant_isolation`, que solo deja ver la fila cuyo `id` es `nullif(current_setting('app.current_tenant_id', true), '')::uuid`. Sin tenant en la conexión devuelve cero filas.
- Las tablas de auth no tienen RLS: solo las toca Better Auth, con la conexión de admin. La migración les hace `REVOKE ALL ... FROM app_user`, así la conexión de los requests no puede leer sesiones ni tokens.
- Fechas `timestamp with time zone`.
- Las tablas futuras con `tenant_id` llevan FK a `workspace(id)` con `ON DELETE CASCADE`.
- Migraciones: `0001_create_auth_and_workspace` (generada) y `0002_auth_rls_and_privileges` (custom, con el `FORCE` de `workspace` y el `REVOKE` de las tablas de auth). Aplicarlas le toca al usuario.

## Creación del workspace

- `databaseHooks.user.create.after` llama a `WorkspaceService.createForUser(user)`, que crea el workspace con el nombre inicial de `product.md`.
- `WorkspaceService.createForUser` usa la conexión de admin, porque todavía no hay tenant en el contexto.
- Si el hook falla, el workspace se crea al resolver el contexto del siguiente request (`getOrCreateForUser`). Así una cuenta nunca queda sin workspace.

## Contexto del request

- El `context` de Yoga (o un middleware en `src/shared/middlewares/auth.middleware.ts`) llama a `auth.api.getSession({ headers })`.
- Con sesión: busca el workspace del usuario, abre la conexión del request con `set_config('app.current_tenant_id', workspace.id, true)` dentro de una transacción y arma el contexto.
- `Context` pasa a ser `{ services, session: { user, workspace } | null }`.
- Las operaciones que requieren sesión lanzan `UNAUTHENTICATED` si `session` es `null`. De eso se encarga un helper `requireSession(context)` en `src/shared/auth/`, no cada resolver por su cuenta.

## API GraphQL

`src/schema/account.gql`:

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
| Schema | `src/schema/account.gql` |
| Resolvers | `src/resolvers/account.resolver.ts` |
| Services | `src/services/account.service.ts`, `src/services/workspace.service.ts`, `src/services/email.service.ts` |
| Repositorios | `src/repositories/workspace.repository.ts` |
| Errores | `src/errors/account.errors.ts` |

### Errores

| `code` | Cuándo |
|--------|--------|
| `UNAUTHENTICATED` | Una operación que requiere sesión se llama sin sesión. |

Se registra en el mapper de `src/shared/errors/error-handler.ts`.

## Config (api)

Variables nuevas en `src/shared/config.ts`:

| Variable | Uso |
|----------|-----|
| `ADMIN_DATABASE_URL` | Conexión que se salta RLS, para Better Auth y la creación del workspace. |
| `BETTER_AUTH_SECRET` | Firma de cookies y tokens. |
| `BETTER_AUTH_URL` | URL pública de la api. |
| `WEB_URL` | Origen del web, para `trustedOrigins` y los redirects. |
| `RESEND_API_KEY` | Envío del magic link. Opcional en `development` y `test`. |

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
- `apps/api/src/shared/context.ts`: agrega `session`.
- `apps/api/src/services/index.ts`: registra los services nuevos.
- `apps/api/docs/architecture.md`: el apartado Multi-tenant pasa a decir que el tenant es el workspace y cómo llega al contexto. El cambio se propone al terminar el paso 3.
- `apps/web/src/app/app.tsx`: rutas `/login` y `/`, con sus guards.
- `apps/web/vite.config.ts`: proxy a la api.
- `apps/web/src/lib/api/fetcher.ts`: `credentials: 'include'`.
- Locales `en.json` y `es.json`: textos de acceso, menú y estado vacío.

## Tests

- **api, e2e** (`tests/account/me/`): `me` con sesión y sin sesión, creación del workspace en el primer acceso, y que el RLS no deja leer el workspace de otro usuario. La sesión se crea con el magic link leído de `verification`.
- **api, unit:** el nombre inicial del workspace.
- **web, e2e** (`e2e/account/`): acceso con magic link, redirects de las guards y logout.

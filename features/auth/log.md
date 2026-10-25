# Acceso y workspace — log

## 2026-10-24 — samuel.corrales621

**Hecho:**
- (api, web) Se crea la feature `auth`: spec de producto, técnico y de UI, y plan de trabajo.

**Decisiones:**
- Acceso sin contraseñas: magic link en esta feature, GitHub y Google en `social-login`. No hay recuperación de contraseña, y la verificación de email queda cubierta por el magic link.
- Better Auth con adaptador de Drizzle.
- Un workspace por usuario, creado junto con la cuenta. El workspace es el tenant del RLS.
- Sesión en la base de datos que vence a los 30 días sin uso y se extiende con el uso. Sin refresh tokens, porque la sesión ya se revoca al instante. Las acciones delicadas piden una sesión reciente, y así quedó anotado en el roadmap para Conexiones y Planes.
- El milestone 1 se parte en tres features (`auth`, `social-login`, `account-settings`) para que no quede una sola feature demasiado grande.

## 2026-10-25 — samuel.corrales621

**Hecho:**
- (api) Paso 1: Better Auth montado en Express antes de Yoga (`createAuth(adminDb)`, `/api/auth/*splat`), schema de Drizzle de `user`, `session`, `account`, `verification` y `workspace`, y migración `0001_create_auth_and_workspace` con RLS en `workspace`. Falta aplicarla.
- (api) Correcciones de la review: `REVOKE ALL` de las tablas de auth a `app_user`, pool de admin inyectado en `createApp` y cerrado en el shutdown y en el teardown de los tests, cookies simplificadas y `BETTER_AUTH_SECRET` vacío en `.env.example`.
- (api) La `0001` queda tal como la genera drizzle-kit; el `FORCE ROW LEVEL SECURITY` de `workspace` y el `REVOKE` de las tablas de auth pasan a la migración custom `0002_auth_rls_and_privileges`.
- (api) Docs actualizados: variables nuevas y uso de `ADMIN_DATABASE_URL` en runtime (`commands.md`, `architecture.md`); FORCE RLS a mano, forma de la policy, `REVOKE` y timestamps con zona (`database.md`).
- (api) Paso 2: plugin `magicLink` (15 min, un solo uso, crea la cuenta con `emailVerified`), `EmailService` con Resend (en dev y test solo loguea el link; copy en inglés o español según `Accept-Language`), límite de 3 links por email cada 10 minutos en `MagicLinkService` + `VerificationRepository` (429 `MAGIC_LINK_LIMIT_EXCEEDED`) y `rateLimit` de Better Auth para `/sign-in/magic-link`. Variables `RESEND_API_KEY` y `EMAIL_FROM`, requeridas en production. Verificado con un e2e temporal; falta correr `yarn build`.
- (api) Las reglas de negocio pasan de `src/services/` a `src/use-cases/` (`MagicLinkUseCase`, `createUseCases`, `context.useCases`). Los emails se rehacen con el patrón de vendyx: `services/emails/` con la interface `EmailSender`, los adapters `resend`/`console`/`dummy` elegidos por `getEmailSender(config)`, el template `magic-link.template.tsx` con react-email y los textos en/es en `locales/`. Variable nueva `EMAIL_SENDER` (por defecto `console`; en production solo `resend`). Se borra `email.service.ts`. Docs actualizados (`architecture.md` con la sección "Services (externos)", `code-style.md`, `testing.md`, `commands.md` y el `CLAUDE.md` de la api).
- (api) Reorganización de carpetas y nombres: GraphQL en `src/api/` (`schema/`, `resolvers/`, `codegen.ts`), config en `src/config/`, Better Auth y el logger en `src/services/`, repositorios en `src/persistence/repositories/` y archivos con guion (`<recurso>-<capa>.ts`). Documentado en `architecture.md` y `code-style.md` (sección nueva "Carpetas e `index.ts`"), y nombres y rutas actualizados en `technical.md`.

**Decisiones:**
- Las migraciones generadas por drizzle-kit no se editan: el SQL que no sabe generar (`FORCE`, `GRANT`/`REVOKE`) va en una migración custom aparte (`yarn migrate:make <nombre> --custom`).
- La policy de tenant usa `nullif(current_setting('app.current_tenant_id', true), '')::uuid`: sin tenant devuelve cero filas en vez de error.
- Las tablas de auth no son accesibles por `app_user`; solo las toca Better Auth con la conexión de admin.
- La config de la api vive en `src/config/config.ts`, reexportada por `index.ts` (antes `src/shared/config.ts`).
- Todo lo de GraphQL vive en `src/api/`: `schema/*.gql`, `resolvers/` y `codegen.ts` (antes `src/schema`, `src/resolvers` y `src/shared/graphql/codegen.ts`).
- Better Auth es un service externo: `createAuth` vive en `src/services/auth/auth.ts` y lo reexporta `index.ts` (antes `src/shared/auth/auth.ts`).
- Los repositorios viven en `src/persistence/repositories/<recurso>/`, una carpeta por repositorio con su archivo y su test.
- Barrel `index.ts` solo cuando la carpeta lleva el nombre de su archivo principal (`config/config.ts` → `@/config`, `services/auth/auth.ts` → `@/services/auth`, `repositories/verification/verification-repository.ts` → `@/persistence/repositories/verification`). Las carpetas que agrupan varias piezas (`use-cases/`, `api/resolvers/`, `errors/`) no llevan barrel.
- La config valida `process.env` y lo mapea a un objeto en camelCase agrupado por tema (`config.database.url`, `config.emailSender.adapter`), como en vendyx. Solo valida forma y presencia, sin reglas por ambiente: ninguna variable tiene default (`NODE_ENV`, `PORT`, `EMAIL_SENDER` y `EMAIL_FROM` pasan a ser obligatorias) y se quita "en production solo `resend`".
- Los archivos de la api se nombran `<recurso>-<capa>.ts`, con guion y no con punto (`magic-link-use-case.ts`, `console-sender.ts`, `magic-link-template.tsx`, `verification-repository.ts`), para que el único punto extra sea el de los tests (`magic-link-use-case.test.ts`).
- El logger también es un service (`src/services/logger/logger.ts` + `index.ts`, antes `src/shared/logger/`): hoy es winston a consola, más adelante un proveedor de logs. Es la excepción a "solo lo usan los use-cases".
- Un service es una abstracción de un proveedor externo (email, billing, storage), con una interface, un adapter por proveedor y una factory que elige cuál usar según la config. Las reglas de negocio viven en `src/use-cases/`.

**Pendiente:**
- Decidir si en producción la conexión de admin usa un rol con `BYPASSRLS` y permisos acotados en vez de un superusuario.
- Paso 2: decidir si los links ya usados cuentan para el límite por email, actualizar `technical.md` y los docs de la api, y configurar `advanced.ipAddress` para el rate limit por IP en el deploy.

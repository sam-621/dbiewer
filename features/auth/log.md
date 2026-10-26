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
- (api) App context (`src/context/`) con conexiones, services y repositorios; Yoga sin `context` y sin `createUseCases`. Config mapeada a camelCase sin defaults.
- (api) Cierre del paso 2: el límite por email cuenta la tabla propia `magic_link_request` (migraciones `0003` y `0004`, falta aplicarlas), repositorios en su carpeta, suite de integración (`yarn test:integration`) para repositorios y senders, preview de templates con React Email (`yarn emails`), `api-reviewer.md` habla de use-cases, y `technical.md` actualizado (límite, tabla, `MAGIC_LINK_LIMIT_EXCEEDED`, contexto del request, tests).
- (api) Ajustes de la review: el límite guarda el intento primero y después cuenta (también los rechazados; resuelve los pedidos simultáneos), alias `@tests/`, ids en `MagicLinkRequestConstants`, `templates/_shared/`, guarda contra correr dos suites de DB a la vez, y docs de testing (SDK mockeado, senders en integración, `Constants`) y de `yarn emails`. Imports con `../` pasados a `@/` y `@tests/`. `yarn build` pasa.
- (api) Paso 3: `WorkspaceRepository` (`findByOwnerUserId`, `create`, `findOrCreate` con `onConflictDoNothing`) y `WorkspaceUseCase` (`createForUser`, `getOrCreateForUser`; nombre `<nombre>'s workspace` o `My workspace`). El hook `databaseHooks.user.create.after` crea el workspace, y si falla lo registra en el log sin romper el login (lo crea el siguiente request). Contexto del request en `src/context/request-context.ts` (`context` de Yoga, sin middleware): `services`, `session: { user, workspace } | null` y `withTenant(run)`, que abre una transacción con `set_config('app.current_tenant_id', …, true)` y le pasa a `run` los repositorios del tenant. `requireSession` en `services/auth/` y `UnauthenticatedError` → `UNAUTHENTICATED`. Unit del nombre e integración del repositorio, incluidos los pedidos simultáneos. `yarn build` pasa.
- (api) Ajustes de la review: el contexto ya no expone `appContext` (ni la conexión de admin), `getOrCreateForUser` no choca con pedidos simultáneos y `withTenant` valida con `requireSession`.
- (api) `WorkspaceUseCase` se parte en `WorkspaceForUserCreator` (lo usa el hook) y `WorkspaceForUserEnsurer` (lo usa el contexto del request), cada uno en su carpeta con su test e `index.ts` y un solo método `execute`. El nombre inicial pasa a `shared/utils/workspace-name.ts`. `magic-link-use-case.ts` queda como estaba.
- (api) `withTenant` se reemplaza por `UnitOfWork` (`src/persistence/unit-of-work/`, como en vendyx y sin eventos): recibe la base y el `RLSContext` (`{ tenantId }`), abre la transacción, aplica el RLS y le pasa al work los repositorios (`build-repositories.ts`) y el `UowContext` (`repositories`, `trx`, `runWithoutRLS`, `rlsContext`). `rls.ts` con `enableRLS`, `disableRLS` y `runWithoutRLS`. La policy de `workspace` acepta `app.bypass_rls = 'on'` (migración generada `0005`, falta aplicarla). Los dos use-cases del workspace reciben el `UowContext` y corren con la conexión `app` dentro de `runWithoutRLS`; la de admin queda solo para Better Auth y magic link. `RequestContext` pasa a `{ database, rlsContext, services, session }`.
- (api) `runWithoutRLS` pasa del use-case al repositorio: `WorkspaceRepository(trx, rls)` lo corre en sus métodos sin tenant; `buildRepositories(trx, rlsContext)` lo arma una vez.
- (api) `findOrCreate` sale del repositorio: `WorkspaceForUserEnsurer` busca, crea con `createIfOwnerHasNone` (insert que ignora el conflicto en `owner_user_id`) y relee si chocó.
- (api) Se borra `WorkspaceForUserEnsurer`: el workspace solo lo crea el hook (que ya no atrapa el error) y el contexto del request lo busca con `WorkspaceForUserFinder`, que lanza `WorkspaceNotFoundError` (`WORKSPACE_NOT_FOUND`) si no existe.
- (api) Se borra `WorkspaceForUserFinder`: `resolveSession` usa directo `repositories.workspace.findByOwnerUserId` del unit of work y lanza `WorkspaceNotFoundError` si no hay.
- (api) Se quita el hook `databaseHooks.user.create.after`: el workspace se va a crear con una mutation. `WorkspaceForUserCreator` queda para esa mutation.

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
- Hay dos contextos: el app context (`src/context/app-context.ts`), que se arma una vez con las conexiones (`databases.app`, `databases.admin`), los services (`emailSender`) y los repositorios (`verification`) ya instanciados, y el contexto del request de GraphQL, que todavía no existe (Yoga corre sin `context`; se agrega con los resolvers con sesión). Los use-cases no van en el app context ni en un registro (`createUseCases` se elimina): se instancian donde se usan, con lo que sacan de él.
- El límite de magic links se cuenta en una tabla propia de intentos: cada pedido guarda su intento primero (también los rechazados y los que fallan al enviarse), después se cuentan los de los últimos 10 minutos y con más de 3 se rechaza. Así pedidos simultáneos no pasan el límite.
- Se testean con integración los repositorios (contra la DB) y los senders (SDK mockeado). No se testean Better Auth, templates, logger ni `shared/`; los use-cases usados desde resolvers se cubren con el e2e.
- Los fixtures se nombran con punto: `<recurso>.fixtures.ts`.
- Alias `@tests/` → `tests/` para las utilidades de test, en vez de relativos largos.
- Integración y e2e nunca corren a la vez: `scripts/test-database.sh` corta con error si la DB de tests ya está levantada.
- Los componentes compartidos de los templates van en `templates/_shared/`, para que el preview de React Email no los muestre.
- Los archivos de la api se nombran `<recurso>-<capa>.ts`, con guion y no con punto (`magic-link-use-case.ts`, `console-sender.ts`, `magic-link-template.tsx`, `verification-repository.ts`), para que el único punto extra sea el de los tests (`magic-link-use-case.test.ts`).
- El logger también es un service (`src/services/logger/logger.ts` + `index.ts`, antes `src/shared/logger/`): hoy es winston a consola, más adelante un proveedor de logs. Es la excepción a "solo lo usan los use-cases".
- Un service es una abstracción de un proveedor externo (email, billing, storage), con una interface, un adapter por proveedor y una factory que elige cuál usar según la config. Las reglas de negocio viven en `src/use-cases/`.
- Un caso de uso es una clase con un solo método (`execute`), nombrada `<algo>-er/-or` (`WorkspaceForUserCreator`, `WorkspaceForUserEnsurer`), en su propia carpeta con su test y su `index.ts`. Por ahora solo se aplica a lo nuevo; `MagicLinkUseCase` queda como está.
- Los procesos con RLS corren en un `UnitOfWork`: quien llama (el resolver) lo instancia con la base y el `RLSContext`, y dentro de `execute` crea el use-case pasándole por constructor el `UowContext` completo, lo ejecuta y devuelve el resultado. Los use-cases siempre reciben el `UowContext`. Por ahora solo en los use-cases del workspace.
- Los repositorios reciben siempre la transacción y el RLS del unit of work (`{ context, runWithoutRLS }`). El use-case no sabe de RLS: si una consulta va sin tenant, el repositorio usa `runWithoutRLS` por dentro.
- El repositorio solo habla con la base de datos: decisiones como buscar o crear van en el use-case.
- El workspace solo se crea al crear la cuenta; nunca al leerlo. Si falta, es un error (`WORKSPACE_NOT_FOUND`).
- No se crea un use-case para una lectura de infraestructura (resolver la sesión): se usa el repositorio del unit of work directo.
- El workspace no se crea al crear la cuenta: se crea con una mutation.

**Pendiente:**
- Decidir si en producción la conexión de admin usa un rol con `BYPASSRLS` y permisos acotados en vez de un superusuario.
- Confirmar los cambios a `technical.md` y a los docs de la api por el paso 3 (`UnitOfWork`, use-cases como clase por caso con `UowContext`, `RequestContext`, `app.bypass_rls` en la policy, `UNAUTHENTICATED` en `testing.md`).
- Decidir si `app.bypass_rls` va en la policy de todas las tablas con tenant (el OR puede impedir usar el índice sobre `tenant_id`, ver `database.md` > RLS e índices).

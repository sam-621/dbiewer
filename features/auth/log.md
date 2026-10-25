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

**Decisiones:**
- Las migraciones generadas por drizzle-kit no se editan: el SQL que no sabe generar (`FORCE`, `GRANT`/`REVOKE`) va en una migración custom aparte (`yarn migrate:make <nombre> --custom`).
- La policy de tenant usa `nullif(current_setting('app.current_tenant_id', true), '')::uuid`: sin tenant devuelve cero filas en vez de error.
- Las tablas de auth no son accesibles por `app_user`; solo las toca Better Auth con la conexión de admin.

**Pendiente:**
- Decidir si en producción la conexión de admin usa un rol con `BYPASSRLS` y permisos acotados en vez de un superusuario.

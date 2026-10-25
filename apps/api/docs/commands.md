<!--- cSpell:disable --->

# Comandos

Todos se corren dentro de `apps/api`. Esta tabla es el contrato de los scripts del `package.json`: si falta uno, se agrega con este nombre.

## Los puede correr el agente

| Comando | Para qué |
|---------|----------|
| `yarn test [ruta]` | Tests unitarios (`*.test.ts`). Sin Docker. |
| `yarn test:e2e [ruta]` | Tests e2e (`*.e2e.test.ts`). Levanta Postgres en Docker, migra, corre y lo baja. |
| `yarn lint:check` | Revisa ESLint + Prettier. |
| `yarn lint:fix` | Arregla lint, formato y orden de imports. |
| `yarn gen:types` | Regenera los tipos de GraphQL a partir de los `.gql`. Correr cuando cambia un `.gql`. |
| `yarn migrate:make <nombre>` | Crea el archivo de una migración nueva. No toca ninguna DB. |

- No correr `tsc --noEmit` para verificar ediciones; el diagnóstico del IDE basta. El typecheck real es `yarn build`.
- Tests: solo los de la feature, nunca la suite completa (ver `testing.md`).

## Solo los corre el usuario

Todo lo que toca una DB real, levanta el server o pega a una API viva. Si hace falta, se le pide y se espera.

| Comando | Para qué |
|---------|----------|
| `yarn dev` | Levanta la app en local. |
| `yarn build` | Typecheck y build de producción. |
| `yarn start` | Corre la build. |
| `yarn migrate <config>` | Aplica las migraciones pendientes. `<config>` es el archivo env con `ADMIN_DATABASE_URL` (p. ej. `.env.migration`). |
| `yarn seed` | Siembra datos base. Por definir: se agrega cuando exista el primer schema. |

- Drizzle no tiene migraciones de reversa: para deshacer una migración ya aplicada, se crea una nueva con `yarn migrate:make <nombre>` que revierta el cambio.

## Variables de entorno

| Variable | Para qué |
|----------|----------|
| `PORT` | Puerto del server. |
| `DATABASE_URL` | Conexión de la app. |
| `ADMIN_DATABASE_URL` | Conexión como superusuario. Se salta RLS. La usan los tests, los scripts y, en runtime, Better Auth y la creación del workspace. |
| `BETTER_AUTH_SECRET` | Firma de cookies y tokens de Better Auth. Mínimo 32 caracteres (`openssl rand -base64 32`). |
| `BETTER_AUTH_URL` | URL pública de la api. |
| `WEB_URL` | Origen del web, para `trustedOrigins` y los redirects. |

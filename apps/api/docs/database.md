<!--- cSpell:disable --->

# Base de datos

Base de datos propia de la api (usuarios, conexiones, queries guardadas, historial): Postgres con Drizzle. Las bases de datos del usuario nunca se migran ni se modifican desde aquí. Schema en `src/persistence/schema/`, migraciones en `database/migrations/` generadas con drizzle-kit.

## Migraciones

- Se cambia el schema y se crea con `yarn migrate:make <nombre_en_snake_case>` (`drizzle-kit generate --name`). Se revisa el SQL generado antes de darla por buena.
- Las migraciones generadas no se editan. El SQL que drizzle-kit no sabe generar (`FORCE ROW LEVEL SECURITY`, `GRANT`/`REVOKE`) va en una migración custom aparte, creada con `yarn migrate:make <nombre> --custom`, justo después de la generada.
- Nunca editar una migración que ya se aplicó en otro ambiente.
- **Aplicarlas (`yarn migrate <config>`) es exclusivo del usuario.** Se le pide y se espera.
- Toda tabla tiene `id uuid`, `created_at`, `updated_at` y, si se borra lógicamente, `deleted_at`.
- Las fechas son `timestamp with time zone`. `updated_at` lleva `defaultNow()` y `$onUpdate(() => new Date())`.
- Columnas y tablas en snake_case y en singular (`saved_query`).
- `workspace` es la tabla tenant: no tiene `tenant_id` y su policy compara su propio `id`.
- Una tabla nueva con `tenant_id` necesita:
  - `tenant_id` con `DEFAULT nullif(current_setting('app.current_tenant_id', true), '')::uuid`, `notNullable` y FK a `workspace(id)` con `ON DELETE CASCADE`.
  - Su policy de aislamiento con `pgPolicy` en el schema, comparando contra `nullif(current_setting('app.current_tenant_id', true), '')::uuid` en `using` y `withCheck`. Sin tenant en la conexión devuelve cero filas en vez de un error.
  - `ENABLE` + `FORCE ROW LEVEL SECURITY`. drizzle-kit solo genera el `ENABLE`: el `ALTER TABLE "<tabla>" FORCE ROW LEVEL SECURITY;` va en la migración custom.
  - Privilegios para `app_user` (los da por defecto la migración `0000`).
- Una tabla que `app_user` no debe tocar (las de auth, sin RLS) lleva `REVOKE ALL ON "<tabla>" FROM app_user;` en la migración custom, porque la `0000` le da privilegios por defecto sobre toda tabla nueva.

## Queries

- Toda query paginada termina su `ORDER BY` con una columna única (`id`). Sin eso, `LIMIT/OFFSET` pierde y duplica filas entre páginas.
- `created_at` no sirve para desempatar: es `now()`, que en Postgres es el inicio de la transacción, así que todo lo insertado en una misma transacción comparte el valor.
- Índices sobre FKs que se usan para filtrar o hacer join.

## RLS e índices

- Antes de proponer un índice sobre `tenant_id`, revisar que las policies no tengan un bypass permisivo unido con OR: si lo tienen, Postgres no usa el índice.

<!--- cSpell:disable --->

# Base de datos

Base de datos propia de la api (usuarios, conexiones, queries guardadas, historial): Postgres con Drizzle. Las bases de datos del usuario nunca se migran ni se modifican desde aquí. Schema en `src/persistence/schema/`, migraciones en `database/migrations/` generadas con drizzle-kit.

## Migraciones

- Se cambia el schema y se crea con `yarn migrate:make <nombre_en_snake_case>` (`drizzle-kit generate --name`). Se revisa el SQL generado antes de darla por buena.
- Nunca editar una migración que ya se aplicó en otro ambiente.
- **Aplicarlas (`yarn migrate <config>`) es exclusivo del usuario.** Se le pide y se espera.
- Toda tabla tiene `id uuid`, `created_at`, `updated_at` y, si se borra lógicamente, `deleted_at`.
- Columnas y tablas en snake_case y en singular (`saved_query`).
- Una tabla nueva con `tenant_id` necesita:
  - `tenant_id` con `DEFAULT (current_setting('app.current_tenant_id'))::uuid` y `notNullable`.
  - `ENABLE` + `FORCE ROW LEVEL SECURITY` y su policy de aislamiento, igual que las tablas existentes.
  - Privilegios para `app_user`.

## Queries

- Toda query paginada termina su `ORDER BY` con una columna única (`id`). Sin eso, `LIMIT/OFFSET` pierde y duplica filas entre páginas.
- `created_at` no sirve para desempatar: es `now()`, que en Postgres es el inicio de la transacción, así que todo lo insertado en una misma transacción comparte el valor.
- Índices sobre FKs que se usan para filtrar o hacer join.

## RLS e índices

- Antes de proponer un índice sobre `tenant_id`, revisar que las policies no tengan un bypass permisivo unido con OR: si lo tienen, Postgres no usa el índice.

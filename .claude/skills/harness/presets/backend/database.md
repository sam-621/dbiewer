<!--- cSpell:disable --->

# Base de datos
<!-- si: db=knex -->

Postgres con Knex. Migraciones en `database/migrations/`, configs por ambiente en `database/configs/<config>/.env.migration` (`local`, `dev`, `prod`).
<!-- /si -->
<!-- si: db=prisma -->

Postgres con Prisma. Schema en `prisma/schema.prisma`, migraciones en `prisma/migrations/`.
<!-- /si -->
<!-- si: db=drizzle -->

Postgres con Drizzle. Schema en `src/persistence/schema/`, migraciones en `database/migrations/` generadas con drizzle-kit.
<!-- /si -->

## Migraciones

<!-- si: db=knex -->
- **Siempre crear con `{{run}} migrate:make <nombre_en_snake_case>`**, nunca a mano. Genera el archivo con el timestamp correcto y no toca ninguna DB. Después se llena el archivo generado.
<!-- /si -->
<!-- si: db=prisma -->
- Se cambia `schema.prisma` y se crea con `{{run}} migrate:make <nombre_en_snake_case>` (`prisma migrate dev --create-only`). Se revisa el SQL generado antes de darla por buena.
- Nunca editar una migración que ya se aplicó en otro ambiente.
<!-- /si -->
<!-- si: db=drizzle -->
- Se cambia el schema y se crea con `{{run}} migrate:make <nombre_en_snake_case>` (`drizzle-kit generate --name`). Se revisa el SQL generado antes de darla por buena.
- Nunca editar una migración que ya se aplicó en otro ambiente.
<!-- /si -->
- **Aplicarlas (`{{run}} migrate <config>`) es exclusivo del usuario.** Se le pide y se espera.
- Toda tabla tiene `id uuid`, `created_at`, `updated_at` y, si se borra lógicamente, `deleted_at`.
- Columnas y tablas en snake_case y en singular (`order_line`).
<!-- si: rls -->
- Una tabla nueva con `tenant_id` necesita:
  - `tenant_id` con `DEFAULT (current_setting('app.current_tenant_id'))::uuid` y `notNullable`.
  - `ENABLE` + `FORCE ROW LEVEL SECURITY` y su policy de aislamiento, igual que las tablas existentes.
  - Privilegios para `app_user`.
<!-- /si -->

## Queries

- Toda query paginada termina su `ORDER BY` con una columna única (`id`). Sin eso, `LIMIT/OFFSET` pierde y duplica filas entre páginas.
- `created_at` no sirve para desempatar: es `now()`, que en Postgres es el inicio de la transacción, así que todo lo insertado en una misma transacción comparte el valor.
- Índices sobre FKs que se usan para filtrar o hacer join.
<!-- si: rls -->

## RLS e índices

- Antes de proponer un índice sobre `tenant_id`, revisar que las policies no tengan un bypass permisivo unido con OR: si lo tienen, Postgres no usa el índice.
<!-- /si -->

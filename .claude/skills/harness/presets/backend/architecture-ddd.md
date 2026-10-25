<!--- cSpell:disable --->

# Arquitectura

## Capas

```
src/api, src/jobs, src/webhooks, listeners   adapters: auth, transacción, mapeo de respuesta
        │
        ▼
src/modules/<módulo>                          negocio: use cases, dominio, services, repos
        │
        ▼
src/persistence                               conexión, tipos de tabla, Repository base, UnitOfWork
```

- **Todo el negocio va en `src/modules`.** Los adapters no tienen lógica de negocio: autentican, abren la transacción, delegan al use case y mapean la respuesta.
- Un módulo solo importa de otro módulo por su `index.ts` o por sus barrels. Nunca de archivos internos de otro módulo.

## Estructura de un módulo

```
src/modules/<módulo>/
├── domain/
│   ├── aggregates/<nombre>/      <nombre>.ts, <nombre>.test.ts, index.ts
│   ├── entities/<nombre>/
│   └── value-objects/<nombre>/
├── use-cases/<verbo>/            <clase-del-use-case>.ts
├── services/<concepto>/          <clase>.ts, index.ts, __tests__/
├── repositories/<nombre>-repository/
│   ├── <nombre>-repository.ts
│   ├── index.ts
│   └── __tests__/                <nombre>-repository.int.test.ts, fixtures/
└── errors/<módulo>-errors.ts
```

`src/modules/shared` tiene las bases: `UseCase`, `Aggregate`, `Entity`, `ValueObject`, `{{BaseError}}`, `Money` y lo que se comparta entre módulos.

## Dominio: solo cuando hay reglas

- Un **aggregate** solo existe si hay invariantes que proteger (ej. `Order`, `Cart`). Se crea con `static create(...)` y se rehidrata con `static reconstitute(props)`. Constructor privado.
- Un CRUD simple **no** lleva aggregate ni entidad: el use case valida con su schema y usa el repositorio directo (ej. `CustomerRemover` hace `softRemove`).
- Las entidades extienden `Entity`; los value objects extienden `ValueObject<Props>` con `private constructor` + `static create`.
- El aggregate es dueño de sus entidades hijas: nadie las modifica sin pasar por él.

## Repositorios

- Van dentro del módulo, en `repositories/`. Extienden `Repository<Entity, Table>` de `@/persistence/repositories/repository`, así conservan el CRUD genérico (`findOne`, `findMany`, `create`, `update`, `softRemove`...).
- Si el módulo tiene aggregate, el repo agrega `load(id)` (devuelve el aggregate o `null`) y `save(aggregate)` (persiste todo el estado del aggregate, incluidas tablas hijas).
- Se registran en `src/persistence/repositories/build-repositories.ts` para quedar disponibles en `ctx.repositories`.

## Use cases

- Una clase por acción, extiende `UseCase<typeof schema>`. Solo para **mutations**.
- Reciben `UowContext` en el constructor y crean ahí los services que usan.
- `execute(input)` (heredado) valida con el schema de zod y, si falla, devuelve `InvalidInputError`. La lógica va en `run(input)`.
- Acceso a datos por `this.ctx.repositories.*`.
- Eventos de dominio con `this.ctx.events.add(eventCtx => new XEvent(eventCtx, ...))`. Se emiten después del commit.

## Queries

Las lecturas van directo al repositorio desde el adapter (`ctx.repositories.order.findMany(...)`). No llevan use case.

## Errores

- Todo error de negocio extiende `{{BaseError}}` y vive en `errors/<módulo>-errors.ts`. El mensaje incluye los valores que lo causaron.
<!-- si: errors=return -->
- **Aggregates y entidades lanzan** (`throw new XError()`).
- **Services y use cases retornan** el error. El `run` del use case envuelve en `try/catch`, devuelve el `{{BaseError}}` atrapado y relanza lo demás.
- Excepción: un service puede lanzar si el usuario lo decide explícitamente.
<!-- /si -->
<!-- si: errors=throw -->
- Aggregates, entidades, services y use cases **lanzan** (`throw new XError()`). Nadie atrapa un `{{BaseError}}` salvo para traducirlo en el adapter.
- El adapter tiene un único punto que mapea `{{BaseError}}` a la respuesta de error (ver Adapters).
<!-- /si -->
- `throw new Error(...)` normal queda para errores de programación o infraestructura (ej. un value object con props inválidas).

## Adapters

<!-- si: api=graphql -->
### Resolver (mutation)

1. Guards de auth y permisos envolviendo el resolver, sin alterar su composición.
2. `new UnitOfWork(ctx.database, ctx).execute(async (_repositories, uowCtx) => new XUseCase(uowCtx).execute({...}))`.
3. `return apiResponse(result)`, con `apiResponseFactory(toXApiError, '<key>')`.

Un error nuevo se registra en tres lugares: el enum `*ErrorCode` del `.gql`, `{{run}} gen:types`, y el mapper `src/api/shared/errors/<dominio>-error.mapper.ts`.
<!-- /si -->
<!-- si: api=rest -->
### Controller (mutation)

1. Middlewares de auth y permisos en la definición de la ruta.
2. `new UnitOfWork(ctx.database, ctx).execute(async (_repositories, uowCtx) => new XUseCase(uowCtx).execute({...req.params, ...req.body}))`.
3. `return sendResult(res, result)`: si es `{{BaseError}}`, responde con el status y `code` del mapper `src/api/shared/errors/<dominio>-error.mapper.ts`; si no, `200` (o `201` al crear) con el body.

Un error nuevo se registra en el mapper con su status HTTP y su `code` (SCREAMING_SNAKE_CASE). El body de error siempre es `{ code, message }`.
<!-- /si -->
<!-- si: api=trpc -->
### Procedure (mutation)

1. `protectedProcedure` (o el que corresponda al permiso) sin alterar su composición.
2. `new UnitOfWork(ctx.database, ctx).execute(async (_repositories, uowCtx) => new XUseCase(uowCtx).execute(input))`.
3. `return toTrpcResult(result)`: si es `{{BaseError}}`, lanza `TRPCError` con el `code` del mapper `src/api/shared/errors/<dominio>-error.mapper.ts`.

El input de la procedure no se valida con `.input(schema)` aparte: el schema vive en el use case. Se usa `.input(XUseCase.schema)` para tipar.
<!-- /si -->

### Jobs, webhooks, listeners

Mismo patrón: abren su `UnitOfWork` con el contexto de su propia fuente (query, metadata del evento, `event.ctx`) y delegan al use case. Sin lógica de negocio en el adapter.
<!-- si: rls -->

## RLS (multi-tenant)

- Cada tabla con `tenant_id` tiene policies de Postgres con `FORCE ROW LEVEL SECURITY` que leen `app.current_tenant_id` (ver `src/persistence/rls.ts`).
- `UnitOfWork` activa RLS al abrir la transacción. `tenant_id` se autoasigna en los inserts por el `DEFAULT current_setting('app.current_tenant_id')` de la columna.
- `ctx.runWithoutRLS(fn)` solo cuando una operación legítimamente cruza tenants.
- La app conecta como `app_user` (RLS aplica). Los tests y scripts con `ADMIN_DATABASE_URL` conectan como superusuario y se saltan RLS.
<!-- /si -->

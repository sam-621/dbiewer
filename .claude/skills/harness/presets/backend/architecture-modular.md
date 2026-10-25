<!--- cSpell:disable --->

# Arquitectura

Módulos por dominio, sin capa de dominio rica: la lógica vive en use cases y services, los datos se leen y escriben con repositorios. Si un módulo empieza a tener invariantes complejas que se repiten en varios use cases, se propone pasarlo a aggregates.

## Capas

```
src/api, src/jobs, src/webhooks   adapters: auth, transacción, mapeo de respuesta
        │
        ▼
src/modules/<módulo>              negocio: use cases, services, repos
        │
        ▼
src/persistence                   conexión, tipos de tabla, Repository base, UnitOfWork
```

- **Todo el negocio va en `src/modules`.** Los adapters no tienen lógica de negocio.
- Un módulo solo importa de otro módulo por su `index.ts`. Nunca de archivos internos de otro módulo.

## Estructura de un módulo

```
src/modules/<módulo>/
├── use-cases/<verbo>/            <clase-del-use-case>.ts
├── services/<concepto>/          <clase>.ts, index.ts, __tests__/
├── repositories/<nombre>-repository/
│   ├── <nombre>-repository.ts
│   ├── index.ts
│   └── __tests__/
├── errors/<módulo>-errors.ts
└── index.ts                      lo que el módulo expone a otros
```

`src/modules/shared` tiene las bases: `UseCase`, `{{BaseError}}`, `Money` y lo que se comparta entre módulos.

## Repositorios

- Van dentro del módulo. Extienden `Repository<Entity, Table>` de `@/persistence/repositories/repository` y agregan solo las queries que el módulo necesita.
- Devuelven tipos planos de la tabla (`OrderEntity`), no clases.
- Se registran en `src/persistence/repositories/build-repositories.ts` para quedar disponibles en `ctx.repositories`.

## Use cases

- Una clase por acción, extiende `UseCase<typeof schema>`. Solo para **mutations**.
- Reciben `UowContext` en el constructor y crean ahí los services que usan.
- `execute(input)` (heredado) valida con el schema de zod y, si falla, devuelve `InvalidInputError`. La lógica va en `run(input)`.
- Las reglas de negocio se validan en el use case, o en un service si las comparten varios use cases.

## Services

- Un service por concepto reutilizable (`OrderFinder`, `PriceCalculator`). Si solo lo usa un use case, la lógica se queda en el use case.
- No persisten estado a medias: validan y calculan; el use case decide qué se guarda.

## Queries

Las lecturas van directo al repositorio desde el adapter (`ctx.repositories.order.findMany(...)`). No llevan use case.

## Errores

- Todo error de negocio extiende `{{BaseError}}` y vive en `errors/<módulo>-errors.ts`. El mensaje incluye los valores que lo causaron.
<!-- si: errors=return -->
- **Services y use cases retornan** el error. El `run` del use case envuelve en `try/catch`, devuelve el `{{BaseError}}` atrapado y relanza lo demás.
<!-- /si -->
<!-- si: errors=throw -->
- Services y use cases **lanzan**. El adapter tiene un único punto que mapea `{{BaseError}}` a la respuesta de error.
<!-- /si -->
- `throw new Error(...)` normal queda para errores de programación o infraestructura.

## Adapters

<!-- si: api=graphql -->
### Resolver (mutation)

1. Guards de auth y permisos envolviendo el resolver.
2. `new UnitOfWork(ctx.database, ctx).execute(async (_repositories, uowCtx) => new XUseCase(uowCtx).execute({...}))`.
3. `return apiResponse(result)`, con el mapper de errores del dominio.

Un error nuevo se registra en el enum `*ErrorCode` del `.gql`, se corre `{{run}} gen:types` y se agrega al mapper `src/api/shared/errors/<dominio>-error.mapper.ts`.
<!-- /si -->
<!-- si: api=rest -->
### Controller (mutation)

1. Middlewares de auth y permisos en la definición de la ruta.
2. `new UnitOfWork(ctx.database, ctx).execute(async (_repositories, uowCtx) => new XUseCase(uowCtx).execute({...req.params, ...req.body}))`.
3. `return sendResult(res, result)`, que mapea `{{BaseError}}` a status y `code` con `src/api/shared/errors/<dominio>-error.mapper.ts`.

El body de error siempre es `{ code, message }`.
<!-- /si -->
<!-- si: api=trpc -->
### Procedure (mutation)

1. `protectedProcedure` (o el que corresponda al permiso).
2. `new UnitOfWork(ctx.database, ctx).execute(async (_repositories, uowCtx) => new XUseCase(uowCtx).execute(input))`.
3. `return toTrpcResult(result)`, que lanza `TRPCError` con el `code` del mapper del dominio.
<!-- /si -->

### Jobs y webhooks

Abren su `UnitOfWork` con el contexto de su fuente y delegan al use case. Sin lógica de negocio en el adapter.
<!-- si: rls -->

## RLS (multi-tenant)

- Cada tabla con `tenant_id` tiene policies de Postgres con `FORCE ROW LEVEL SECURITY` que leen `app.current_tenant_id` (ver `src/persistence/rls.ts`).
- `UnitOfWork` activa RLS al abrir la transacción. `tenant_id` se autoasigna en los inserts por el `DEFAULT` de la columna.
- `ctx.runWithoutRLS(fn)` solo cuando una operación legítimamente cruza tenants.
- La app conecta como `app_user` (RLS aplica). Los tests y scripts con `ADMIN_DATABASE_URL` se saltan RLS.
<!-- /si -->

<!--- cSpell:disable --->

# Arquitectura

Capas clásicas, organizadas por tipo de pieza. Sin módulos ni capa de dominio. La API es GraphQL con GraphQL Yoga sobre Express.

## Capas

```
src/schema          los .gql del schema de GraphQL
        │
        ▼
src/resolvers       validan el input, llaman al service, responden
        │
        ▼
src/services        reglas de negocio
        │
        ▼
src/repositories    acceso a datos
```

- Cada capa solo llama a la de abajo. Un resolver nunca llama a un repositorio; un service nunca toca el contexto de GraphQL ni `req`/`res`.
- Lo compartido va en `src/shared/` (`errors/`, `middlewares/`, `utils/`, `config.ts`).

## Estructura

```
src/
├── schema/<recurso>.gql
├── resolvers/<recurso>.resolver.ts
├── services/<recurso>.service.ts
├── repositories/<recurso>.repository.ts
├── schemas/<recurso>.schemas.ts       schemas de zod del input
├── errors/<recurso>.errors.ts
└── shared/
```

Un archivo por recurso en cada capa (`connection.resolver.ts`, `connection.service.ts`, `connection.repository.ts`). Si un archivo crece demasiado, se parte por acción dentro de una carpeta del recurso.

## Resolvers

- Validan el input con el schema de `schemas/` (`CreateConnectionSchema.parse(args.input)`); si falla, el error se responde con los issues.
- Llaman a un solo método del service y responden. Sin `if` de negocio.
- Los tipos de args y resultados salen de `yarn gen:types` a partir de los `.gql`.

## Services

- Una clase por recurso con un método por acción (`ConnectionService.create`, `QueryService.run`).
- Reciben sus repositorios por constructor.
- Las reglas de negocio viven aquí. Si una regla la usan varios services, se mueve a `src/shared/` o a un service propio.
- Si una acción escribe en varias tablas, abre una transacción y la pasa a los repositorios.

## Repositorios

- Una clase por tabla o agregado de tablas. Solo queries, sin reglas.
- Devuelven tipos planos de la tabla.

## Bases de datos del usuario

- Hay dos tipos de base de datos: la propia de la api (usuarios, conexiones, queries guardadas, historial; ver `database.md`) y las del usuario, a las que la api se conecta para ejecutar queries y leer su esquema.
- Motor soportado al inicio: Postgres. Cómo se abstrae un motor para agregar otros: por definir.
- Las credenciales de las conexiones se guardan cifradas. Esquema de cifrado: por definir.

## Errores

- Todo error de negocio extiende `DbiewerError` y vive en `errors/<recurso>.errors.ts`. El mensaje incluye los valores que lo causaron.
- Los services **lanzan** el error. Un handler de errores de Yoga (`src/shared/errors/error-handler.ts`) mapea `DbiewerError` a un error de GraphQL con `extensions: { code }` y su mensaje. Lo demás responde un error genérico sin detalles.
- Un error nuevo se registra en el mapper del handler con su `code`.

## Multi-tenant

- Cada tabla con `tenant_id` tiene RLS en Postgres que lee `app.current_tenant_id`.
- El middleware de auth abre la conexión del request a la DB propia con `set_config('app.current_tenant_id', ...)`. Ningún service filtra por tenant a mano.
- `ADMIN_DATABASE_URL` se salta RLS. La usan los tests, los scripts y, en runtime, solo Better Auth y la creación del workspace (todavía no hay tenant en el contexto).
- Las conexiones (`db` con `DATABASE_URL`, `adminDb` con `ADMIN_DATABASE_URL`) se crean en `src/index.ts` y se inyectan en `createApp(db, adminDb)`. Ningún módulo abre su propia conexión al importarse.
- Sus pools se cierran en el shutdown de `src/index.ts` (`SIGINT`/`SIGTERM`) y en `TestServer.teardown()`.

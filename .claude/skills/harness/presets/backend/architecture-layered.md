<!--- cSpell:disable --->

# Arquitectura

Capas clásicas, organizadas por tipo de pieza. Sin módulos ni capa de dominio: para una app chica o un CRUD con pocas reglas.

## Capas

```
src/routes          definición de rutas y middlewares
        │
        ▼
src/controllers     validan el input, llaman al service, responden
        │
        ▼
src/services        reglas de negocio
        │
        ▼
src/repositories    acceso a datos
```

- Cada capa solo llama a la de abajo. Un controller nunca llama a un repositorio; un service nunca toca `req` ni `res`.
- Lo compartido va en `src/shared/` (`errors/`, `middlewares/`, `utils/`, `config.ts`).

## Estructura

```
src/
├── routes/<recurso>.routes.ts
├── controllers/<recurso>.controller.ts
├── services/<recurso>.service.ts
├── repositories/<recurso>.repository.ts
├── schemas/<recurso>.schemas.ts       schemas de zod del input
├── errors/<recurso>.errors.ts
└── shared/
```

Un archivo por recurso en cada capa (`order.controller.ts`, `order.service.ts`, `order.repository.ts`). Si un archivo crece demasiado, se parte por acción dentro de una carpeta del recurso.

## Controllers

- Validan el input con el schema de `schemas/` (`CreateOrderSchema.parse(req.body)`); si falla, responden `400` con los issues.
- Llaman a un solo método del service y responden. Sin `if` de negocio.

## Services

- Una clase por recurso con un método por acción (`OrderService.create`, `OrderService.cancel`).
- Reciben sus repositorios por constructor.
- Las reglas de negocio viven aquí. Si una regla la usan varios services, se mueve a `src/shared/` o a un service propio.
- Si una acción escribe en varias tablas, abre una transacción y la pasa a los repositorios.

## Repositorios

- Una clase por tabla o agregado de tablas. Solo queries, sin reglas.
- Devuelven tipos planos de la tabla.

<!-- si: api=graphql -->
## Resolvers

Con GraphQL, `routes/` y `controllers/` se reemplazan por `src/resolvers/<recurso>.resolver.ts` y los `.gql` en `src/schema/`. El resolver hace lo mismo que el controller: valida, llama al service, responde.

<!-- /si -->
## Errores

- Todo error de negocio extiende `{{BaseError}}` y vive en `errors/<recurso>.errors.ts`. El mensaje incluye los valores que lo causaron.
- Los services **lanzan** el error. Un middleware de errores (`src/shared/middlewares/error-handler.ts`) mapea `{{BaseError}}` a status HTTP y `{ code, message }`. Lo demás responde `500` sin detalles.
- Un error nuevo se registra en el mapper del middleware con su status y su `code`.
<!-- si: rls -->

## Multi-tenant

- Cada tabla con `tenant_id` tiene RLS en Postgres que lee `app.current_tenant_id`.
- El middleware de auth abre la conexión del request con `set_config('app.current_tenant_id', ...)`. Ningún service filtra por tenant a mano.
- Los tests y scripts con `ADMIN_DATABASE_URL` se saltan RLS.
<!-- /si -->

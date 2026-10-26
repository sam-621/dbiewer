<!--- cSpell:disable --->

# Estilo de código

Aplica a todo código nuevo. Si un archivo existente lo contradice, manda este doc.

## General

- **Sin comentarios.** Ni explicativos, ni JSDoc, ni `TODO`, ni separadores. Solo si el usuario lo pide, y solo el que pidió.
- **Código y tests en inglés**, incluidos strings y valores de prueba.
- **Sin `any`**; `unknown` + narrowing.
- **Sin non-null assertion (`!`)**. Si algo puede ser `null`, se maneja o se usa un helper que lance.
- **Dinero en centavos** (enteros). Porcentajes como fracción (`0.2`).
- **Sin parámetros con default solo para que los tests escriban menos.** Si producción siempre pasa el argumento, es requerido.
- **`export` solo si se importa en otro archivo.** No se exporta "por si después se usa".

## Formato e imports

- ESLint + Prettier mandan. Correr `yarn lint:fix`; no reordenar imports a mano.
- Grupos de imports (los impone `simple-import-sort`): externos → `@/...` → relativos `../` → relativos `./`.
- `@/` apunta a `src/` y `@tests/` a `tests/` (utilidades de test: `@tests/utils/database`, `@tests/utils/fixture`). Se usan para cruzar carpetas; relativos solo dentro de la misma carpeta.
- Un alias nuevo se agrega en `tsconfig.json` (`paths`) y en las tres configs de vitest (`resolve.alias`).
- `import type` para lo que solo es tipo (regla `consistent-type-imports`).
- Argumentos sin usar se prefijan con `_` (`_repositories`).

## Naming

| Qué | Regla | Ejemplo |
|-----|-------|---------|
| Archivos | `<recurso>-<capa>.ts`, con guion y no con punto, así el único punto extra es el de los tests (`<recurso>-<capa>.test.ts`) | `connection-resolver.ts`, `connection-errors.ts`, `connection-repository.ts` |
| Clases | `<Recurso><Capa>` | `ConnectionRepository`, `ConnectionResolver` |
| Use-cases | una clase por caso de uso, nombrada por lo que hace con sufijo `-er`/`-or`; archivo en kebab-case en `modules/<modulo>/use-cases/`; carpeta con el mismo nombre solo si tiene test | `modules/workspace/use-cases/workspace-for-user-creator.ts`, `WorkspaceForUserCreator` |
| Método del use-case | se llama `execute`, que hereda de `UseCase`; la lógica va en `run` | `new ConnectionCreator(ctx, encryptionService).execute(args.input)` |
| Adapters de un service | `<adapter>/<adapter>-<rol>.ts`, clase `<Adapter><Rol>` | `resend/resend-sender.ts`, `ResendSender` |
| Templates de email | `<email>-template.tsx` | `magic-link-template.tsx` |
| Schemas | `<Acción><Recurso>Schema` | `CreateConnectionSchema` |
| Error | describe el caso + `Error` | `ConnectionNotFoundError` |

Se mantienen con punto los sufijos que piden las herramientas (`.test.ts`, `.int.test.ts`, `.e2e.test.ts`, `.gql`, `*.config.ts`) y los fixtures de los tests (`<recurso>.fixtures.ts`, p. ej. `verification.fixtures.ts`).

## Carpetas e `index.ts`

- **Carpeta por pieza** cuando la pieza va acompañada de otros archivos, casi siempre su test: `persistence/repositories/verification/` con `verification-repository.ts` y su test en `__tests__/`.
- **Barrel `index.ts` solo cuando la carpeta lleva el nombre de su archivo principal.** El `index.ts` hace `export * from './<archivo>'` y se importa por la carpeta, para no repetir el nombre en la ruta:

  | Carpeta | Archivo principal | Import |
  |---------|-------------------|--------|
  | `config/` | `config.ts` | `@/config` |
  | `context/` | `app-context.ts` (y el contexto del request cuando exista) | `@/context` |
  | `services/auth/` | `auth.ts` | `@/services/auth` |
  | `services/logger/` | `logger.ts` | `@/services/logger` |
  | `services/emails/senders/resend/` | `resend-sender.ts` | `./resend` |
  | `services/encryption/` | `encryption-service.ts` | `@/services/encryption` |
  | `persistence/repositories/verification/` | `verification-repository.ts` | `@/persistence/repositories/verification` |

- Una carpeta que agrupa varias piezas del mismo nivel (`use-cases/`, `api/resolvers/`, `errors/`, `senders/`, `templates/`) no lleva barrel: se importa el archivo (`@/modules/workspace/use-cases/workspace-for-user-creator`). Su `index.ts`, si existe, no reexporta: arma algo (el array de `resolvers`).

## Use-case

```ts
export class SavedQueryRenamer extends UseCase<typeof RenameSavedQuerySchema> {
  constructor(private readonly ctx: UowContext) {
    super(RenameSavedQuerySchema);
  }

  async run(
    input: z.output<typeof RenameSavedQuerySchema>
  ): Promise<SavedQuery | SavedQueryNotFoundError | SavedQueryNameAlreadyTakenError> {
    const savedQuery = await this.ctx.repositories.savedQuery.findOne({ id: input.savedQueryId });

    if (!savedQuery) return new SavedQueryNotFoundError(input.savedQueryId);
    if (await this.ctx.repositories.savedQuery.existsByName(input.name)) {
      return new SavedQueryNameAlreadyTakenError(input.name);
    }

    const [renamed] = await this.ctx.repositories.savedQuery.update(
      { id: savedQuery.id },
      { name: input.name }
    );

    return renamed;
  }
}
```

## Resolver

```ts
export const SavedQueryResolver: Resolvers = {
  Mutation: {
    renameSavedQuery: async (_parent, args, ctx) => {
      const uow = new UnitOfWork(ctx.database, ctx.rlsContext);

      const result = await uow.execute(async (_repositories, uowCtx) => {
        const savedQueryRenamer = new SavedQueryRenamer(uowCtx);

        return savedQueryRenamer.execute(args.input);
      });

      return apiResponse(result, 'savedQuery');
    }
  }
};
```

Si requiere sesión, el resolver va como función con nombre y se envuelve con `requireSession` (ver `architecture.md` > Resolvers).

## Errores

De negocio (lo devuelve un use-case y llega al cliente en `apiErrors`), con su `code` tipado con el enum `<Recurso>ErrorCode` de `@/api/codegen` y pasado como primer argumento:

```ts
import type { SavedQueryErrorCode } from '@/api/codegen';

export class SavedQueryNotFoundError extends BusinessError<SavedQueryErrorCode> {
  constructor(id: string) {
    super('SAVED_QUERY_NOT_FOUND', `Saved query not found with id ${id}`);
  }
}
```

De infraestructura (sesión, services), extiende `DbiewerError` directo:

```ts
export class EmailSendFailedError extends DbiewerError {
  constructor(to: string, reason: string) {
    super(`Failed to send email to ${to}: ${reason}`);
  }
}
```

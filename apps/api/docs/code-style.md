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
| Archivos | `<recurso>-<capa>.ts`, con guion y no con punto, así el único punto extra es el de los tests (`<recurso>-<capa>.test.ts`) | `connection-use-case.ts`, `connection-resolver.ts`, `connection-errors.ts`, `connection-repository.ts` |
| Clases | `<Recurso><Capa>` | `ConnectionUseCase`, `ConnectionRepository` |
| Métodos del use-case | verbo de la acción | `create`, `remove`, `testConnection` |
| Adapters de un service | `<adapter>/<adapter>-<rol>.ts`, clase `<Adapter><Rol>` | `resend/resend-sender.ts`, `ResendSender` |
| Templates de email | `<email>-template.tsx` | `magic-link-template.tsx` |
| Schemas | `<Acción><Recurso>Schema` | `CreateConnectionSchema` |
| Error | describe el caso + `Error` | `ConnectionNotFoundError` |

Se mantienen con punto los sufijos que piden las herramientas (`.test.ts`, `.integration.test.ts`, `.e2e.test.ts`, `.gql`, `*.config.ts`) y los fixtures de los tests (`<recurso>.fixtures.ts`, p. ej. `verification.fixtures.ts`).

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
  | `persistence/repositories/verification/` | `verification-repository.ts` | `@/persistence/repositories/verification` |

- Una carpeta que agrupa varias piezas del mismo nivel (`use-cases/`, `api/resolvers/`, `errors/`, `senders/`, `templates/`) no lleva barrel: se importa el archivo (`@/use-cases/magic-link-use-case`). Su `index.ts`, si existe, no reexporta: arma algo (el array de `resolvers`).

## Use-case

```ts
export class SavedQueryUseCase {
  constructor(private readonly savedQueryRepository: SavedQueryRepository) {}

  async rename(input: RenameSavedQueryInput) {
    const savedQuery = await this.savedQueryRepository.findById(input.savedQueryId);

    if (!savedQuery) throw new SavedQueryNotFoundError(input.savedQueryId);
    if (await this.savedQueryRepository.existsByName(input.name)) {
      throw new SavedQueryNameAlreadyTakenError(input.name);
    }

    return this.savedQueryRepository.update(savedQuery.id, { name: input.name });
  }
}
```

## Resolver

```ts
export const SavedQueryResolver: Resolvers = {
  Mutation: {
    renameSavedQuery: async (_parent, args) => {
      const input = RenameSavedQuerySchema.parse(args.input);

      return savedQueryUseCase.rename(input);
    }
  }
};
```

De dónde sale `savedQueryUseCase` se define con el contexto del request.

## Errores

```ts
export class SavedQueryNotFoundError extends DbiewerError {
  constructor(id: string) {
    super(`Saved query not found with id ${id}`);
  }
}
```

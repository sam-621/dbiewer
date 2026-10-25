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

## Formato e imports

- ESLint + Prettier mandan. Correr `yarn lint:fix`; no reordenar imports a mano.
- Grupos de imports (los impone `simple-import-sort`): externos → `@/...` → relativos `../` → relativos `./`.
- `@/` apunta a `src/`. Se usa para cruzar capas; relativos solo dentro de la misma carpeta.
- `import type` para lo que solo es tipo (regla `consistent-type-imports`).
- Argumentos sin usar se prefijan con `_` (`_repositories`).

## Naming

| Qué | Regla | Ejemplo |
|-----|-------|---------|
| Archivos | `<recurso>.<capa>.ts` | `connection.service.ts` |
| Clases | `<Recurso><Capa>` | `ConnectionService`, `ConnectionRepository` |
| Métodos del service | verbo de la acción | `create`, `remove`, `testConnection` |
| Schemas | `<Acción><Recurso>Schema` | `CreateConnectionSchema` |
| Error | describe el caso + `Error` | `ConnectionNotFoundError` |

## Service

```ts
export class SavedQueryService {
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
export const SavedQueryResolver: Resolvers<Context> = {
  Mutation: {
    renameSavedQuery: async (_parent, args, ctx) => {
      const input = RenameSavedQuerySchema.parse(args.input);

      return ctx.services.savedQuery.rename(input);
    }
  }
};
```

## Errores

```ts
export class SavedQueryNotFoundError extends DbiewerError {
  constructor(id: string) {
    super(`Saved query not found with id ${id}`);
  }
}
```

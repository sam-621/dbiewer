# Configuración de cuenta y workspace — especificación técnica

Reglas de negocio y decisiones en `product.md`. La base (Better Auth, `workspace`, contexto con sesión, `me`) está en `features/auth/spec/technical.md`.

## API GraphQL

Se agrega a `src/schema/account.gql`:

```graphql
enum AuthMethod {
  EMAIL
  GITHUB
  GOOGLE
}

extend type User {
  authMethods: [AuthMethod!]!
}

type Mutation {
  renameWorkspace(input: RenameWorkspaceInput!): Workspace!
  deleteAccount(input: DeleteAccountInput!): Boolean!
}

input RenameWorkspaceInput {
  name: String!
}

input DeleteAccountInput {
  emailConfirmation: String!
}
```

- `authMethods` sale de las filas de `account` del usuario. El magic link cuenta como `EMAIL`.
- `renameWorkspace` actualiza el workspace de la sesión. El RLS garantiza que no se pueda tocar otro.
- `deleteAccount` valida que `emailConfirmation` coincida con el email de la sesión (sin distinguir mayúsculas) y que la sesión tenga menos de 24 horas (`freshAge: 60 * 60 * 24` en Better Auth). Después borra el usuario con `auth.api.deleteUser`, y el `ON DELETE CASCADE` se lleva el workspace, las sesiones y las cuentas vinculadas.
- En Better Auth: `user.deleteUser: { enabled: true }`. El endpoint propio de Better Auth no se usa desde el web: el borrado siempre pasa por la mutation.
- El nombre del usuario se cambia con `authClient.updateUser({ name })`. La validación de 1 a 80 caracteres se hace en el web y en `databaseHooks.user.update.before`.

### Capas

| Capa | Archivo |
|------|---------|
| Resolvers | `src/resolvers/account.resolver.ts` |
| Inputs | `src/schemas/account.schemas.ts` (`RenameWorkspaceSchema`, `DeleteAccountSchema`) |
| Services | `AccountService.delete`, `WorkspaceService.rename` |
| Repositorios | `src/repositories/workspace.repository.ts` |
| Errores | `src/errors/account.errors.ts` |

### Errores

| `code` | Cuándo |
|--------|--------|
| `EMAIL_CONFIRMATION_MISMATCH` | `deleteAccount` con un email que no es el de la sesión. |
| `SESSION_NOT_FRESH` | `deleteAccount` con una sesión de más de 24 horas. |
| `INVALID_WORKSPACE_NAME` | Nombre vacío o de más de 60 caracteres (también lo atrapa zod). |

Se registran en el mapper de `src/shared/errors/error-handler.ts`.

## Web

- Rutas `/settings/account` y `/settings/workspace`, dentro de `protect`.
- Hooks en `src/lib/account/hooks/`: `use-update-profile`, `use-rename-workspace`, `use-delete-account`. Después de guardar se refresca `AccountCacheKeys.Me`.
- Formularios con react-hook-form y zod, según `docs/architecture.md`.
- Si `deleteAccount` responde `SESSION_NOT_FRESH`, el web ofrece cerrar sesión para volver a entrar.
- Al borrar la cuenta, se limpia la cache de react-query y se navega a `/login`.

## Impacto en código existente

- `apps/api/src/schema/account.gql`, `account.resolver.ts`, `account.service.ts` y `workspace.service.ts`: se agregan las mutations y `authMethods`.
- `apps/api/src/shared/auth/auth.ts`: `deleteUser`, `freshAge` y el hook de validación del nombre.
- Menú de usuario del layout: links a configuración.
- `apps/web/src/app/app.tsx`: rutas nuevas.
- Locales `en.json` y `es.json`.

## Tests

- **api, e2e** (`tests/account/rename-workspace/`, `tests/account/delete-account/`): renombrar con un nombre válido, vacío y largo; borrar ok, con un email que no coincide y con una sesión no fresca; y que después de borrar no queda ni el workspace ni la sesión.
- **api, unit:** comparación del email de confirmación.
- **web, e2e** (`e2e/account/settings.spec.ts`): cambiar el nombre, renombrar el workspace y borrar la cuenta.

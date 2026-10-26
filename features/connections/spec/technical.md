# Conexiones — especificación técnica

Reglas de negocio y decisiones en `product.md`.

## Cifrado (api)

- Clase `EncryptionService` en `src/services/encryption/encryption-service.ts`, sin interface ni adapters, con `encrypt(plaintext, associatedData): string` y `decrypt(ciphertext, associatedData): string` sobre `node:crypto`. Se instancia en `createAppContext` y queda en `appContext.services.encryptionService`.
- AES-256-GCM, IV aleatorio de 12 bytes por cada cifrado y tag de 16 bytes.
- Formato guardado: `v1:<iv>:<authTag>:<ciphertext>`, cada parte en base64. `v1` identifica la llave y el algoritmo.
- `associatedData` es el `id` de la conexión. El use-case genera el `id` con `crypto.randomUUID()` antes de cifrar e insertar.
- Si el valor no tiene el formato, la versión no se conoce o el tag no coincide, `decrypt` lanza `SecretDecryptionFailedError` (`src/services/encryption/encryption-errors.ts`). En esta feature nadie descifra fuera de los tests.
- Sin factory ni variable para elegir la implementación: el mismo cifrado corre en todos los ambientes, con su propia llave. Cuando llegue KMS se agregan la interface, los adapters y la factory.

## Config (api)

| Variable | En `config` | Uso |
|----------|-------------|-----|
| `CONNECTIONS_ENCRYPTION_KEY` | `encryption.connectionsKey` | Llave de 32 bytes en base64 para cifrar las contraseñas. Obligatoria. |

- La config valida que decodifique a exactamente 32 bytes.
- Se genera con `openssl rand -base64 32`. Va vacía en `.env.example`; los tests usan una fija en el bloque `env` de `vitest.integration.config.ts` y `vitest.e2e.config.ts`.

## Modelo

| Tabla | Columnas | Notas |
|-------|----------|-------|
| `connection` | `id uuid`, `tenant_id uuid`, `name text`, `host text`, `port integer`, `database text`, `username text`, `password_encrypted text` (nullable), `ssl_mode text`, `created_at`, `updated_at` | Tenant con RLS. |

- `tenant_id` con el default, la FK a `workspace(id)` `ON DELETE CASCADE`, la policy `connection_tenant_isolation`, `ENABLE` y `FORCE` de `database.md`.
- Índice único `connection_tenant_id_name_idx` sobre `(tenant_id, lower(name))`.
- `ssl_mode` guarda `disable`, `require` o `verify-full`.
- Sin `deleted_at`: el borrado es definitivo.
- Migraciones: `0003_create_connection` (generada) y `0004_connection_rls` (custom, con el `FORCE`).

## API GraphQL

`src/api/schema/connection.gql`:

```graphql
enum ConnectionSslMode {
  DISABLE
  REQUIRE
  VERIFY_FULL
}

type Connection {
  id: ID!
  name: String!
  host: String!
  port: Int!
  database: String!
  username: String!
  hasPassword: Boolean!
  sslMode: ConnectionSslMode!
}

type ConnectionList {
  items: [Connection!]!
}

type Query {
  connections: ConnectionList!
  connection(id: ID!): Connection
}

input CreateConnectionInput {
  name: String!
  host: String!
  port: Int!
  database: String!
  username: String!
  password: String
  sslMode: ConnectionSslMode!
}

input UpdateConnectionInput {
  id: ID!
  name: String!
  host: String!
  port: Int!
  database: String!
  username: String!
  password: String
  sslMode: ConnectionSslMode!
}

type ConnectionResult {
  apiErrors: [ConnectionErrorResult!]!
  connection: Connection
}

type RemoveConnectionResult {
  apiErrors: [ConnectionErrorResult!]!
  success: Boolean
}

type ConnectionErrorResult {
  code: ConnectionErrorCode!
  message: String!
}

enum ConnectionErrorCode {
  CONNECTION_NAME_REQUIRED
  CONNECTION_NAME_TOO_LONG
  CONNECTION_NAME_ALREADY_EXISTS
  CONNECTION_HOST_REQUIRED
  CONNECTION_PORT_INVALID
  CONNECTION_DATABASE_REQUIRED
  CONNECTION_USERNAME_REQUIRED
  CONNECTION_NOT_FOUND
}

type Mutation {
  createConnection(input: CreateConnectionInput!): ConnectionResult!
  updateConnection(input: UpdateConnectionInput!): ConnectionResult!
  removeConnection(id: ID!): RemoveConnectionResult!
}
```

- Todo requiere sesión con workspace (`requireSession`) y corre en un `UnitOfWork` con el tenant del workspace. Nadie filtra por tenant a mano.
- `connections` devuelve las del workspace ordenadas por `created_at desc, id`. Sin paginación.
- `connection(id)` devuelve `null` si no existe o es de otro workspace.
- `hasPassword` es `password_encrypted IS NOT NULL`. El tipo `Connection` no expone la contraseña.
- `ConnectionSslMode` se traduce a `disable`/`require`/`verify-full` con un enum resolver y `enumValues` en `codegen.ts`.
- `createConnection` y `updateConnection` recortan nombre, host, base y usuario y validan según `product.md`. Una contraseña vacía (`""`) cuenta como sin contraseña.
- `updateConnection` con `password` `null` o ausente mantiene `password_encrypted`. Con valor, lo vuelve a cifrar con el mismo `id` como dato asociado.
- `updateConnection` y `removeConnection` devuelven `CONNECTION_NOT_FOUND` si la conexión no existe o es de otro workspace.
- `CONNECTION_NAME_ALREADY_EXISTS` lo verifica el use-case antes de escribir; el índice único cubre el resto.

### Capas

| Capa | Archivo |
|------|---------|
| Schema | `src/api/schema/connection.gql` |
| Resolvers | `src/api/resolvers/connection-resolver.ts` |
| Use-cases | `src/modules/connection/use-cases/`: `connection-creator.ts`, `connection-updater.ts`, `connection-remover.ts`. Las queries `connections` y `connection` no llevan use-case: el resolver llama a `findAll()` y `findOne({ id })` del repositorio |
| Validación compartida | `src/modules/connection/connection-validator.ts`, la usan el creator y el updater |
| Errores | `src/modules/connection/connection-errors.ts`, `src/services/encryption/encryption-errors.ts` |
| Services | `src/services/encryption/` |
| Repositorios | `src/persistence/repositories/connection/` |

## Web

- **Módulo:** `src/lib/connection/` con `pages/` (`new-connection-page.tsx`), `components/` (`connections-empty/`, `connection-form/` con `use-connection-form.ts`, `connections-dev-list/`), `hooks/` (`use-get-connections`, `use-create-connection`, `use-remove-connection`), `constants/cache-keys.ts` y `utils/connection-url.utils.ts`.
- **Operations:** `src/lib/api/operations/connection.operations.ts` con `COMMON_CONNECTION_FRAGMENT`, `GET_CONNECTIONS_QUERY`, `CREATE_CONNECTION_MUTATION` y `REMOVE_CONNECTION_MUTATION`.
- **Errores:** `src/lib/api/errors/connection.errors.ts` con `getConnectionError(code)`.
- **URL:** `parseConnectionUrl(url)` acepta `postgres://` y `postgresql://` y devuelve los campos que encuentra (usuario, contraseña, host, puerto, base y `sslmode` del query string, decodificados). Si la URL no es válida, devuelve `null`.
- **Rutas:** `/connections/new` dentro de `Protect`. `WorkspacePage` en `/` muestra el estado vacío si `connections` está vacío y el listado temporal si no.
- Después de `createConnection` y `removeConnection` se refresca `ConnectionCacheKeys.Connections`.

## Impacto en código existente

- `apps/api/src/config/config.ts`: variable `CONNECTIONS_ENCRYPTION_KEY`.
- `apps/api/src/context/app-context.ts`: `services.encryptionService`.
- `apps/api/src/persistence/repositories/build-repositories.ts`: repositorio `connection`.
- `apps/api/.env.example`, `vitest.integration.config.ts` y `vitest.e2e.config.ts`: la variable nueva.
- `apps/api/src/errors/email-errors.ts` pasa a `src/services/emails/email-errors.ts`: los errores de un service viven en su carpeta.
- `apps/api/docs/`: `architecture.md` describe el esquema de cifrado, el service sin proveedor externo y los errores dentro del service; `code-style.md`, `testing.md` y `commands.md` suman `EncryptionService` y la variable.
- `apps/web/src/lib/workspace/pages/workspace-page.tsx`: muestra el estado vacío o el listado temporal.
- `apps/web/src/app/app.tsx`: ruta `/connections/new`.
- Locales `en.json` y `es.json`: textos del estado vacío, el formulario y el listado.

## Tests

- **api, unit:** `EncryptionService`: ida y vuelta, IV distinto en cada cifrado, falla con otro dato asociado, con el valor alterado y con una versión desconocida. `ConnectionValidator`.
- **api, integración:** `ConnectionRepository` contra la DB, incluido el índice único por nombre.
- **api, e2e** (`tests/connection/<operación>/`): cada query y mutation, sus errores de negocio, que la contraseña queda cifrada en la tabla y nunca sale en la respuesta, que `updateConnection` sin contraseña la mantiene, aislamiento entre workspaces y `UNAUTHENTICATED`.
- **web, unit:** `parseConnectionUrl`, la página de nueva conexión (pegar URL, validaciones, errores de la api) y `WorkspacePage` con y sin conexiones, con el fetcher mockeado.

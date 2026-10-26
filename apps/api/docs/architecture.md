<!--- cSpell:disable --->

# Arquitectura

Capas clásicas, organizadas por tipo de pieza. Sin módulos ni capa de dominio. La API es GraphQL con GraphQL Yoga sobre Express.

## Capas

```
src/api/schema      los .gql del schema de GraphQL
        │
        ▼
src/api/resolvers   llaman al use-case (o al repositorio, si la query solo lee) y responden
        │
        ▼
src/modules/<modulo>/use-cases   reglas de negocio ──► src/services   servicios externos
        │                                                     (email, billing, storage...)
        ▼
src/persistence/repositories   acceso a datos
```

- Cada capa solo llama a la de abajo. Un resolver nunca llama a un service, ni a un repositorio salvo en una query que solo lee (ver "Resolvers"); un use-case nunca toca el contexto de GraphQL ni `req`/`res`.
- Los use-cases son los únicos que usan services. Un service no llama a use-cases ni a repositorios.
- Lo compartido va en `src/shared/` (`errors/`, `middlewares/`, `utils/`).

## Estructura

```
src/
├── api/                               todo lo de GraphQL
│   ├── schema/<recurso>.gql
│   ├── resolvers/<recurso>-resolver.ts
│   ├── middlewares/<nombre>/          middlewares de GraphQL que envuelven al resolver (requireSession)
│   ├── plugins/<nombre>.ts            plugins de Yoga (useErrorLogger)
│   ├── utils/api-response.ts          apiResponse: arma el payload { apiErrors, <key> } de las mutations
│   └── codegen.ts                     tipos generados por `yarn gen:types`, no se edita
├── modules/<modulo>/                 un módulo por dominio (workspace, connection...): use-cases/, <modulo>-schemas.ts y <modulo>-errors.ts
│   ├── use-cases/<caso-de-uso>.ts    un archivo por caso de uso; si tiene test, va en use-cases/<caso-de-uso>/ con su test e index.ts
│   └── <modulo>-errors.ts            errores de negocio del módulo
├── persistence/
│   ├── schema/                        schema de Drizzle
│   ├── unit-of-work/                  UnitOfWork (ver "Unit of work y RLS")
│   ├── rls.ts                         RLSContext, enableRLS, disableRLS, runWithoutRLS
│   └── repositories/<recurso>/        una carpeta por repositorio
│       ├── <recurso>-repository.ts
│       ├── __tests__/                 <recurso>-repository.integration.test.ts y fixtures/
│       └── index.ts                   reexporta, se importa como @/persistence/repositories/<recurso>
│   └── repositories/build-repositories.ts   arma todos los repositorios sobre una transacción
├── services/<servicio>/               servicios externos (ver "Services (externos)"); sus errores en <servicio>-errors.ts
├── errors/<recurso>-errors.ts        errores que no son de un módulo ni de un service (sesión)
├── config/                            config.ts: valida las variables de entorno y las mapea a un objeto (ver "Config"); index.ts lo reexporta (@/config)
└── shared/
```

Un archivo por recurso en cada capa (`connection-resolver.ts`, `connection-use-case.ts`, `connection-repository.ts`). Si un archivo crece demasiado, se parte por acción dentro de una carpeta del recurso.

## HTTP

`createApp(appContext)` (`src/app.ts`) arma Express y monta las rutas en este orden:

- `/api/auth/*splat`: `cors({ origin: config.webUrl, credentials: true })` y después `toNodeHandler(auth)`, sin `express.json()` delante. Con `app.all`, así el preflight `OPTIONS` pasa por `cors`.
- `/graphql`: Yoga, con su opción `cors: { origin: config.webUrl, credentials: true }`. No se usa el paquete `cors` ahí. Lleva `logging: false` y sus plugins en `plugins` (`useErrorLogger`).

La web llama directo a la api con credenciales (sin proxy): CORS solo acepta `WEB_URL`. Un middleware HTTP nuevo se monta en `createApp`, delante de la ruta que lo necesita.

## Resolvers

- Usan `args.input` tal como llega, con el tipo del codegen. No lo validan con zod ni lo transforman.
- Llaman a un solo método del use-case y responden. Sin `if` de negocio. De dónde sale el use-case se define con el contexto del request.
- Excepción: si lo que se devuelve ya está en el contexto del request (como la sesión), el resolver lo devuelve directo, sin use-case ni `UnitOfWork`. Por ejemplo, `me` devuelve `ctx.session`, o `null` si no hay sesión, y por eso no va envuelto en `requireSession`.
- Excepción: una query que solo lee, sin reglas de negocio, no lleva use-case. El resolver abre el `UnitOfWork` y llama directo al repositorio (`uow.execute(repositories => repositories.connection.findAll())`). Si la lectura necesita una regla, va a un use-case.
- Un enum de GraphQL cuyos valores se guardan distinto en la DB (`VERIFY_FULL` y `verify-full`) se traduce con un enum resolver en el `Resolvers` del recurso (`ConnectionSslMode: { VERIFY_FULL: 'verify-full', ... }`) y los mismos valores en `enumValues` de `codegen.ts`, así el tipo generado usa los de la DB. Nunca se traduce a mano en el resolver.
- Los tipos de args y resultados salen de `src/api/codegen.ts`, que `yarn gen:types` genera a partir de los `.gql`.
- Una mutation que puede fallar por una regla de negocio sigue estos pasos, cada uno con su variable: instancia el `UnitOfWork`, guarda en `result` lo que devuelve el use-case dentro del work y responde con `apiResponse(result, '<key>')` (`src/api/utils/api-response.ts`), donde `<key>` es el campo del recurso en el `<Recurso>Result`:

  ```ts
  async function createWorkspace(
    _parent: unknown,
    args: MutationCreateWorkspaceArgs,
    ctx: SessionContext
  ) {
    const uow = new UnitOfWork(ctx.database, ctx.rlsContext);

    const result = await uow.execute(async (_repositories, uowCtx) => {
      const workspaceForUserCreator = new WorkspaceForUserCreator(uowCtx);

      return workspaceForUserCreator.execute({ ownerUserId: ctx.session.user.id, name: args.input.name });
    });

    return apiResponse(result, 'workspace');
  }

  export const AccountResolver: Resolvers = {
    Mutation: {
      createWorkspace: requireSession(createWorkspace)
    }
  };
  ```

- Un resolver que requiere sesión se declara como función con nombre arriba del archivo, y el objeto de resolvers solo lo mapea envuelto en el middleware: `createWorkspace: requireSession(createWorkspace)`. El resolver no llama a `requireSession` por dentro.
- Los middlewares de GraphQL (`src/api/middlewares/<nombre>/`) son high-order functions: reciben el resolver y devuelven otro con la misma firma que valida primero y después lo llama. No devuelven nada propio. `requireSession` lanza `UnauthenticatedError` si no hay sesión y le pasa al resolver el ctx como `SessionContext` (exportado desde `@/api/middlewares/require-session`), con `session` no nula.

- `apiResponse` devuelve `{ apiErrors: [{ code, message }], <key>: null }` si `result` es un `BusinessError`, y `{ apiErrors: [], <key>: result }` si no. Es la forma de la respuesta de red: no lleva más tipos que esos.
- Su `.gql` devuelve `<Recurso>Result!` con `apiErrors: [<Recurso>ErrorResult!]!` y el recurso nullable; `<Recurso>ErrorResult` tiene `code: <Recurso>ErrorCode!` y `message: String!`, y el enum `<Recurso>ErrorCode` lista los `code` de los errores de negocio que puede devolver:

  ```graphql
  type Mutation {
    createWorkspace(input: CreateWorkspaceInput!): WorkspaceResult!
  }

  type WorkspaceResult {
    apiErrors: [WorkspaceErrorResult!]!
    workspace: Workspace
  }

  type WorkspaceErrorResult {
    code: WorkspaceErrorCode!
    message: String!
  }

  enum WorkspaceErrorCode {
    WORKSPACE_ALREADY_EXISTS
  }
  ```

## Use-cases

- Una clase por caso de uso, con un solo método `execute` (`WorkspaceForUserCreator.execute`). Naming en `code-style.md` > Naming.
- Extienden `UseCase` (`src/shared/use-case.ts`) con su schema zod (`super(CreateConnectionSchema)`) y escriben su lógica en `run(input)`. `execute` recibe el input crudo, lo valida con el schema y, si falla, devuelve `InvalidInputError` sin llamar a `run`; si pasa, llama a `run` con el input ya parseado (recortado, con defaults).
- Los schemas van en `modules/<modulo>/<modulo>-schemas.ts`. Validan solo forma (obligatorios, largos, rangos); las reglas que necesitan la DB (nombre repetido, no existe) siguen en `run` con su error propio.
- Reciben por constructor el `UowContext` completo, no solo lo que usan (ver "Unit of work y RLS").
- Las reglas de negocio viven aquí. Si una regla la usan varios use-cases, se mueve a `src/shared/` o a un use-case propio.
- No saben de RLS ni de transacciones: eso lo manejan el `UnitOfWork` y los repositorios.
- Se instancian donde se usan, con lo que necesitan del app context (ver "App context"). No hay un registro de use-cases.

## Services (externos)

Un service es una capa de abstracción sobre un proveedor externo: emails (Resend), autenticación (Better Auth, `services/auth/`), logs (`services/logger/`, hoy winston a consola; más adelante un proveedor de logs. `createLogger(context)` devuelve un `Logger` con `info`, `warn` y `error(message, error?, meta?)`, que pasa el error por `formatError` (`message`, `name`, `cause`, `stack`) para que salga completo también en el JSON de producción; el formato inline imprime su stack), billing, almacenamiento de archivos (S3), etc. Permite cambiar de proveedor, o usar uno falso en desarrollo y tests, sin tocar los use-cases.

Un service sin proveedor externo (cifrado, `services/encryption/`) es una sola clase (`EncryptionService`), sin interface, adapters ni factory: corre igual en todos los ambientes. Se instancia en `createAppContext` con su parte de la config y queda en `appContext.services`. Lo demás de esta sección aplica igual.

- **Sin reglas de negocio.** Un service hace lo que le piden contra el proveedor y nada más; qué mandar, a quién y cuándo lo decide el use-case.
- Lo usan solo los use-cases, que reciben la interface por constructor. Nunca un resolver ni un repositorio. Excepción: el logger, que se puede usar desde cualquier capa.
- Si la carpeta del service lleva el nombre de su archivo principal (`services/auth/auth.ts`), tiene un `index.ts` que lo reexporta y se importa como `@/services/auth`. Lo mismo para cada adapter dentro de su carpeta. Ver `code-style.md` > Carpetas e `index.ts`.
- Si el proveedor falla o la entrada no es válida, el service lanza un error de `services/<servicio>/<servicio>-errors.ts` con el motivo; no lo ignora.

Estructura, con `emails` como ejemplo:

```
src/services/emails/
├── senders/
│   ├── email-sender.ts              interface EmailSender, tipos (EmailData) y factory getEmailSender(config)
│   ├── resend/                      un adapter por proveedor, cada uno en su carpeta
│   │   ├── resend-sender.ts
│   │   └── index.ts
│   ├── console/                     desarrollo: escribe en el log lo necesario para usar el email
│   └── dummy/                       tests: no hace nada
├── email-errors.ts                  EmailSendFailedError
├── templates/
│   ├── <email>-template.tsx         react-email: componente, PreviewProps, export default y create<Email>Email(input)
│   └── _shared/                     componentes compartidos entre templates (con `_` para que el preview de React Email no la muestre)
└── locales/                         textos y asuntos por locale (`en`, `es`)
```

- **Una interface** con los métodos que usan los use-cases (`EmailSender.send`), sin tipos del proveedor.
- **Un adapter por proveedor**, en `<adapter>/<adapter>-<rol>.ts` con su `index.ts`. Siempre hay uno para desarrollo (consola o local) y uno para tests (dummy), para no depender del proveedor real fuera de producción.
- **Una factory** (`get<Rol>(config)`) que elige el adapter según una variable de entorno (`EMAIL_SENDER`), no según `NODE_ENV`. La factory recibe su parte de la config (`getEmailSender(config.emailSender)`), y `src/config/` exige las credenciales del adapter elegido.
- La factory se llama una sola vez, en `createAppContext`, y el service queda en `appContext.services`. De ahí se pasa al constructor del use-case.
- Templates y locales van dentro del service solo si el proveedor los necesita (emails sí; storage no). El use-case arma el contenido con el template y el locale y se lo pasa al service ya listo.

## App context

Hay dos contextos:

- **App context** (`src/context/app-context.ts`, se importa desde `@/context`): lo que vive mientras vive la app. Se arma una sola vez con `createAppContext(databases)` en `src/index.ts` (y en `TestServer`) y se pasa a `createApp(appContext)`, que se lo da a quien lo necesite (`createAuth(appContext)`, el contexto de GraphQL).
- **Contexto del request** (GraphQL): lo de cada request (sesión, conexión con el tenant). Todavía no existe: Yoga corre sin `context` y se agrega cuando lleguen los resolvers con sesión.

El app context lleva, ya instanciados:

| Clave | Qué |
|-------|-----|
| `databases` | `app` (`DATABASE_URL`, con RLS) y `admin` (`ADMIN_DATABASE_URL`, se salta RLS). |
| `services` | Los services externos (`emailSender`). Su factory se llama aquí. |
| `repositories` | Los repositorios (`magicLinkRequest`, `verification`), cada uno con la conexión que le corresponde. |

- **Los use-cases no van en el app context.** Se instancian donde se usan, con lo que sacan del app context: `new MagicLinkUseCase(appContext.repositories.magicLinkRequest, appContext.repositories.verification, appContext.services.emailSender, ...)`.
- Un service, repositorio o conexión nuevo se agrega al tipo `AppContext` y a `createAppContext`.

## Unit of work y RLS

Todo proceso que toca la DB propia corre dentro de un `UnitOfWork` (`src/persistence/unit-of-work/`), que lo aísla en una transacción con el RLS aplicado.

- `new UnitOfWork(database, rlsContext?)`. `database` es la conexión `app`. `rlsContext` (`RLSContext = { tenantId }`) dice qué tenant aplicar. Siempre abre su propia transacción: no recibe una externa.
- `execute(work)`:
  1. Abre la transacción.
  2. Aplica el RLS con `enableRLS` (`app.bypass_rls = 'off'` y `app.current_tenant_id`).
  3. Crea el `RepositoryRLS` y arma los repositorios sobre esa transacción con `buildRepositories(trx, rls)`.
  4. Llama a `work(repositories, uowContext)`.
  5. Hace commit, o rollback si `work` lanza. El error original nunca se tapa con el del rollback.
- `UowContext = { repositories, trx, runWithoutRLS, rlsContext }`.
- Quien llama (el resolver) instancia el `UnitOfWork` y, dentro del callback, instancia el use-case con el `UowContext`, lo ejecuta y devuelve el resultado:

  ```ts
  new UnitOfWork(ctx.database, ctx.rlsContext).execute((_repositories, uow) =>
    new WorkspaceForUserCreator(uow).execute(user)
  );
  ```

- Una lectura de infraestructura que no es un caso de uso (p. ej. buscar el workspace al resolver la sesión) usa directo los repositorios del callback, sin use-case.

### `rls.ts`

- `enableRLS(trx, rlsContext)` y `disableRLS(trx)` cambian `app.current_tenant_id` y `app.bypass_rls` con `set_config(..., true)`, así duran solo lo que dura la transacción.
- `runWithoutRLS(trx, rlsContext)(fn)` desactiva el RLS, corre `fn` y lo vuelve a activar en un `finally`.
- La policy de una tabla deja pasar la fila si `app.bypass_rls = 'on'`.

### `build-repositories.ts`

- `buildRepositories(trx, rls)` solo arma los repositorios con la transacción y el `RepositoryRLS` (`{ context, runWithoutRLS }`). El `RepositoryRLS` lo crea el `UnitOfWork`, que reutiliza ese mismo `runWithoutRLS` en el `UowContext`.
- Un repositorio nuevo se agrega aquí.

## Config

- `src/config/config.ts` valida `process.env` con zod y lo mapea a un objeto en camelCase, agrupado por tema: `config.port`, `config.database.url`, `config.auth.secret`, `config.emailSender.adapter`, `config.emailSender.resend.apiKey`. Nadie más lee `process.env` ni usa los nombres en mayúsculas.
- Cada service tiene su grupo (`emailSender`, más adelante `billing`, `assetStorage`), con `adapter` y una clave por proveedor con sus credenciales. Su tipo se exporta desde `@/config` (`EmailSenderConfig = Config['emailSender']`). Un service sin proveedor externo no lleva `adapter`: su grupo tiene solo lo que usa (`encryption.connectionsKey`).
- **La config solo valida forma y presencia**: que estén las variables que se necesitan, con el tipo correcto, y las credenciales del adapter elegido. Nada de reglas por ambiente (p. ej. "en production solo `resend`"): cada ambiente se configura con lo que quiera, pero tiene que configurarlo. Por eso ninguna variable tiene default.

## Repositorios

- Una clase por tabla o agregado de tablas. Solo queries, sin reglas (p. ej. nada de "buscar o crear": eso es del use-case).
- Reciben siempre la transacción y el `RepositoryRLS` (`constructor(trx, rls)`), nunca la conexión.
- Si una consulta tiene que correr sin tenant, el repositorio la envuelve en `this.rls.runWithoutRLS`. El use-case no sabe de RLS.
- Devuelven tipos planos de la tabla.
- Extienden `Repository` (`src/persistence/repositories/repository/`), cuyos métodos son públicos (`findMany`, `findOne`, `insert`, `update`, `remove`) y se usan directo desde el use-case. El repositorio no los envuelve (nada de `findById` o `create` que solo los llamen): agrega solo lo que el base no resuelve, como orden, `lower()` o `runWithoutRLS`.

## Bases de datos del usuario

- Hay dos tipos de base de datos: la propia de la api (usuarios, conexiones, queries guardadas, historial; ver `database.md`) y las del usuario, a las que la api se conecta para ejecutar queries y leer su esquema.
- Motor soportado al inicio: Postgres. Cómo se abstrae un motor para agregar otros: por definir.
- De las credenciales de las conexiones solo se cifra la contraseña, con `EncryptionService`: AES-256-GCM (`node:crypto`), IV aleatorio de 12 bytes, tag de 16 y la llave de `CONNECTIONS_ENCRYPTION_KEY`. Se guarda como `v1:<iv>:<authTag>:<ciphertext>` en base64; el prefijo de versión permite rotar la llave o pasar a KMS sin romper lo guardado. El `id` de la conexión va como dato asociado, así el valor no se descifra en otra fila.

## Errores

- Todo error propio extiende `DbiewerError` (`src/shared/errors/dbiewer-error.ts`). Los de negocio viven en `modules/<modulo>/<modulo>-errors.ts`; los de un service, en `services/<servicio>/<servicio>-errors.ts`; los demás de infraestructura, en `errors/<recurso>-errors.ts`. El mensaje incluye los valores que lo causaron.
- Hay dos tipos:
  - **Errores de negocio**: los que devuelve un use-case por una regla (`WorkspaceAlreadyExistsError`). Extienden `BusinessError` (`src/shared/errors/business-error.ts`) y llevan su `code` en SCREAMING_SNAKE_CASE (`WORKSPACE_ALREADY_EXISTS`), tipado con el enum `<Recurso>ErrorCode` de `@/api/codegen` (`BusinessError<WorkspaceErrorCode>`). Sin mapper: el error ya trae lo que necesita la API.
  - **Input inválido**: los errores de forma no llevan un código por campo. `UseCase.execute` devuelve `InvalidInputError` (`src/shared/errors/invalid-input-error.ts`, código `INVALID_INPUT`) con el mensaje de `z.prettifyError`, que dice qué campo falló. Cada `<Recurso>ErrorCode` cuyo use-case valida input incluye `INVALID_INPUT`.
  - **Errores de infraestructura**: sesión (`UnauthenticatedError`, lo lanza el middleware `requireSession` que envuelve al resolver) y services (`EmailSendFailedError`, `SecretDecryptionFailedError`). Extienden `DbiewerError` directo y se lanzan.
- Los use-cases **devuelven** el error de negocio, no lo lanzan: es parte de su tipo de retorno (`Promise<Workspace | WorkspaceAlreadyExistsError>`). El resolver lo pasa a `apiResponse` (ver "Resolvers") y llega al cliente en `apiErrors` del payload con su `code` y `message`.
- Como el error se devuelve, el `UnitOfWork` hace commit: el use-case verifica sus reglas y devuelve el error antes de escribir.
- Lo que no es de negocio sale como error de GraphQL por el handler de Yoga (`src/shared/errors/error-handler.ts`): mapea los `DbiewerError` registrados en `ERROR_CODES` a `extensions: { code }` con su mensaje (hoy `UNAUTHENTICATED`). Lo demás responde un error genérico sin detalles (`Unexpected error.`, `INTERNAL_SERVER_ERROR`) en todos los ambientes: nunca sale `originalError`, stack ni causa.
- El plugin `useErrorLogger` (`src/api/plugins/use-error-logger.ts`) loguea con `logger.error` cada error de la respuesta cuyo `originalError` sea un `DbiewerError` o un `Error`, con la ruta y el `path` y `code` de GraphQL. Los `GraphQLError` (validación de la query del cliente) no se loguean. Corre antes del enmascarado, así ve el error original.
- Un error de negocio nuevo no se registra en el handler: su `code` se agrega primero al enum `<Recurso>ErrorCode` del `.gql`, se corre `yarn gen:types` y después se crea la clase.

## Multi-tenant

- Cada tabla con `tenant_id` tiene RLS en Postgres que lee `app.current_tenant_id`.
- El middleware de auth abre la conexión del request a la DB propia con `set_config('app.current_tenant_id', ...)`. Ningún use-case filtra por tenant a mano.
- `ADMIN_DATABASE_URL` se salta RLS. La usan los tests, los scripts y, en runtime, solo Better Auth y la creación del workspace (todavía no hay tenant en el contexto).
- Las conexiones (`app` con `DATABASE_URL`, `admin` con `ADMIN_DATABASE_URL`) se crean en `src/index.ts` (y en `TestServer`) y entran al app context (`appContext.databases`). Ningún módulo abre su propia conexión al importarse.
- Sus pools se cierran en el shutdown de `src/index.ts` (`SIGINT`/`SIGTERM`) y en `TestServer.teardown()`.

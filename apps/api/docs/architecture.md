<!--- cSpell:disable --->

# Arquitectura

Capas clásicas, organizadas por tipo de pieza. Sin módulos ni capa de dominio. La API es GraphQL con GraphQL Yoga sobre Express.

## Capas

```
src/api/schema      los .gql del schema de GraphQL
        │
        ▼
src/api/resolvers   validan el input, llaman al use-case, responden
        │
        ▼
src/use-cases       reglas de negocio ──────────► src/services   servicios externos
        │                                                     (email, billing, storage...)
        ▼
src/persistence/repositories   acceso a datos
```

- Cada capa solo llama a la de abajo. Un resolver nunca llama a un repositorio ni a un service; un use-case nunca toca el contexto de GraphQL ni `req`/`res`.
- Los use-cases son los únicos que usan services. Un service no llama a use-cases ni a repositorios.
- Lo compartido va en `src/shared/` (`errors/`, `middlewares/`, `utils/`).

## Estructura

```
src/
├── api/                               todo lo de GraphQL
│   ├── schema/<recurso>.gql
│   ├── resolvers/<recurso>-resolver.ts
│   └── codegen.ts                     tipos generados por `yarn gen:types`, no se edita
├── use-cases/<recurso>-use-case.ts
├── persistence/
│   ├── schema/                        schema de Drizzle
│   └── repositories/<recurso>/        una carpeta por repositorio
│       ├── <recurso>-repository.ts
│       ├── <recurso>-repository.test.ts
│       └── index.ts                   reexporta, se importa como @/persistence/repositories/<recurso>
├── services/<servicio>/               servicios externos (ver "Services (externos)")
├── schemas/<recurso>-schemas.ts       schemas de zod del input
├── errors/<recurso>-errors.ts
├── config/                            config.ts: valida las variables de entorno y las mapea a un objeto (ver "Config"); index.ts lo reexporta (@/config)
└── shared/
```

Un archivo por recurso en cada capa (`connection-resolver.ts`, `connection-use-case.ts`, `connection-repository.ts`). Si un archivo crece demasiado, se parte por acción dentro de una carpeta del recurso.

## Resolvers

- Validan el input con el schema de `schemas/` (`CreateConnectionSchema.parse(args.input)`); si falla, el error se responde con los issues.
- Llaman a un solo método del use-case (`ctx.useCases.<recurso>`) y responden. Sin `if` de negocio.
- Los tipos de args y resultados salen de `src/api/codegen.ts`, que `yarn gen:types` genera a partir de los `.gql`.

## Use-cases

- Una clase por recurso con un método por acción (`ConnectionUseCase.create`, `QueryUseCase.run`).
- Reciben por constructor sus repositorios y los services externos que usen.
- Las reglas de negocio viven aquí. Si una regla la usan varios use-cases, se mueve a `src/shared/` o a un use-case propio.
- Si una acción escribe en varias tablas, abre una transacción y la pasa a los repositorios.
- `createUseCases(db)` (`src/use-cases/index.ts`) los arma por request y quedan en el contexto de GraphQL como `useCases`.

## Services (externos)

Un service es una capa de abstracción sobre un proveedor externo: emails (Resend), autenticación (Better Auth, `services/auth/`), logs (`services/logger/`, hoy winston a consola; más adelante un proveedor de logs), billing, almacenamiento de archivos (S3), etc. Permite cambiar de proveedor, o usar uno falso en desarrollo y tests, sin tocar los use-cases.

- **Sin reglas de negocio.** Un service hace lo que le piden contra el proveedor y nada más; qué mandar, a quién y cuándo lo decide el use-case.
- Lo usan solo los use-cases, que reciben la interface por constructor. Nunca un resolver ni un repositorio. Excepción: el logger, que se puede usar desde cualquier capa.
- Si la carpeta del service lleva el nombre de su archivo principal (`services/auth/auth.ts`), tiene un `index.ts` que lo reexporta y se importa como `@/services/auth`. Lo mismo para cada adapter dentro de su carpeta. Ver `code-style.md` > Carpetas e `index.ts`.
- Si el proveedor falla, el adapter lanza un error de `errors/<servicio>-errors.ts` con el motivo; no lo ignora.

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
├── templates/
│   ├── <email>-template.tsx         react-email: componente, PreviewProps, export default y create<Email>Email(input)
│   └── shared/                      componentes compartidos entre templates
└── locales/                         textos y asuntos por locale (`en`, `es`)
```

- **Una interface** con los métodos que usan los use-cases (`EmailSender.send`), sin tipos del proveedor.
- **Un adapter por proveedor**, en `<adapter>/<adapter>-<rol>.ts` con su `index.ts`. Siempre hay uno para desarrollo (consola o local) y uno para tests (dummy), para no depender del proveedor real fuera de producción.
- **Una factory** (`get<Rol>(config)`) que elige el adapter según una variable de entorno (`EMAIL_SENDER`), no según `NODE_ENV`. La factory recibe su parte de la config (`getEmailSender(config.emailSender)`), y `src/config/` exige las credenciales del adapter elegido.
- La factory se llama en el wiring (`src/app.ts`, `src/services/auth/auth.ts`) y el resultado se pasa al constructor del use-case.
- Templates y locales van dentro del service solo si el proveedor los necesita (emails sí; storage no). El use-case arma el contenido con el template y el locale y se lo pasa al service ya listo.

## Config

- `src/config/config.ts` valida `process.env` con zod y lo mapea a un objeto en camelCase, agrupado por tema: `config.port`, `config.database.url`, `config.auth.secret`, `config.emailSender.adapter`, `config.emailSender.resend.apiKey`. Nadie más lee `process.env` ni usa los nombres en mayúsculas.
- Cada service tiene su grupo (`emailSender`, más adelante `billing`, `assetStorage`), con `adapter` y una clave por proveedor con sus credenciales. Su tipo se exporta desde `@/config` (`EmailSenderConfig = Config['emailSender']`).
- **La config solo valida forma y presencia**: que estén las variables que se necesitan, con el tipo correcto, y las credenciales del adapter elegido. Nada de reglas por ambiente (p. ej. "en production solo `resend`"): cada ambiente se configura con lo que quiera, pero tiene que configurarlo. Por eso ninguna variable tiene default.

## Repositorios

- Una clase por tabla o agregado de tablas. Solo queries, sin reglas.
- Devuelven tipos planos de la tabla.

## Bases de datos del usuario

- Hay dos tipos de base de datos: la propia de la api (usuarios, conexiones, queries guardadas, historial; ver `database.md`) y las del usuario, a las que la api se conecta para ejecutar queries y leer su esquema.
- Motor soportado al inicio: Postgres. Cómo se abstrae un motor para agregar otros: por definir.
- Las credenciales de las conexiones se guardan cifradas. Esquema de cifrado: por definir.

## Errores

- Todo error de negocio extiende `DbiewerError` y vive en `errors/<recurso>-errors.ts`. El mensaje incluye los valores que lo causaron.
- Los use-cases **lanzan** el error. Un handler de errores de Yoga (`src/shared/errors/error-handler.ts`) mapea `DbiewerError` a un error de GraphQL con `extensions: { code }` y su mensaje. Lo demás responde un error genérico sin detalles.
- Un error nuevo se registra en el mapper del handler con su `code`.

## Multi-tenant

- Cada tabla con `tenant_id` tiene RLS en Postgres que lee `app.current_tenant_id`.
- El middleware de auth abre la conexión del request a la DB propia con `set_config('app.current_tenant_id', ...)`. Ningún use-case filtra por tenant a mano.
- `ADMIN_DATABASE_URL` se salta RLS. La usan los tests, los scripts y, en runtime, solo Better Auth y la creación del workspace (todavía no hay tenant en el contexto).
- Las conexiones (`db` con `DATABASE_URL`, `adminDb` con `ADMIN_DATABASE_URL`) se crean en `src/index.ts` y se inyectan en `createApp(db, adminDb)`. Ningún módulo abre su propia conexión al importarse.
- Sus pools se cierran en el shutdown de `src/index.ts` (`SIGINT`/`SIGTERM`) y en `TestServer.teardown()`.

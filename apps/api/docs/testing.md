<!--- cSpell:disable --->

# Testing

## Suites

El runner es Vitest. La suite se decide por el sufijo del archivo; un test mal nombrado no lo corre ningún comando.

| Suite | Sufijo | Comando | Docker | Cuándo |
|-------|--------|---------|--------|--------|
| unit | `*.test.ts(x)` | `yarn test` | no | No toca DB ni HTTP |
| integración | `*.int.test.ts` | `yarn test:int` | sí | Prueba una pieza contra la DB o contra un proveedor externo mockeado, sin pasar por HTTP |
| e2e | `*.e2e.test.ts` | `yarn test:e2e` | sí | Pega por HTTP al server |

- Para correr solo una parte: `yarn test:int <ruta>`, `yarn test:e2e <ruta>`, `-t "<nombre>"`.
- `yarn test:int` y `yarn test:e2e` usan el mismo script (`scripts/test-database.sh <config de vitest>`): levantan Postgres en Docker (`docker-compose.test.yml`), migran, corren su config (`vitest.int.config.ts`, `vitest.e2e.config.ts`) y bajan el contenedor. `yarn test` excluye las dos suites.
- **Siempre solo los tests de la feature**, nunca la suite completa.
- **Nunca dos suites de DB a la vez**: integración y e2e corren siempre en procesos separados, una después de la otra. Comparten el mismo docker compose; si la DB de tests ya está levantada, `scripts/test-database.sh` corta con un error en vez de pisarla.
- Los tests con DB se pueden correr sin pedir permiso: usan un Postgres efímero en Docker, no una DB real.

## Ubicación

- **Sin fixtures:** el test va junto al archivo que prueba (`connection-string.ts` → `connection-string.test.ts`).
- **Con fixtures:** el test va en `__tests__/` junto al archivo, con sus fixtures en `__tests__/fixtures/`.
- Los e2e van en `tests/<recurso>/<operación>/`.
- Los de integración van junto al archivo (o en su `__tests__/` si tienen fixtures), dentro de `src/`.

## Qué se prueba y dónde

| Pieza | Test | Ubicación |
|-------|------|-----------|
| Use-case que no se usa desde un resolver (p. ej. `MagicLinkUseCase`, que llama Better Auth) | unit (repositorios y services mockeados) | junto al archivo |
| `UnitOfWork` | unit con la DB mockeada: orden de las sentencias de RLS, commit, rollback y que no se tape el error original | junto al archivo |
| Middleware de GraphQL (`api/middlewares/`) | unit con el context mockeado | junto al archivo |
| Use-case usado desde un resolver | lo cubre el e2e del resolver | `tests/<recurso>/<operación>/` |
| Query o mutation de GraphQL | e2e | `tests/<recurso>/<operación>/` |
| Repositorio | integración contra la DB, con fixtures | `persistence/repositories/<recurso>/__tests__/` |
| Adapter de un service externo | integración con el SDK del proveedor o sus dependencias mockeadas (`resend` con el SDK de Resend mockeado, `console` con un logger falso) | junto al archivo |
| Factory de un service (`getEmailSender`) | integración: que devuelva el adapter que pide la config y falle sin credenciales | junto al archivo |
| Service que se conecta a una base de datos externa (`PostgresService`) | integración contra la DB de test, que hace de base externa | junto al archivo |
| Service sin proveedor externo (`EncryptionService`) | unit | junto al archivo |

No se testean:

- **Auth (Better Auth)**: es configuración de una librería ya probada; lo que importa se cubre con los e2e que usan la sesión y con el test del use-case que llama.
- **Templates de email**: son presentación; se revisan con `yarn emails`, y el use-case comprueba que el email lleve el link.
- **Logger**: envoltorio de winston; `formatError` solo copia los campos del error.
- **Plugins de Yoga** (`api/plugins/`): solo loguean lo que ya trae la respuesta.
- **`shared/`**: utilidades que se cubren a través de quien las usa. Si una tiene lógica propia que no queda cubierta, lleva su unit.
- **Adapters que no hacen nada** (`dummy`).

## Reglas generales

- Orden del archivo: happy path primero, failures después, sin intercalar.
- Cada `test(...)` empieza con `returns`, `does`, `does not` o el verbo real de la acción (`adds`, `removes`, `updates`). Nunca una paráfrasis.
- El objeto bajo prueba sale de la DB con datos de fixtures, nunca de factories in-memory. Excepción: tests unitarios, que construyen el objeto directo.
- Antes de inventar un setup, copiar el del test más parecido que ya exista.
- El `describe` raíz lleva el nombre de la pieza y, si no es obvio por el nombre, qué tipo de pieza es: `requireSession - Middleware`.
- El valor esperado de un `expect` va escrito tal cual (`toBe('Acme')`, `{ code: 'WORKSPACE_ALREADY_EXISTS', message: '...' }`), nunca en una constante o variable del test, para leerlo sin ir a buscarlo. Las constantes (`<X>Constants`) sirven para armar el input o buscar filas, no como valor esperado. Excepciones: los ids de los fixtures, que son UUID aleatorios y se comparan con su constante (`UserConstants.OwnerUserId`), y los valores que genera el sistema y no se conocen de antemano (el pid de Postgres), que se comparan contra la variable donde se leyeron.
- Los e2e verifican solo lo que devuelve el resolver y el efecto en DB, nunca que se llamó a un service (`vi.spyOn`).

## Tests e2e

- Siempre con `TestServer` (`tests/utils/test-server.ts`), que levanta la app y expone el cliente de GraphQL.
- Setup: un solo `new TestServer()` por `describe`; `loadFixtures([...])` en `beforeEach`; `resetDatabase()` en `afterEach`; `destroyDatabase()` + `testServer.teardown()` en `afterAll`.
- La sesión se crea en cada test con `const headers = await testServer.signIn(email)`, y esos `headers` se pasan a `testServer.query(query, variables, headers)`. Sin `headers`, la query va sin sesión.
- Un solo happy path, y un test por cada `code` de error distinto que pueda devolver. Si varios inputs inválidos dan el mismo `code`, basta con uno.
- Los errores de negocio se verifican en el payload: `apiErrors` con `code` y `message`, y el recurso en `null`. El happy path verifica `apiErrors: []`. Los de infraestructura (`UNAUTHENTICATED`) se verifican en `response.errors[0].extensions.code`.
- Además de la respuesta, verificar el efecto en DB (o que no lo hubo).
- Cierre obligatorio de toda mutation, al final del archivo y en este orden:
  1. **Tenant:** un tenant no ve ni modifica datos de otro.
  2. **unauthorized:** sin sesión → `UNAUTHENTICATED`.
  3. **permisos:** usuario sin el permiso requerido → el error de permiso.

## Tests de integración

- Los de repositorio corren cada caso dentro de un `UnitOfWork` sobre `testAppDatabase` de `tests/utils/database.ts` (conexión como `app_user`, con RLS) y usan el repositorio del callback (`new UnitOfWork(testAppDatabase, rlsContext).execute(repositories => ...)`). Para leer lo que quedó en la tabla se usa `testDatabase` (admin).
- Setup: `loadFixtures([...])` en `beforeEach`; `resetDatabase()` en `afterEach`; `destroyDatabase()` en `afterAll`.
- Corren sin paralelismo entre archivos (comparten la DB).
- Los de senders y factories de un service también son de integración aunque no toquen la DB: van en esta suite, sin `loadFixtures`/`resetDatabase`/`destroyDatabase`.
- **SDK de un proveedor mockeado** con `vi.hoisted` + `vi.mock('<paquete>')`, así el mock existe antes de que el adapter importe el SDK. Setup a copiar (`resend-sender.int.test.ts`):

  ```ts
  const { Resend, send } = vi.hoisted(() => {
    const send = vi.fn();
    const Resend = vi.fn(function () {
      return { emails: { send } };
    });

    return { Resend, send };
  });

  vi.mock('resend', () => ({ Resend }));
  ```

  Se verifica qué recibe el SDK (`send`) y cómo responde el adapter a sus errores. Nunca se llama al proveedor real.

## Use-cases y `UowContext`

- En el unit de un use-case se mockea el `UowContext` con solo los repositorios que usa (`{ repositories: { workspace: { create } } } as unknown as UowContext`).

## RLS en tests

- `testDatabase`, `loadFixtures` y `resetDatabase` conectan con `ADMIN_DATABASE_URL` (superusuario) y **se saltan RLS**: sirven para preparar y leer datos, nunca para correr el código que se prueba.
- El código que se prueba corre siempre como `app_user`, con RLS: los repositorios sobre `testAppDatabase` y los e2e con `TestServer`. Así el aislamiento por tenant también se prueba en los tests de repositorio.

## Fixtures

- Viven en `fixtures/` junto al test, en `<recurso>.fixtures.ts` (con punto, no con guion: `verification.fixtures.ts`): una clase por tabla, `<X>Fixtures implements Fixture<XTable>` y `<X>Constants` con los ids de todas las filas. `<X>Constants` puede llevar otros valores (emails, fechas de corte), pero solo los que usan los tests.
- Los UUID se generan en constantes **fuera** del objeto, nunca como getters.
- Si un test depende del orden (`created_at desc, id`), las filas llevan `createdAt` fijo y, para probar el desempate, UUID fijos (`00000000-0000-0000-0000-000000000001`) en vez de `crypto.randomUUID()`.
- Un solo `loadFixtures([...])` en el `beforeEach` raíz. Si un caso necesita filas nuevas, se agregan a la clase de fixtures existente; nada de clases ad-hoc cargadas en `beforeEach` anidados.

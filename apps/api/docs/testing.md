<!--- cSpell:disable --->

# Testing

## Suites

El runner es Vitest. La suite se decide por el sufijo del archivo; un test mal nombrado no lo corre ningún comando.

| Suite | Sufijo | Comando | Docker | Cuándo |
|-------|--------|---------|--------|--------|
| unit | `*.test.ts(x)` | `yarn test` | no | No toca DB ni HTTP |
| integración | `*.integration.test.ts` | `yarn test:integration` | sí | Prueba una pieza contra la DB o contra un proveedor externo mockeado, sin pasar por HTTP |
| e2e | `*.e2e.test.ts` | `yarn test:e2e` | sí | Pega por HTTP al server |

- Para correr solo una parte: `yarn test:integration <ruta>`, `yarn test:e2e <ruta>`, `-t "<nombre>"`.
- `yarn test:integration` y `yarn test:e2e` usan el mismo script (`scripts/test-database.sh <config de vitest>`): levantan Postgres en Docker (`docker-compose.test.yml`), migran, corren su config (`vitest.integration.config.ts`, `vitest.e2e.config.ts`) y bajan el contenedor. `yarn test` excluye las dos suites.
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

No se testean:

- **Auth (Better Auth)**: es configuración de una librería ya probada; lo que importa se cubre con los e2e que usan la sesión y con el test del use-case que llama.
- **Templates de email**: son presentación; se revisan con `yarn emails`, y el use-case comprueba que el email lleve el link.
- **Logger**: envoltorio fino de winston, sin lógica.
- **`shared/`**: utilidades que se cubren a través de quien las usa. Si una tiene lógica propia que no queda cubierta, lleva su unit.
- **Adapters que no hacen nada** (`dummy`).

## Reglas generales

- Orden del archivo: happy path primero, failures después, sin intercalar.
- Cada `test(...)` empieza con `returns`, `does`, `does not` o el verbo real de la acción (`adds`, `removes`, `updates`). Nunca una paráfrasis.
- El objeto bajo prueba sale de la DB con datos de fixtures, nunca de factories in-memory. Excepción: tests unitarios, que construyen el objeto directo.
- Antes de inventar un setup, copiar el del test más parecido que ya exista.
- El `describe` raíz lleva el nombre de la pieza y, si no es obvio por el nombre, qué tipo de pieza es: `requireSession - Middleware`.
- El valor esperado de un `expect` va escrito tal cual (`toBe('Acme')`, `{ code: 'WORKSPACE_ALREADY_EXISTS', message: '...' }`), nunca en una constante o variable del test, para leerlo sin ir a buscarlo. Las constantes (`<X>Constants`) sirven para armar el input o buscar filas, no como valor esperado. Excepción: los ids de los fixtures, que son UUID aleatorios y se comparan con su constante (`UserConstants.OwnerUserId`).

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

- Los de repositorio usan `testDatabase` de `tests/utils/database.ts` (conexión de admin). Como los repositorios reciben una transacción, cada caso corre dentro de un `UnitOfWork` sobre `testDatabase` y usa el repositorio del callback (`new UnitOfWork(testDatabase, rlsContext).execute(repositories => ...)`).
- Setup: `loadFixtures([...])` en `beforeEach`; `resetDatabase()` en `afterEach`; `destroyDatabase()` en `afterAll`.
- Corren sin paralelismo entre archivos (comparten la DB).
- Los de senders y factories de un service también son de integración aunque no toquen la DB: van en esta suite, sin `loadFixtures`/`resetDatabase`/`destroyDatabase`.
- **SDK de un proveedor mockeado** con `vi.hoisted` + `vi.mock('<paquete>')`, así el mock existe antes de que el adapter importe el SDK. Setup a copiar (`resend-sender.integration.test.ts`):

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

- Las utilidades de test conectan con `ADMIN_DATABASE_URL` (superusuario) y **se saltan RLS**.
- El aislamiento por tenant solo se prueba por HTTP con `TestServer`, que conecta como `app_user`.

## Fixtures

- Viven en `fixtures/` junto al test, en `<recurso>.fixtures.ts` (con punto, no con guion: `verification.fixtures.ts`): una clase por tabla, `<X>Fixtures implements Fixture<XTable>` y `<X>Constants` con los ids de todas las filas. `<X>Constants` puede llevar otros valores (emails, fechas de corte), pero solo los que usan los tests.
- Los UUID se generan en constantes **fuera** del objeto, nunca como getters.
- Un solo `loadFixtures([...])` en el `beforeEach` raíz. Si un caso necesita filas nuevas, se agregan a la clase de fixtures existente; nada de clases ad-hoc cargadas en `beforeEach` anidados.

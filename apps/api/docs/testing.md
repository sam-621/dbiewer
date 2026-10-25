<!--- cSpell:disable --->

# Testing

## Suites

El runner es Vitest. La suite se decide por el sufijo del archivo; un test mal nombrado no lo corre ningún comando.

| Suite | Sufijo | Comando | Docker | Cuándo |
|-------|--------|---------|--------|--------|
| unit | `*.test.ts` | `yarn test` | no | No toca DB ni HTTP |
| e2e | `*.e2e.test.ts` | `yarn test:e2e` | sí | Pega por HTTP al server |

- Para correr solo una parte: `yarn test:e2e <ruta>`, `-t "<nombre>"`.
- **Siempre solo los tests de la feature**, nunca la suite completa.
- **Nunca dos suites de DB en paralelo**: comparten el mismo docker compose y una tumba la DB de la otra.
- Los tests con DB se pueden correr sin pedir permiso: usan un Postgres efímero en Docker, no una DB real.

## Ubicación

- **Sin fixtures:** el test va junto al archivo que prueba (`connection-string.ts` → `connection-string.test.ts`).
- **Con fixtures:** el test va en `__tests__/` junto al archivo, con sus fixtures en `__tests__/fixtures/`.
- Los e2e van en `tests/<recurso>/<operación>/`.

## Qué se prueba y dónde

| Pieza | Test | Ubicación |
|-------|------|-----------|
| Service con lógica pura | unit | junto al archivo |
| Query o mutation de GraphQL | e2e | `tests/<recurso>/<operación>/` |

## Reglas generales

- Orden del archivo: happy path primero, failures después, sin intercalar.
- Cada `test(...)` empieza con `returns`, `does`, `does not` o el verbo real de la acción (`adds`, `removes`, `updates`). Nunca una paráfrasis.
- El objeto bajo prueba sale de la DB con datos de fixtures, nunca de factories in-memory. Excepción: tests unitarios, que construyen el objeto directo.
- Antes de inventar un setup, copiar el del test más parecido que ya exista.

## Tests e2e

- Siempre con `TestServer` (`tests/utils/test-server.ts`), que levanta la app y expone el cliente de GraphQL.
- Setup: `new TestServer({ headers })` y `loadFixtures([...])` en `beforeEach`; `resetDatabase()` en `afterEach`; `destroyDatabase()` + `testServer.teardown()` en `afterAll`.
- Un solo happy path, y un test por cada `code` de error distinto que pueda devolver. Si varios inputs inválidos dan el mismo `code`, basta con uno.
- Además de la respuesta, verificar el efecto en DB (o que no lo hubo).
- Cierre obligatorio de toda mutation, al final del archivo y en este orden:
  1. **Tenant:** un tenant no ve ni modifica datos de otro.
  2. **unauthorized:** sin token válido → `UNAUTHORIZED`.
  3. **permisos:** usuario sin el permiso requerido → el error de permiso.

## RLS en tests

- Las utilidades de test conectan con `ADMIN_DATABASE_URL` (superusuario) y **se saltan RLS**.
- El aislamiento por tenant solo se prueba por HTTP con `TestServer`, que conecta como `app_user`.

## Fixtures

- Viven en `fixtures/` junto al test: una clase por tabla, `<X>Fixtures implements Fixture<XTable>` y `<X>Constants` con los ids.
- Los UUID se generan en constantes **fuera** del objeto, nunca como getters.
- Un solo `loadFixtures([...])` en el `beforeEach` raíz. Si un caso necesita filas nuevas, se agregan a la clase de fixtures existente; nada de clases ad-hoc cargadas en `beforeEach` anidados.

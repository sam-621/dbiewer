<!--- cSpell:disable --->

# Testing
<!-- si: tests=none -->

Por ahora no se escriben tests salvo que el usuario lo pida. Las reglas se definirán más adelante.

Si se piden:

- Vitest.
- Sin fixtures, el test va junto al archivo (`order.ts` → `order.test.ts`).
- Cada `test(...)` empieza con `returns`, `does`, `does not` o el verbo real de la acción.
- `{{run}} test <ruta>` corre solo esa parte.
<!-- /si -->
<!-- si: tests=full|light -->

## Suites

El runner es Vitest. La suite se decide por el sufijo del archivo; un test mal nombrado no lo corre ningún comando.

| Suite | Sufijo | Comando | Docker | Cuándo |
|-------|--------|---------|--------|--------|
| unit | `*.test.ts` | `{{run}} test` | no | No toca DB ni HTTP |
<!-- /si -->
<!-- si: tests=full -->
| integración | `*.int.test.ts` | `{{run}} test:int` | sí | Toca DB sin HTTP |
<!-- /si -->
<!-- si: tests=full|light -->
| e2e | `*.e2e.test.ts` | `{{run}} test:e2e` | <!-- si: db!=none -->sí<!-- /si --><!-- si: db=none -->no<!-- /si --> | Pega por HTTP al server |

- Para correr solo una parte: `{{run}} test:e2e <ruta>`, `-t "<nombre>"`.
- **Siempre solo los tests de la feature**, nunca la suite completa.
<!-- /si -->
<!-- si: tests=full|light y db!=none -->
- **Nunca dos suites de DB en paralelo**: comparten el mismo docker compose y una tumba la DB de la otra.
- Los tests con DB se pueden correr sin pedir permiso: usan un Postgres efímero en Docker, no una DB real.
<!-- /si -->
<!-- si: tests=full|light -->

## Ubicación

- **Sin fixtures:** el test va junto al archivo que prueba (`order.ts` → `order.test.ts`).
- **Con fixtures:** el test va en `__tests__/` junto al archivo, con sus fixtures en `__tests__/fixtures/`.
- Los e2e van en `tests/<api>/<dominio>/<operación>/`.

## Qué se prueba y dónde

| Pieza | Test | Ubicación |
|-------|------|-----------|
<!-- /si -->
<!-- si: tests=full|light y architecture=ddd -->
| Aggregate, entidad, value object | unit | `<nombre>.test.ts` junto al archivo |
<!-- /si -->
<!-- si: tests=full y architecture=ddd|modular -->
| Service | int | `services/<concepto>/__tests__/` |
| Repositorio (métodos propios) | int | `repositories/<nombre>-repository/__tests__/` |
<!-- /si -->
<!-- si: tests=light y architecture=ddd|modular -->
| Service con lógica pura | unit | junto al archivo |
<!-- /si -->
<!-- si: tests=full|light y architecture=ddd|modular -->
| Use case | **ninguno propio** | se cubre en el e2e del adapter |
| Resolver / controller | e2e | `tests/...` |
<!-- /si -->
<!-- si: tests=full y architecture=layered -->
| Service | int | `src/services/__tests__/` |
| Repositorio | int | `src/repositories/__tests__/` |
| Ruta | e2e | `tests/<recurso>/<acción>/` |
<!-- /si -->
<!-- si: tests=light y architecture=layered -->
| Service con lógica pura | unit | junto al archivo |
| Ruta | e2e | `tests/<recurso>/<acción>/` |
<!-- /si -->
<!-- si: tests=full|light -->

## Reglas generales

- Orden del archivo: happy path primero, failures después, sin intercalar.
- Cada `test(...)` empieza con `returns`, `does`, `does not` o el verbo real de la acción (`adds`, `removes`, `updates`). Nunca una paráfrasis.
<!-- /si -->
<!-- si: tests=full|light y db!=none -->
- El objeto bajo prueba sale de la DB con datos de fixtures, nunca de factories in-memory. Excepción: tests unitarios, que construyen el objeto directo.
<!-- /si -->
<!-- si: tests=full|light -->
- Antes de inventar un setup, copiar el del test más parecido que ya exista.

## Tests e2e

- Siempre con `TestServer` (`tests/utils/test-server.ts`), que levanta la app y expone el cliente HTTP.
<!-- /si -->
<!-- si: tests=full|light y db!=none -->
- Setup: `new TestServer({ headers })` y `loadFixtures([...])` en `beforeEach`; `resetDatabase()` en `afterEach`; `destroyDatabase()` + `testServer.teardown()` en `afterAll`.
<!-- /si -->
<!-- si: tests=full|light y db=none -->
- Setup: `new TestServer({ headers })` en `beforeEach`; `testServer.teardown()` en `afterAll`.
<!-- /si -->
<!-- si: tests=full|light -->
- Un solo happy path, y un test por cada `code` de error distinto que pueda devolver. Si varios inputs inválidos dan el mismo `code`, basta con uno.
<!-- /si -->
<!-- si: tests=full|light y db!=none -->
- Además de la respuesta, verificar el efecto en DB (o que no lo hubo).
<!-- /si -->
<!-- si: tests=full|light -->
- Cierre obligatorio de toda mutation, al final del archivo y en este orden:
<!-- /si -->
<!-- si: tests=full|light y rls -->
  1. **Tenant:** un tenant no ve ni modifica datos de otro.
  2. **unauthorized:** sin token válido → `UNAUTHORIZED`.
  3. **permisos:** usuario sin el permiso requerido → el error de permiso.
<!-- /si -->
<!-- si: tests=full|light y !rls -->
  1. **unauthorized:** sin token válido → `UNAUTHORIZED`.
  2. **permisos:** usuario sin el permiso requerido → el error de permiso.
<!-- /si -->
<!-- si: tests=full|light y rls -->

## RLS en tests

- Las utilidades de test conectan con `ADMIN_DATABASE_URL` (superusuario) y **se saltan RLS**.
- El aislamiento por tenant solo se prueba por HTTP con `TestServer`, que conecta como `app_user`.
<!-- /si -->
<!-- si: tests=full|light y db!=none -->

## Fixtures

- Viven en `fixtures/` junto al test: una clase por tabla, `<X>Fixtures implements Fixture<XTable>` y `<X>Constants` con los ids.
- Los UUID se generan en constantes **fuera** del objeto, nunca como getters.
- Un solo `loadFixtures([...])` en el `beforeEach` raíz. Si un caso necesita filas nuevas, se agregan a la clase de fixtures existente; nada de clases ad-hoc cargadas en `beforeEach` anidados.
<!-- /si -->

<!--- cSpell:disable --->

# Testing
<!-- si: tests=none -->

Por ahora no se escriben tests salvo que el usuario lo pida. Las reglas se definirán más adelante.

Si se piden:

- Vitest + React Testing Library, entorno jsdom.
- Sin fixtures, el test va junto al archivo (`arrays.ts` → `arrays.test.ts`).
- `{{run}} test` corre todo; `{{run}} test <ruta>` corre solo esa parte.
<!-- /si -->
<!-- si: tests=unit|e2e -->

## Suites

| Suite | Sufijo | Comando | Cuándo |
|-------|--------|---------|--------|
| unit | `*.test.ts(x)` | `{{run}} test` | utils, hooks y componentes con lógica |
<!-- /si -->
<!-- si: tests=e2e -->
| e2e | `*.spec.ts` en `e2e/` | `{{run}} test:e2e` | flujos completos en el navegador |
<!-- /si -->
<!-- si: tests=unit|e2e -->

- Siempre solo los tests de lo que se tocó, nunca la suite completa.

## Unit

- Vitest + React Testing Library, entorno jsdom.
- Setup en `tests/setup.ts`; render con `tests/render.tsx`, que envuelve con los providers de la app.
- El test va junto al archivo (`price.utils.ts` → `price.utils.test.ts`).
- Se prueba lo que el usuario ve y hace (`getByRole`, `userEvent`), no detalles de implementación.
- La API se mockea en el borde (el fetcher), nunca los hooks del módulo.
- Cada `test(...)` empieza con `renders`, `shows`, `does`, `does not` o el verbo real de la acción.
<!-- /si -->
<!-- si: tests=e2e -->

## e2e

- Playwright, en `e2e/<módulo>/<flujo>.spec.ts`.
- Un archivo por flujo de `spec/ui.md`: el happy path y los estados de error visibles.
- Selectores por rol y texto visible, nunca por clases.
- Corren contra la API real en local; si no está levantada, se le pide al usuario.
<!-- /si -->

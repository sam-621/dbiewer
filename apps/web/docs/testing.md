<!--- cSpell:disable --->

# Testing

## Suites

| Suite | Sufijo | Comando | Cuándo |
|-------|--------|---------|--------|
| unit | `*.test.ts(x)` | `yarn test` | utils, hooks y componentes con lógica |
| e2e | `*.spec.ts` en `e2e/` | `yarn test:e2e` | flujos completos en el navegador |

- Siempre solo los tests de lo que se tocó, nunca la suite completa.

## Unit

- Vitest + React Testing Library, entorno jsdom.
- Setup en `tests/setup.ts`; render con `tests/render.tsx`, que envuelve con los providers de la app.
- El test va junto al archivo (`sql.utils.ts` → `sql.utils.test.ts`).
- Se prueba lo que el usuario ve y hace (`getByRole`, `userEvent`), no detalles de implementación.
- La API se mockea en el borde (el fetcher), nunca los hooks del módulo. Lo de Better Auth se mockea en `@/lib/api/auth-client`, que es su borde.
- Cada `test(...)` empieza con `renders`, `shows`, `does`, `does not` o el verbo real de la acción.

## e2e

- Playwright, en `e2e/<módulo>/<flujo>.spec.ts`.
- Un archivo por flujo de `spec/ui.md`: el happy path y los estados de error visibles.
- Selectores por rol y texto visible, nunca por clases.
- Corren contra la API real en local; si no está levantada, se le pide al usuario.

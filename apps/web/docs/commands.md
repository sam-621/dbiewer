<!--- cSpell:disable --->

# Comandos

Todos se corren dentro de `apps/web`. Esta tabla es el contrato de los scripts del `package.json`: si falta uno, se agrega con este nombre.

## Los puede correr el agente

| Comando | Para qué |
|---------|----------|
| `yarn test [ruta]` | Tests con Vitest. |
| `yarn test:e2e [ruta]` | Tests e2e con Playwright contra el dev server que levanta el propio comando. |
| `yarn lint:check` | Revisa ESLint + Prettier. |
| `yarn lint:fix` | Arregla lint, formato y orden de imports. |

- No correr `tsc --noEmit` para verificar ediciones; el diagnóstico del IDE basta. El typecheck real es `yarn build`.
- Tests: solo los de la feature, nunca la suite completa (ver `testing.md`).

## Solo los corre el usuario

Todo lo que toca una DB real, levanta el server o pega a una API viva. Si hace falta, se le pide y se espera.

| Comando | Para qué |
|---------|----------|
| `yarn dev` | Levanta la app en local. |
| `yarn build` | Typecheck y build de producción. |
| `yarn gen:types` | Regenera los tipos de GraphQL. Necesita `apps/api` corriendo; si hace falta, se le pide al usuario. |
| `yarn preview` | Sirve la build local. |

## Variables de entorno

| Variable | Para qué |
|----------|----------|
| `VITE_API_URL` | URL base de `apps/api`. |

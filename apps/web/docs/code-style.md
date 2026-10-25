<!--- cSpell:disable --->

# Estilo de código

## General

- **Sin comentarios.** Ni explicativos, ni JSDoc, ni `TODO`. Solo si el usuario lo pide, y solo el que pidió.
- **Código en inglés**: nombres, strings y valores. El texto visible pasa por i18n.
- Sin `any`; `unknown` + narrowing.
- `import type` para lo que solo es tipo.
- Variables sin usar con prefijo `_`.
- `@/` para importar fuera del módulo; relativos dentro del mismo módulo.

## Formato e imports

- Comillas simples, ancho 100, sin trailing commas, 2 espacios (`.prettierrc`).
- `yarn lint:fix` ordena los imports (`simple-import-sort`): side effects → `node:` → `react` y externos → `@/...` → `../` → `./` → CSS. No se ordenan a mano.

## Naming

| Qué | Regla | Ejemplo |
|-----|-------|---------|
| Archivos y carpetas | kebab-case | `results-grid/columns.tsx` |
| Página | `<Nombre>Page` en `pages/<nombre>-page.tsx` | `ConnectionsPage` |
| Hook | `use<Acción>` en `hooks/use-<acción>.ts` | `useRemoveConnection` |
| Componente | PascalCase, exportado por nombre | `ConnectionDetailsSubmitButton` |
| Cache keys | `<Módulo>CacheKeys` | `ConnectionCacheKeys.Connections` |
| Operation | SCREAMING_SNAKE_CASE con sufijo `_QUERY`, `_MUTATION` o `_FRAGMENT` | `REMOVE_CONNECTION_MUTATION` |
| Utils | `<tema>.utils.ts` | `sql.utils.ts` |

- Exports con nombre, sin `export default`.
- Componentes como `export const X = () => {...}`.

## i18n

- Todo texto visible usa `t('...')` de `react-i18next`. La key es el texto en inglés: `t('Save')`.
- Cada key nueva se agrega en todos los archivos de `src/shared/i18n/locales/`.
- Español neutro, sin voseo.

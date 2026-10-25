<!--- cSpell:disable --->

# Estilo de código

## General

<!-- si: comments=none -->
- **Sin comentarios.** Ni explicativos, ni JSDoc, ni `TODO`. Solo si el usuario lo pide, y solo el que pidió.
<!-- /si -->
<!-- si: comments=why -->
- **Comentarios solo para el porqué** que el código no puede decir. Nunca para describir qué hace. Sin JSDoc.
<!-- /si -->
<!-- si: i18n -->
- **Código en inglés**: nombres, strings y valores. El texto visible pasa por i18n.
<!-- /si -->
<!-- si: !i18n -->
- **Código en inglés**: nombres, tipos, keys y valores.
- **Texto visible en {{ui_language}}** directo en el JSX y en los mensajes de error.
<!-- /si -->
- Sin `any`; `unknown` + narrowing.
- `import type` para lo que solo es tipo.
- Variables sin usar con prefijo `_`.
- `@/` para importar fuera del módulo; relativos dentro del mismo módulo.

## Formato e imports

- Comillas simples, ancho 100, sin trailing commas, 2 espacios (`.prettierrc`).
- `{{run}} lint:fix` ordena los imports (`simple-import-sort`): side effects → `node:` → `react` y externos → `@/...` → `../` → `./` → CSS. No se ordenan a mano.

## Naming

| Qué | Regla | Ejemplo |
|-----|-------|---------|
| Archivos y carpetas | kebab-case | `orders-table/columns.tsx` |
| Página | `<Nombre>Page` en `pages/<nombre>-page.tsx` | `OrdersPage` |
| Hook | `use<Acción>` en `hooks/use-<acción>.ts` | `useRemoveOrder` |
| Componente | PascalCase, exportado por nombre | `OrderDetailsSubmitButton` |
| Cache keys | `<Módulo>CacheKeys` | `OrderCacheKeys.Orders` |
<!-- si: data=graphql -->
| Operation | SCREAMING_SNAKE_CASE con sufijo `_QUERY`, `_MUTATION` o `_FRAGMENT` | `REMOVE_ORDER_MUTATION` |
<!-- /si -->
<!-- si: data=rest -->
| Función de endpoint | verbo + recurso | `getOrders`, `removeOrder` |
<!-- /si -->
| Utils | `<tema>.utils.ts` | `price.utils.ts` |

- Exports con nombre, sin `export default`<!-- si: framework=next --> (salvo los `page.tsx` y `layout.tsx` de `src/app`, que Next exige)<!-- /si -->.
- Componentes como `export const X = () => {...}`.
<!-- si: i18n -->

## i18n

- Todo texto visible usa `t('...')` de `react-i18next`. La key es el texto en inglés: `t('Save')`.
- Cada key nueva se agrega en todos los archivos de `src/shared/i18n/locales/`.
- Español neutro, sin voseo.
<!-- /si -->
<!-- si: !i18n y uiLanguage=es -->

## Textos

- Español neutro, sin voseo.
- La terminología del producto se fija aquí cuando se decida (ej. "orden" y nunca "pedido").
<!-- /si -->

> Fuente de verdad de la UI de apps/web. Si un componente existente lo contradice, manda este doc.

# Sistema de diseño

Componentes y tokens de [coss ui](https://coss.com/ui) (sobre Base UI), con el amarillo de marca de dbiewer.

## De dónde salen los componentes

- Registry: `@coss` → `https://coss.com/ui/r/{name}.json`, configurado en `components.json`.
- Catálogo y ejemplos: https://coss.com/ui. Índice completo del registry: https://coss.com/ui/r/registry.json.
- Agregar o actualizar un componente, dentro de `apps/web`:

  ```bash
  npx shadcn@latest add @coss/<nombre>
  ```

- Los componentes quedan en `src/shared/components/ui`, los hooks en `src/shared/hooks` y las utils en `src/shared/utils`. Si el CLI deja algo fuera de esos alias, se mueve y se corrigen los imports.
- No se escriben componentes base a mano ni se usan los de Radix o shadcn. Las piezas propias que componen los de coss (como `Brand`) van en `src/shared/components/`, fuera de `ui/`.
- Después de agregar uno, revisar lo que el CLI instala de más: `@coss/fonts` agrega Inter y Geist, y `utils` crea un duplicado de `cn`. Eso no se deja.
- Las primitivas de Base UI usan `render` en lugar de `asChild`: `<Button render={<Link to="/" />}>`.

## Componentes instalados

`accordion`, `alert`, `alert-dialog`, `autocomplete`, `avatar`, `badge`, `breadcrumb`, `button`, `calendar`, `card`, `checkbox`, `checkbox-group`, `collapsible`, `combobox`, `command`, `composer`, `context-menu`, `dialog`, `drawer`, `empty`, `field`, `fieldset`, `form`, `frame`, `group`, `input`, `input-group`, `kbd`, `label`, `menu`, `meter`, `number-field`, `otp-field`, `pagination`, `popover`, `preview-card`, `progress`, `radio-group`, `scroll-area`, `segmented-control`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `slider`, `spinner`, `switch`, `table`, `tabs`, `textarea`, `toast`, `toggle`, `toggle-group`, `toolbar`, `tooltip`.

## Tokens

Viven en `src/app/app.css` (Tailwind v4, sin `tailwind.config.js`).

- **Colores de coss, sin cambios:** `background`, `foreground`, `card`, `popover`, `secondary`, `muted`, `accent`, `border`, `input`, `ring`, `destructive`, `info`, `success`, `warning` (cada uno con su `-foreground`), `chart-1..5`, `code` y `sidebar-*`, en `:root` y `.dark`.
- **Marca:** `--color-brand` (amarillo, `oklch(0.88 0.18 95)`) y `--color-brand-ink` (texto sobre el amarillo). `primary` y `primary-foreground` apuntan a ellos en los dos temas. Es el único cambio sobre los colores de coss, igual que en `apps/www`.
- **SQL:** `--color-pk`, `--color-fk` y `--color-sql-{kw,fn,str,num,tbl,col,date}` para el editor, el esquema y la grilla.
- **Fuentes:** `font-sans` (Funnel Sans), `font-mono` (JetBrains Mono, para SQL y cualquier valor de la base), `font-serif` (Instrument Serif) y `font-heading`. Se cargan en `index.html`.
- **Tema oscuro:** clase `.dark` en un ancestro (`@custom-variant dark (&:where(.dark, .dark *))`). La app arranca en oscuro: `index.html` lleva `class="dark"` en el `<html>`.

## Reglas

- Colores solo por token (`bg-primary`, `text-muted-foreground`, `text-sql-kw`). Nada de literales (`#fff`, `bg-blue-500`) en pantallas.
- El amarillo se usa con `primary` o `brand`, nunca con un valor copiado.
- Campos de email con `inputMode="email"` y no `type="email"`: el `Form` de Base UI cancela el submit con la validación nativa y muestra su propio mensaje sin traducir. La validación la hace el schema de zod.
- Mientras no haya `ToastProvider` en los providers, los avisos de una acción van en línea con `Alert`.
- Los archivos que trae coss (`src/shared/components/ui`, `composer-*` en hooks y utils) se dejan tal como vienen del registry: su estilo de código, sus textos y la excepción de lint de `composer` en `eslint.config.js`. Las reglas de `code-style.md` aplican al código propio.

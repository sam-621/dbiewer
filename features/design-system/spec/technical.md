# Sistema de diseño (UI) — especificación técnica

Reglas de negocio y decisiones en `product.md`. Cómo se usa el sistema día a día: `apps/web/docs/design-system.md`.

## Configuración

- `apps/web/components.json`: registry `"@coss": "https://coss.com/ui/r/{name}.json"`, con los alias de siempre: `ui` → `@/shared/components/ui`, `utils` → `@/shared/utils/cn`, `hooks` → `@/shared/hooks`, `lib` → `@/shared/utils`.
- Instalación: `npx shadcn@latest add @coss/style` dentro de `apps/web`. Ese ítem depende de `@coss/ui` (los 55 componentes) y de `@coss/fonts`, así que trae todo en un paso.
- Componentes nuevos o actualizaciones: `npx shadcn@latest add @coss/<nombre>`. Índice del registry en https://coss.com/ui/r/registry.json.
- Dependencias que se agregaron: `@base-ui/react` y `@daypicker/react` (la usa `calendar`). Las que se quitaron: `radix-ui` y `tw-animate-css`.

### Lo que el CLI instala de más y se quita

- `@coss/fonts` agrega Inter y Geist, con sus `@import`, los paquetes `geist` y `@fontsource-variable/inter`, y `html { @apply font-sans font-mono }`. Se quita todo y queda `@apply font-sans`.
- El ítem `utils` crea `src/shared/utils/utils.ts`, una copia de `cn`, y agrega el paquete npm `cn`. Se borran los dos: el `cn` real está en `@/shared/utils/cn`.
- En `@theme inline`, la línea `--code-foreground: var(--code-foreground)` se refiere a sí misma. Se cambia a `--color-code-foreground: var(--code-foreground)`.

## Tokens (`apps/web/src/app/app.css`)

- **Tema de coss, completo:** semánticos con su `-foreground` (`background`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `info`, `success`, `warning`), `border`, `input`, `ring`, `chart-1..5`, `code`/`code-highlight`, `sidebar-*`, radios hasta `4xl` y animaciones (`skeleton`, `caret-blink`, `toast-*`), en `:root` y `.dark`.
- **Marca:** en `@theme`, `--color-brand: oklch(0.88 0.18 95)` y `--color-brand-ink: oklch(0.18 0.04 95)`. `--primary` y `--primary-foreground` apuntan a ellos en los dos temas, igual que `apps/www/src/styles/global.css`. `sidebar-primary` queda como lo trae coss.
- **SQL:** `--color-pk`, `--color-fk` y `--color-sql-{kw,fn,str,num,tbl,col,date}`, copiados de www.
- **Fuentes:** `--font-sans` (Funnel Sans), `--font-mono` (JetBrains Mono), `--font-serif` (Instrument Serif) y `--font-heading`. Se cargan desde Google Fonts en `apps/web/index.html`, con el mismo `<link>` que `apps/www/src/layouts/Layout.astro`.
- **Variante oscura:** `@custom-variant dark (&:where(.dark, .dark *))`. Todavía nada pone la clase `.dark`.

## Archivos de coss

- **Componentes:** 55 en `src/shared/components/ui`, de `accordion` a `tooltip`. La lista está en `docs/design-system.md`.
- **Hooks:** `src/shared/hooks/use-media-query.ts` y `use-composer-editor.ts`.
- **Utils:** `src/shared/utils/composer-{clipboard,document,editor,query}.ts`.
- **Quedan como vienen del registry:** `export function`, comillas dobles, `'use client'`, textos en inglés (`pagination`, `breadcrumb`, `sidebar`) y selectores `data-[state=open]` de `sidebar` que Base UI no activa.
- **Únicos ajustes:** al instalar, se quitaron los comentarios y se corrigieron dos errores de lint (`Math.random()` en `sidebar.tsx`, que pasó a un inicializador de `useState`, y un import sin usar en `composer-editor.ts`).
- **Excepción de lint:** en `apps/web/eslint.config.js`, `composer-editor.ts` y `use-composer-editor.ts` tienen apagadas las reglas `react-hooks/refs`, `immutability`, `set-state-in-effect` y `exhaustive-deps`.

## Impacto en código existente

- **`button.tsx`:** se reemplazó por el de coss.
- **`not-found.tsx`:** usa `render={<Link to="/" />}` en lugar de `asChild`.
- **`src/shared/utils/cn.ts`:** sigue igual.

## Documentación y agentes

- **Doc del sistema:** `apps/web/docs/design-system.md` dice de dónde salen los componentes, qué hay instalado, cuáles son los tokens y las reglas. Está enlazado desde `apps/web/CLAUDE.md` y desde la sección UI de `docs/architecture.md`.
- **Harness:** en `.claude/harness.json`, la app web tiene `"ui": "coss"`.
- **`web-implementer`:** hace la UI con los componentes de `ui` y los tokens, trae los componentes que falten de `@coss` y no edita los archivos de coss.
- **`web-reviewer`:** revisa la UI contra `docs/design-system.md` y reporta si alguien editó archivos de coss.

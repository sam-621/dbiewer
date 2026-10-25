---
status: done
apps: [web]
created: 2026-10-24
---

# Sistema de diseño (UI)

## Contexto

`apps/web` arranca con shadcn/ui sobre Radix y el tema neutro por defecto: un solo componente (`button`) y ninguna guía de estilos. `apps/www` ya usa coss ui (Base UI) con los tokens de la marca dbiewer. Antes de construir el editor SQL, el explorador del esquema, la grilla de resultados y el historial, el cliente web necesita una base de componentes y una guía de estilos común. Esa base tiene que estar documentada para que los agentes (`web-implementer`, `web-reviewer`) la usen sin tener que adivinar.

## Historia de usuario

Como desarrollador (humano o agente) de `apps/web`, quiero los componentes de coss ui y una guía de estilos documentada, para construir pantallas consistentes con la marca sin escribir componentes base a mano.

## Flujo

1. Se configura el registry `@coss` en `apps/web/components.json`.
2. Se migran los tokens de la marca (colores, tipografías, radios, modo oscuro) a `src/app/app.css`.
3. Se instalan con el CLI todos los componentes de coss ui.
4. Se reemplazan los usos de Radix/shadcn existentes por sus equivalentes de coss ui.
5. Se documenta en `apps/web/docs/design-system.md` de dónde salen los componentes, los tokens y las reglas.
6. Los agentes leen ese doc antes de escribir UI y el reviewer lo verifica.

## Reglas de negocio

- La librería de componentes de `apps/web` es coss ui (registry `@coss`, sobre Base UI). No se mezclan componentes de Radix ni de shadcn.
- Si falta un componente, se agrega con el CLI desde `@coss`, no se escribe a mano.
- Los colores, tipografías y radios salen de los tokens de `app.css`. No se usan colores literales (`#fff`, `bg-blue-500`) en componentes de pantalla.
- Se mantienen todos los colores de coss ui. La marca se agrega como tokens nuevos (`--color-brand`, `--color-brand-ink`) y `primary`/`primary-foreground` apuntan a ellos, igual que en `apps/www`.
- La identidad visual de `apps/web` coincide con la de `apps/www`: mismos tokens de marca, mismas fuentes y modo claro/oscuro.
- Los archivos que trae coss se dejan tal como vienen del registry: no se editan su estilo de código, sus textos ni su lógica.
- Todo componente instalado queda listado en `docs/design-system.md`.

## Decisiones

- **coss ui en lugar de shadcn/Radix**: es la que ya usa `apps/www` y comparte con ella los tokens y el lenguaje visual. Se descarta mantener shadcn/Radix en web.
- **Todos los componentes, no un set inicial**: se instala `@coss/ui` completo para tenerlos disponibles al construir pantallas.
- **Archivos de coss sin tocar**: conservan `export function`, comillas dobles, `'use client'` y textos en inglés; `composer` tiene una excepción de lint en `eslint.config.js`. Se descarta adaptarlos a `code-style.md` para poder actualizarlos desde el registry.
- **Sin página de muestra**: el catálogo es https://coss.com/ui y los componentes no se modifican. Se descarta una ruta interna `/design-system`.
- **Tokens copiados, no compartidos**: el monorepo no tiene workspaces, así que `apps/web` mantiene su propia copia de los tokens, alineada con `apps/www`. Se descarta un paquete compartido por ahora.

## Fuera de alcance

- Pantallas del producto (editor, explorador, grilla, historial): solo se deja la base para construirlas.
- Cambios en `apps/www`.
- Un paquete de UI compartido entre apps.
- Storybook, un catálogo publicado o una página interna de muestra.
- Un selector de tema claro/oscuro: se construye cuando lo pida una pantalla real.

## Plan de trabajo recomendado

1. [x] web: configurar el registry `@coss` en `components.json` e instalar `@base-ui/react`.
2. [x] web: migrar los tokens de marca, fuentes y modo oscuro de `apps/www` a `src/app/app.css`.
3. [x] web: instalar todos los componentes de coss ui.
4. [x] web: reemplazar `button` de shadcn y quitar `radix-ui` de las dependencias.
5. [x] web: escribir `docs/design-system.md` (tokens, componentes, reglas) y enlazarlo desde `CLAUDE.md` y `docs/architecture.md`.
6. [x] web: alinear `web-implementer` y `web-reviewer` para que lean y verifiquen el doc del sistema de diseño.

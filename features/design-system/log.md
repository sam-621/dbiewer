# Sistema de diseño (UI) — log

## 2026-10-24 — samuel.corrales621

**Hecho:**
- (web) Se crea la feature `design-system`: spec de producto, técnico y de UI, y plan de trabajo.

- (web) Pasos 1 a 4: registry `@coss`, tema `@coss/style` con todos los colores de coss, los 55 componentes de `@coss/ui` en `src/shared/components/ui`, fuentes de www en `index.html`, `radix-ui` y `tw-animate-css` quitados, `not-found.tsx` migrado a `render`. Lint, tests y build en verde.
- (web) Referencia en `docs/design-system.md` (de dónde y cómo traer componentes, tokens, reglas), enlazada desde `CLAUDE.md` y `docs/architecture.md`.

**Decisiones:**
- Se instalan todos los componentes de coss ui, no solo el set inicial, a pedido del usuario.
- `--color-brand` y `--color-brand-ink` como en www; `primary` y `primary-foreground` apuntan a ellos. Es el único cambio sobre los colores de coss.
- Se quitan Inter, Geist y el paquete `cn` que agrega el CLI con `@coss/fonts`; las fuentes son las de www.
- coss ui (registry `@coss`, Base UI) es la librería de componentes de `apps/web`, alineada con `apps/www`.
- Los tokens de marca se copian de `apps/www` a `apps/web` porque no hay workspaces para compartirlos.
- Los archivos de coss ui se dejan como vienen del registry: `export function`, comillas dobles, `'use client'`, textos en inglés, `composer` con su excepción de lint y los selectores `data-[state]` de `sidebar`.
- `primary` se queda con el amarillo de marca, igual que en www.
- Sin página interna de muestra: el catálogo es https://coss.com/ui. El selector de tema se construye cuando lo pida una pantalla.
- (web) Agentes alineados: `web-implementer` usa componentes de `ui` y tokens y trae lo que falte de `@coss`; `web-reviewer` verifica la UI contra `docs/design-system.md`. `harness.json` pasa a `"ui": "coss"`.
- Specs actualizados con lo construido. Plan completo, feature en `status: done`.

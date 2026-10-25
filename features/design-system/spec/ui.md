# Sistema de diseño (UI) — UI

Capacidades que debe tener la UI, sin estilos ni componentes concretos: como si fuera HTML sin CSS. Reglas de negocio en `product.md`; aquí se referencian, no se repiten.

Las capacidades (qué muestra, qué permite, estados) son obligatorias. La forma (diálogo, página, ruta, posición) es una propuesta: si el diseño la resuelve distinto, se actualiza este archivo para reflejar lo construido.

## Pantallas nuevas

Ninguna. La feature deja la base para las pantallas del producto; no hay página de muestra (ver Decisiones en `product.md`).

## Cambios a UI existente

### Página no encontrada

- **Ubicación:** `src/shared/components/not-found.tsx`.
- **Cambia:** usa el `Button` de coss y los tokens nuevos. El comportamiento no cambia.

# Acceso con GitHub y Google — UI

Capacidades que debe tener la UI, sin estilos ni componentes concretos: como si fuera HTML sin CSS. Reglas de negocio en `product.md`; aquí se referencian, no se repiten.

Las capacidades (qué muestra, qué permite, estados) son obligatorias. La forma (diálogo, página, ruta, posición) es una propuesta: si el diseño la resuelve distinto, se actualiza este archivo para reflejar lo construido.

## Pantallas nuevas

Ninguna.

## Cambios a UI existente

### Acceso

- **Ubicación:** ruta `/login`, de la feature `auth`.
- **Cambia:** arriba del campo de email se agregan "Continue with GitHub" y "Continue with Google", separados del magic link por un "or".
- **Estados nuevos:**
  - Redirigiendo: el botón elegido queda deshabilitado y muestra un indicador de carga.
  - Email sin verificar: aviso arriba del formulario ("Your GitHub account has no verified email. Verify it or use a magic link.").
  - Cancelado en el proveedor: vuelve a la pantalla de acceso sin aviso.

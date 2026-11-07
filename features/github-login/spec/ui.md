# Login con GitHub — UI

Capacidades que debe tener la UI, sin estilos ni componentes concretos: como si fuera HTML sin CSS. Reglas de negocio en `product.md`; aquí se referencian, no se repiten.

Las capacidades (qué muestra, qué permite, estados) son obligatorias. La forma (diálogo, página, ruta, posición) es una propuesta: si el diseño la resuelve distinto, se actualiza este archivo para reflejar lo construido.

## Cambios a UI existente

### Acceso

- **Ubicación:** `apps/web`, ruta `/login`.
- **Cambia:** se quitan el campo de email, el botón "Send magic link" y la pantalla "Check your email". Queda la marca, el título ("Sign in to dbiewer") y un único botón "Continue with GitHub" con el logo de GitHub.
- **Estados:**
  - Redirigiendo: después del clic, el botón queda deshabilitado y con indicador de carga hasta que el navegador sale hacia GitHub.
  - Error al iniciar: si la llamada falla, aviso genérico ("Something went wrong") y el botón vuelve a estar disponible.
  - Error de GitHub: al volver con `?error=`, aviso arriba del botón ("We couldn't sign you in with GitHub. Try again.") y el `?error=` se quita de la URL.

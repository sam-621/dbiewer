# Acceso y workspace — UI

Capacidades que debe tener la UI, sin estilos ni componentes concretos: como si fuera HTML sin CSS. Reglas de negocio en `product.md`; aquí se referencian, no se repiten.

Las capacidades (qué muestra, qué permite, estados) son obligatorias. La forma (diálogo, página, ruta, posición) es una propuesta: si el diseño la resuelve distinto, se actualiza este archivo para reflejar lo construido.

## Pantallas nuevas

### Acceso

- **Ubicación:** `apps/web`, ruta `/login`. Se llega al abrir la app sin sesión, o desde "Sign in" y "Open app" en la landing.
- **Muestra:** la marca dbiewer, un título ("Sign in to dbiewer"), un campo de email y el botón "Send magic link". Una línea aclara que, si no hay cuenta, se crea al entrar. Se deja espacio arriba del campo para los botones de GitHub y Google que agrega `social-login`.
- **Permite:** escribir un email y pedir el magic link.
- **Estados:**
  - Enviando: el botón queda deshabilitado y muestra un indicador de carga.
  - Enviado: la pantalla cambia a "Check your email". Muestra el email al que se mandó (`ana@acme.dev`), aclara que el link vence en 15 minutos y ofrece reenviarlo o usar otro email.
  - Email inválido: validación en el campo.
  - Demasiados intentos: aviso de esperar unos minutos antes de pedir otro link.
  - Link vencido o ya usado: al volver con `?error=`, aparece un aviso arriba del formulario ("This link expired. Request a new one.").
- **Referencia:** el hero de la landing (`apps/www`), para el tono y la marca.

### Workspace (inicio)

- **Ubicación:** ruta `/`, protegida por la guard de sesión. Es a donde lleva el login.
- **Muestra:** el layout de la app, con el nombre del workspace (`Ana's workspace`) y el menú de usuario. En el contenido, un estado vacío que invita a conectar una base, con la acción deshabilitada o marcada como "próximamente" hasta el milestone 2.
- **Permite:** abrir el menú de usuario.
- **Estados:** carga mientras se resuelve la sesión.

## Cambios a UI existente

### Menú de usuario (nuevo, en el layout de la app)

- **Ubicación:** en el layout de todas las pantallas con sesión.
- **Muestra:** avatar (las iniciales del usuario) y nombre. Al abrirlo, el email y "Sign out". `account-settings` agrega ahí los links a configuración.
- **Permite:** cerrar sesión. Al hacerlo, lleva a `/login`.

### Página de inicio actual (health check)

- **Ubicación:** `src/lib/system/pages/home-page.tsx`, hoy en `/`.
- **Cambia:** deja de ser la ruta `/`, que pasa a ocupar la pantalla de Workspace.

# Acceso y workspace — UI

Capacidades que debe tener la UI, sin estilos ni componentes concretos: como si fuera HTML sin CSS. Reglas de negocio en `product.md`; aquí se referencian, no se repiten.

Las capacidades (qué muestra, qué permite, estados) son obligatorias. La forma (diálogo, página, ruta, posición) es una propuesta: si el diseño la resuelve distinto, se actualiza este archivo para reflejar lo construido.

## Pantallas nuevas

### Acceso

- **Ubicación:** `apps/web`, ruta `/login`. Se llega al abrir la app sin sesión, o desde "Sign in" y "Open app" en la landing.
- **Muestra:** la marca dbiewer, un título ("Sign in to dbiewer"), un campo de email y el botón "Send magic link".
- **Permite:** escribir un email y pedir el magic link.
- **Estados:**
  - Enviando: el botón queda deshabilitado y muestra un indicador de carga.
  - Enviado: el formulario cambia a "Check your email". Muestra el email al que se mandó (`ana@acme.dev`), aclara que el link vence en 15 minutos y ofrece reenviarlo o usar otro email.
  - Email inválido: validación en el campo.
  - Demasiados intentos: aviso de esperar unos minutos antes de pedir otro link.
  - Link vencido o ya usado: al volver con `?error=`, aparece un aviso arriba del formulario ("This link expired. Request a new one.") y el `?error=` se quita de la URL.
- **Referencia:** el hero de la landing (`apps/www`), para el tono y la marca.

### Onboarding

- **Ubicación:** ruta `/onboarding`. Se llega con sesión y sin workspace; cualquier otra ruta con sesión redirige aquí.
- **Muestra:** el mismo layout que Acceso (marca, título "Welcome to dbiewer" y formulario, sin cards):
  - "What should we call you?": campo de texto.
  - "What is your preferred language?": botones en fila con bandera y nombre (Español, English).
  - "What is your preferred theme?": botones en fila con ícono y nombre (System, Light, Dark).
  - Botón "Continue", del ancho de su contenido.
- **Permite:** escribir el nombre, elegir idioma y tema (se aplican al instante) y continuar.
- **Estados:**
  - Opción elegida: con fondo, texto resaltado e ícono relleno; el resto con texto apagado.
  - Enviando: el botón queda deshabilitado y muestra un indicador de carga.
  - Nombre vacío o de más de 50 caracteres: validación en el campo.
  - Error al guardar: aviso arriba del formulario.
  - Al terminar: entra a `/`.

### Workspace (inicio)

- **Ubicación:** ruta `/`, protegida por la guard de sesión y workspace. Es a donde lleva el login.
- **Muestra:** la marca, el nombre del workspace ("My workspace") y el botón "Sign out".
- **Permite:** cerrar sesión. Al hacerlo, lleva a `/login`.
- **Estados:** carga mientras se resuelve la sesión; error al cerrar sesión, en línea.

## Cambios a UI existente

### Página de inicio anterior (health check)

- **Ubicación:** `src/lib/system/pages/home-page.tsx`, en `/`.
- **Cambia:** se borra junto con el módulo `system` y su e2e. `/` pasa a ser la pantalla de Workspace.

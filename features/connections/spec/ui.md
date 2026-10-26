# Conexiones — UI

Capacidades que debe tener la UI, sin estilos ni componentes concretos: como si fuera HTML sin CSS. Reglas de negocio en `product.md`; aquí se referencian, no se repiten.

Las capacidades (qué muestra, qué permite, estados) son obligatorias. La forma (diálogo, página, ruta, posición) es una propuesta: si el diseño la resuelve distinto, se actualiza este archivo para reflejar lo construido.

## Pantallas nuevas

### Estado vacío de conexiones

- **Ubicación:** ruta `/`, cuando el workspace no tiene conexiones. Es lo primero que se ve al terminar el onboarding. Va a producción.
- **Muestra:** la marca, un título ("Connect your first database"), una línea que explica que se necesita una conexión Postgres para explorar el esquema y ejecutar queries, y el botón "New connection".
- **Permite:** ir al formulario de nueva conexión y cerrar sesión, como hoy en la pantalla de Workspace.
- **Referencia:** el componente `empty` del design system.
- **Estados:** carga mientras se leen las conexiones; error al leerlas, con la opción de reintentar.

### Nueva conexión

- **Ubicación:** ruta `/connections/new`, desde "New connection" del estado vacío. Va a producción.
- **Muestra:**
  - "Connection URL": campo opcional para pegar `postgres://ana:secret@db.acme.dev:5432/acme_prod?sslmode=require`.
  - Campos: "Name" (`Acme prod`), "Host" (`db.acme.dev`), "Port" (`5432`), "Database" (`acme_prod`), "User" (`ana`), "Password" (oculto, con opción de mostrarlo) y "SSL" (Disable, Require, Verify full).
  - Botones "Save connection" y "Cancel".
- **Permite:**
  - Pegar una URL: completa los campos que trae y deja los demás como estaban. El nombre no se completa.
  - Llenar o corregir los campos a mano.
  - Guardar. Al terminar, vuelve a `/`.
  - Cancelar, que vuelve a `/` sin guardar.
- **Estados:**
  - URL no válida: validación en el campo de la URL, sin tocar los demás.
  - Campos obligatorios vacíos, nombre de más de 50 caracteres o puerto fuera de rango: validación en cada campo.
  - Nombre repetido: validación en el campo de nombre.
  - Guardando: el botón queda deshabilitado y muestra un indicador de carga.
  - Error al guardar: aviso arriba del formulario.
- **Referencia:** el formulario de onboarding, para el layout.

### Listado temporal de conexiones

- **Ubicación:** ruta `/`, cuando el workspace tiene al menos una conexión. Es temporal: solo sirve para probar en local y lo reemplaza el shell de la app.
- **Muestra:** por cada conexión, el nombre y `ana@db.acme.dev:5432/acme_prod`; el botón "New connection" y "Sign out".
- **Permite:** eliminar una conexión, con confirmación. Al eliminar la última, vuelve al estado vacío.
- **Estados:** eliminando, el botón de esa fila queda deshabilitado; error al eliminar, en línea.

## Cambios a UI existente

### Workspace (inicio)

- **Ubicación:** `src/lib/workspace/pages/workspace-page.tsx`, en `/`.
- **Cambia:** deja de mostrar solo el nombre del workspace y pasa a mostrar el estado vacío o el listado temporal, según haya conexiones. "Sign out" se mantiene.

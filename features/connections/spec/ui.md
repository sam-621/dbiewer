# Conexiones — UI

Capacidades que debe tener la UI, sin estilos ni componentes concretos: como si fuera HTML sin CSS. Reglas de negocio en `product.md`; aquí se referencian, no se repiten.

Las capacidades (qué muestra, qué permite, estados) son obligatorias. La forma (diálogo, página, ruta, posición) es una propuesta: si el diseño la resuelve distinto, se actualiza este archivo para reflejar lo construido.

## Pantallas nuevas

### Header del workspace

- **Ubicación:** arriba de `/`, en el estado vacío, el de error y el listado temporal. Va a producción.
- **Muestra:** a la izquierda, la marca (logo y "dbiewer"); a la derecha, el perfil del usuario en sesión: avatar, nombre y email.
- **Avatar:** la foto del usuario si tiene; si no, uno generado a partir de su id (`boring-avatars`, variante `marble`).
- **Permite:** nada. El perfil es solo informativo, sin menú ni acciones.

### Estado vacío de conexiones

- **Ubicación:** ruta `/`, cuando el workspace no tiene conexiones. Es lo primero que se ve al terminar el onboarding. Va a producción.
- **Muestra:** el header del workspace y, debajo, un ícono de cuadrícula (`grid-2x2`) en el recuadro de `EmptyMedia` con variante `icon`, un título ("Connect your first database"), una línea que explica que se necesita una conexión Postgres para explorar el esquema y ejecutar queries, y el botón "New connection".
- **Permite:** ir al formulario de nueva conexión.
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
- **Muestra:** el header del workspace y, por cada conexión, el nombre y `ana@db.acme.dev:5432/acme_prod`; el botón "New connection".
- **Permite:** eliminar una conexión, con confirmación. Al eliminar la última, vuelve al estado vacío.
- **Estados:** eliminando, el botón de esa fila queda deshabilitado; error al eliminar, en línea.

## Cambios a UI existente

### Workspace (inicio)

- **Ubicación:** `src/lib/workspace/pages/workspace-page.tsx`, en `/`.
- **Cambia:** deja de mostrar solo el nombre del workspace y pasa a mostrar el header del workspace y, debajo, el estado vacío o el listado temporal, según haya conexiones. Se quita "Sign out": por ahora no hay forma de cerrar sesión desde la app.

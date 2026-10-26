# Conexiones — UI

Capacidades que debe tener la UI, sin estilos ni componentes concretos: como si fuera HTML sin CSS. Reglas de negocio en `product.md`; aquí se referencian, no se repiten.

Las capacidades (qué muestra, qué permite, estados) son obligatorias. La forma (diálogo, página, ruta, posición) es una propuesta: si el diseño la resuelve distinto, se actualiza este archivo para reflejar lo construido.

## Pantallas nuevas

### Header del workspace

- **Ubicación:** arriba de `/`, en el estado vacío, el de error y el listado temporal (`WorkspaceLayout`). Va a producción.
- **Muestra:** a la izquierda, la marca (logo y "dbiewer"); a la derecha, el perfil del usuario en sesión: avatar, nombre y email.
- **Avatar:** la foto del usuario si tiene; si no, uno generado a partir de su id (`boring-avatars`, variante `marble`).
- **Permite:** nada. El perfil es solo informativo, sin menú ni acciones.

### Estado vacío de conexiones

- **Ubicación:** ruta `/`, cuando el workspace no tiene conexiones. Es lo primero que se ve al terminar el onboarding. Va a producción.
- **Muestra:** el header del workspace y, debajo, un ícono de cuadrícula (`grid-2x2`) en el recuadro de `EmptyMedia` con variante `icon`, un título ("Connect your first database"), una línea que explica que se necesita una conexión Postgres para explorar el esquema y ejecutar queries, y el botón "New connection".
- **Permite:** abrir el modal de nueva conexión.
- **Referencia:** el componente `empty` del design system.
- **Estados:** carga mientras se leen las conexiones; error al leerlas, con la opción de reintentar.

### Nueva conexión

- **Ubicación:** modal sobre `/`, que se abre con "New connection" del estado vacío o del listado temporal. Va a producción.
- **Muestra:**
  - Arriba, el motor: ícono de Postgres y "PostgreSQL", y el título "New connection".
  - En una fila, "Name" (`Acme prod`) y "SSL" (Disable, Require, Verify full).
  - Debajo, "Connection URL": campo opcional para pegar `postgres://ana:secret@db.acme.dev:5432/acme_prod?sslmode=require`, con una línea que explica que completa los campos.
  - Debajo, "Host" (`db.acme.dev`) y "Port" (`5432`) en una fila, "Database" (`acme_prod`), "User" (`ana`) y "Password" (oculto, con opción de mostrarlo). Sin tabs ni secciones.
  - Botones "Save connection" y "Cancel".
- **Permite:**
  - Pegar una URL: completa los campos que trae, y SSL si trae `sslmode`, y deja los demás como estaban. El nombre no se completa.
  - Llenar o corregir los campos a mano.
  - Guardar. Al terminar, se cierra el modal y `/` muestra el listado.
  - Cancelar, que cierra el modal sin guardar.
- **Estados:**
  - URL no válida: validación en el campo de la URL, sin tocar los demás. No deja guardar.
  - Campos obligatorios vacíos, nombre de más de 50 caracteres o puerto fuera de rango: validación en cada campo.
  - Nombre repetido: validación en el campo de nombre.
  - Guardando: el botón queda deshabilitado y muestra un indicador de carga.
  - Error al guardar: aviso arriba del formulario.

### Listado temporal de conexiones

- **Ubicación:** ruta `/`, cuando el workspace tiene al menos una conexión. Es temporal: solo sirve para probar en local y lo reemplaza el shell de la app.
- **Muestra:** el header del workspace, el título "Connections", el botón "New connection" y, por cada conexión, el nombre y `ana@db.acme.dev:5432/acme_prod`.
- **Permite:** eliminar una conexión, con confirmación. Al eliminar la última, vuelve al estado vacío.
- **Estados:** eliminando, el botón de esa fila queda deshabilitado; error al eliminar, en línea.

## Cambios a UI existente

### Workspace (inicio)

- **Ubicación:** `src/lib/workspace/pages/workspace-page.tsx`, en `/`.
- **Cambia:** deja de mostrar solo el nombre del workspace y pasa a mostrar el header del workspace y, debajo, el estado vacío o el listado temporal, según haya conexiones. Se quita "Sign out": por ahora no hay forma de cerrar sesión desde la app.

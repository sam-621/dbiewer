# Configuración de cuenta y workspace — UI

Capacidades que debe tener la UI, sin estilos ni componentes concretos: como si fuera HTML sin CSS. Reglas de negocio en `product.md`; aquí se referencian, no se repiten.

Las capacidades (qué muestra, qué permite, estados) son obligatorias. La forma (diálogo, página, ruta, posición) es una propuesta: si el diseño la resuelve distinto, se actualiza este archivo para reflejar lo construido.

## Pantallas nuevas

### Configuración de la cuenta

- **Ubicación:** ruta `/settings/account`. Se llega desde el menú de usuario.
- **Muestra:** avatar (del proveedor o las iniciales), nombre editable (`Ana Torres`), email de solo lectura (`ana@acme.dev`) y los métodos de acceso vinculados (`Email`, `GitHub`). Al final, una zona de peligro con "Delete account".
- **Permite:** cambiar el nombre y guardarlo, y borrar la cuenta.
- **Borrar cuenta:** pide confirmación y explica que se borran el workspace y todo su contenido y que no se puede deshacer. El botón final se habilita solo cuando el usuario escribe su email exacto. Si la sesión no es fresca, en lugar de borrar avisa que tiene que volver a entrar y ofrece cerrar sesión. Al terminar, lleva a `/login`.
- **Estados:** guardando, guardado (aviso breve), nombre vacío o demasiado largo (validación en el campo), email de confirmación que no coincide y error al borrar.

### Configuración del workspace

- **Ubicación:** ruta `/settings/workspace`. Se llega desde el menú de usuario.
- **Muestra:** el nombre del workspace (`Ana's workspace`), editable.
- **Permite:** renombrar el workspace y guardarlo.
- **Estados:** guardando, guardado (aviso breve) y nombre vacío o de más de 60 caracteres.

## Cambios a UI existente

### Menú de usuario

- **Ubicación:** layout de la app, de la feature `auth`.
- **Cambia:** se agregan "Account settings" y "Workspace settings" arriba de "Sign out".

### Layout de la app

- **Ubicación:** layout de la app, de la feature `auth`.
- **Cambia:** el nombre del workspace y el del usuario se actualizan apenas se guardan, sin recargar.

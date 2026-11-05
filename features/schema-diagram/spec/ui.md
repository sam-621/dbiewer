# Diagrama del esquema — UI

Capacidades que debe tener la UI, sin estilos ni componentes concretos: como si fuera HTML sin CSS. Reglas de negocio en `product.md`; aquí se referencian, no se repiten.

Las capacidades (qué muestra, qué permite, estados) son obligatorias. La forma (diálogo, página, ruta, posición) es una propuesta: si el diseño la resuelve distinto, se actualiza este archivo para reflejar lo construido.

## Pantallas nuevas

### Pestaña de diagrama

- **Ubicación:** pestaña fija del workspace, una por conexión. Se llega desde la acción "Diagram" del Explorer; si ya está abierta, se activa.
- **Muestra:** un lienzo con una caja por tabla y una línea por relación, salvo las relaciones hacia tablas centrales (ver `product.md`), y una barra con las acciones.
  - Caja: nombre de la tabla y una fila por propiedad con su nombre, tipo y marcas de PK, FK y nullable. Ejemplo: `orders` con `id uuid PK`, `user_id uuid FK`, `status text`, `created_at timestamptz`.
  - Línea: une la propiedad FK con la propiedad referenciada e indica el tipo de relación en sus extremos. Ejemplo: `orders.user_id` → `users.id`, muchos a uno.
- **Permite:**
  - Arrastrar tablas.
  - Hacer zoom, moverse por el lienzo y ajustar la vista para ver todo.
  - Elegir qué esquema se ve, si hay más de uno.
  - Ir a la tabla referenciada desde el ícono de una propiedad FK.
  - Ver por un momento resaltada la tabla a la que se salta, con un borde como el de foco de los inputs.
  - Ir a una tabla relacionada desde un botón a la derecha del título de la caja, que abre un menú con las tablas a las que apunta y las que apuntan a ella.
  - Volver a la tabla anterior del recorrido, desde un botón encima de la caja a la que se llegó, con el nombre de esa tabla, y descartar el recorrido. Ejemplo: `← Volver a orders ×`.
  - Recargar el diagrama.
  - Volver al acomodo automático.
  - Buscar por nombre de tabla: se resalta en amarillo el texto que coincide y se atenúan las tablas que no coinciden.
  - Borrar la búsqueda con una `x` al final del input, visible solo si hay texto.
- **Referencia:** pestaña de tabla, en la barra de pestañas y el manejo de errores.
- **Estados:**
  - Carga mientras se lee el diagrama.
  - Error al leerlo, con reintento.
  - Vacío si la base no tiene tablas.

## Cambios a UI existente

### Sidebar

- **Ubicación:** controles del tab Explorer, junto a "Collapse all" y "Reload".
- **Cambia:** se agrega la acción "Diagram", que abre la pestaña de diagrama.
- **Cambia:** los inputs de búsqueda de los tabs Explorer y Files muestran una `x` al final si hay texto, para borrarlo.

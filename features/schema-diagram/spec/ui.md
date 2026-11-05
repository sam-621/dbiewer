# Diagrama del esquema — UI

Capacidades que debe tener la UI, sin estilos ni componentes concretos: como si fuera HTML sin CSS. Reglas de negocio en `product.md`; aquí se referencian, no se repiten.

Las capacidades (qué muestra, qué permite, estados) son obligatorias. La forma (diálogo, página, ruta, posición) es una propuesta: si el diseño la resuelve distinto, se actualiza este archivo para reflejar lo construido.

## Pantallas nuevas

### Pestaña de diagrama

- **Ubicación:** pestaña fija del workspace, una por conexión. Se llega desde la acción "Diagram" del Explorer; si ya está abierta, se activa.
- **Muestra:** un lienzo con una caja por tabla y una línea por relación, y una barra con las acciones.
  - Caja: nombre de la tabla, con el esquema si hay más de uno, y una fila por propiedad con su nombre, tipo y marcas de PK, FK y nullable. Ejemplo: `orders` con `id uuid PK`, `user_id uuid FK`, `status text`, `created_at timestamptz`.
  - Valor por defecto: se ve en la fila de la propiedad o al pasar sobre ella. Ejemplo: `now()`.
  - Línea: une la propiedad FK con la propiedad referenciada e indica el tipo de relación en sus extremos. Ejemplo: `orders.user_id` → `users.id`, muchos a uno.
- **Permite:**
  - Arrastrar tablas.
  - Hacer zoom, moverse por el lienzo y ajustar la vista para ver todo.
  - Filtrar por esquema, si hay más de uno.
  - Recargar el diagrama.
  - Volver al acomodo automático.
- **Referencia:** pestaña de tabla, en la barra de pestañas y el manejo de errores.
- **Estados:**
  - Carga mientras se lee el diagrama.
  - Error al leerlo, con reintento.
  - Vacío si la base no tiene tablas.

## Cambios a UI existente

### Sidebar

- **Ubicación:** controles del tab Explorer, junto a "Collapse all" y "Reload".
- **Cambia:** se agrega la acción "Diagram", que abre la pestaña de diagrama.

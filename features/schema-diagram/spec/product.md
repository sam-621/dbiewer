---
status: active
apps: [api, web]
created: 2026-11-04
---

# Diagrama del esquema

## Contexto

Con `shell` el usuario explora su base tabla por tabla, pero no tiene una vista de conjunto: para entender cómo se relacionan las tablas debe abrir la estructura de cada una. Esta feature agrega un diagrama con las tablas y sus relaciones, generado a partir del esquema de la conexión activa.

Es la primera etapa del milestone 6 de `docs/roadmap.md`, y arranca en solo lectura para ver qué se puede mostrar. Los componentes del diagrama se van a reutilizar más adelante, cuando el usuario pueda crear sus propios diagramas.

## Historia de usuario

Como usuario con una base Postgres conectada, quiero ver sus tablas y relaciones en un diagrama que pueda acomodar, para entender la estructura de la base de un vistazo.

## Flujo

1. Desde el Explorer, el usuario abre el diagrama de la conexión activa en una pestaña.
2. La web pide el diagrama a la api y lo acomoda automáticamente: cada tabla es una caja con sus propiedades y cada relación es una línea entre cajas.
3. El usuario arrastra las tablas, hace zoom y se mueve por el lienzo.
4. Si la base tiene varios esquemas, elige cuál quiere ver.
5. Si la base cambió, recarga el diagrama.

## Reglas de negocio

### Solo lectura

- El diagrama no modifica la base del usuario ni su estructura.
- No se pueden crear, editar ni eliminar tablas, propiedades o relaciones. Lo único que cambia el usuario es dónde está cada tabla y qué parte del lienzo ve.

### Contenido

- El diagrama se lee en vivo de la base del usuario y no se guarda en dbiewer, igual que el esquema.
- Incluye las tablas de los mismos esquemas que muestra el Explorer. Las vistas y las funciones no entran.
- Cada tabla muestra sus propiedades con nombre, tipo, valor por defecto, si acepta nulos y si es PK o FK.
- Cada FK es una relación. Una FK apunta siempre desde la tabla que la tiene hacia la tabla referenciada.
- Una relación es `ONE_TO_ONE` si las columnas de la FK son PK o tienen un unique; si no, es `MANY_TO_ONE`.
- `MANY_TO_MANY` no se deriva del esquema: una tabla intermedia se muestra como tabla, con sus dos relaciones `MANY_TO_ONE`. El valor queda para los diagramas propios.
- Una relación solo aparece si las dos tablas están en el diagrama.

### Acomodo

- La posición inicial de las tablas se calcula automáticamente.
- Las posiciones que deja el usuario se recuerdan en el navegador, por conexión. Una tabla nueva se ubica con el acomodo automático.
- El usuario puede volver al acomodo automático.

### Legibilidad

- El modo foco está apagado y no tiene botón por ahora. La lógica se conserva hasta decidir si se quita del todo.
- Con el modo foco encendido, al pasar sobre una tabla se resaltan ella, sus relaciones y sus tablas vecinas, y el resto se atenúa. Con un clic el foco queda fijo hasta hacer clic en otra tabla o en el lienzo vacío, o hasta apagar el modo.
- Una tabla es central si recibe relaciones desde al menos 8 tablas y desde al menos el 25 % de las tablas visibles. Las relaciones de una tabla consigo misma no cuentan.
- Las relaciones hacia una tabla central no cuentan para el acomodo y solo se ven con foco en una de sus dos tablas. El modo foco solo controla el efecto de pasar y hacer clic: apagado, esas relaciones siguen ocultas.
- Cada tabla muestra siempre todas sus propiedades.
- El buscador trabaja solo con nombres de tabla, sin distinguir mayúsculas: resalta en amarillo la parte del nombre que coincide y atenúa las tablas que no coinciden, junto con las líneas que las tocan. No filtra ni mueve la vista.
- Si hay foco y búsqueda a la vez, una tabla o línea se atenúa si cualquiera de los dos la atenúa.

### Esquemas

- Se ve un solo esquema a la vez, y se elige con un select que aparece solo si hay más de uno.
- Al abrir se ve `public` si existe; si no, el primer esquema.
- Una relación entre dos esquemas no se dibuja, porque sus dos tablas nunca están visibles a la vez.

### Navegación

- El ícono de una propiedad FK lleva a la tabla referenciada: el lienzo se centra en ella.
- Si la tabla referenciada está en otro esquema, se cambia a ese esquema y luego se centra.
- Cada tabla con relaciones hacia otras tablas tiene un botón que las lista, en dos grupos: a las que apunta y las que apuntan a ella. Cada tabla sale una vez por grupo, y con su esquema si es otro. Elegir una lleva a ella igual que el ícono de una FK, y cuenta como un paso del recorrido.
- Al saltar a una tabla, su caja se resalta por un momento para ubicarla, aunque el buscador la atenúe. Es solo visual.
- Al llegar a una tabla por una FK o por el botón de relaciones, esa tabla ofrece volver a la anterior. El recorrido se guarda en memoria: con A → B → C se puede regresar paso a paso hasta A.
- Ir a otra tabla desde la tabla actual del recorrido agrega un paso, salvo que sea la misma tabla. Ir desde otra tabla empieza un recorrido nuevo desde esa tabla.
- El recorrido se borra con la `×`, al cambiar de esquema con el select, al volver al acomodo automático y al recargar.
- Mover el lienzo, hacer zoom, arrastrar, enfocar, buscar o cambiar de pestaña no cambian el recorrido.

## Decisiones

- **Tablas y relaciones en listas planas, no anidadas**: las relaciones de una base forman un grafo, con ciclos y tablas referenciadas muchas veces. Anidar repetiría tablas, no terminaría con los ciclos y obligaría a elegir una tabla raíz. Además, GraphQL fija la profundidad en cada query.
- **Query nueva en vez de ampliar `connectionSchema`**: esa query alimenta al Explorer y no dice a qué tabla apunta cada FK.
- **La api solo expone el diagrama**: cómo se pinta lo decide la web. La api no devuelve posiciones ni datos de presentación.
- **Modelo independiente de Postgres**: la web trabaja con entidades, propiedades y relaciones, para que los diagramas propios usen los mismos componentes.
- **Tipo de relación como enum**: un booleano dejaría al modelo atado a lo que expresa una FK y no serviría para los diagramas propios.
- **React Flow para el lienzo**: lo eligió el usuario.
- **Acomodo por fuerzas en vez de por capas**: un esquema es una red y no un flujo con dirección. Por capas, una base real sale en pocas columnas muy altas; con fuerzas las tablas relacionadas quedan cerca.
- **Foco y tablas centrales**: en una base real no alcanza con mejorar el acomodo, porque mostrar todo a la vez no se entiende. Una tabla referenciada por casi todas conecta todo con todo y oculta los grupos reales.
- **Volver desde la tabla y no desde la barra**: pegado a la tabla no hace falta detectar si el usuario se fue. Si se mueve, deja de verse, pero no se pierde; lo que borra el recorrido es siempre una acción deliberada.
- **Posiciones en `localStorage`**: sin guardarlas, el acomodo se perdería al cambiar de pestaña. Guardarlas en la api queda para los diagramas propios.

## Fuera de alcance

- Crear o editar diagramas propios, y guardarlos en la api.
- Modificar la estructura de la base desde el diagrama.
- Export a PNG, SVG o DBML.
- Grupos visuales por esquema o por cluster de FK. El acomodo automático separa componentes conexos, pero no los marca en el lienzo.
- Vistas y funciones en el diagrama.
- Detectar tablas intermedias y colapsarlas en una relación `MANY_TO_MANY`.

## Plan de trabajo recomendado

1. [x] api: lectura del diagrama en `PostgresService` y query `schemaDiagram`, con sus tests e2e e integración.
2. [x] web: componentes del diagrama con React Flow, que reciben entidades y relaciones sin depender de la api.
3. [x] web: pestaña de diagrama, entrada desde el Explorer, acomodo automático y posiciones por conexión.
4. [x] web: select de esquema, navegación por FK, recarga y volver al acomodo automático.

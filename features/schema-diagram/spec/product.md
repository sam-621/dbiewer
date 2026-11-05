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
4. Si la base tiene varios esquemas, filtra cuáles quiere ver.
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

### Esquemas

- Se ven todos los esquemas al abrir. El filtro aparece solo si hay más de uno.
- Al ocultar un esquema se ocultan sus tablas y las relaciones que las tocan.

## Decisiones

- **Tablas y relaciones en listas planas, no anidadas**: las relaciones de una base forman un grafo, con ciclos y tablas referenciadas muchas veces. Anidar repetiría tablas, no terminaría con los ciclos y obligaría a elegir una tabla raíz. Además, GraphQL fija la profundidad en cada query.
- **Query nueva en vez de ampliar `connectionSchema`**: esa query alimenta al Explorer y no dice a qué tabla apunta cada FK.
- **La api solo expone el diagrama**: cómo se pinta lo decide la web. La api no devuelve posiciones ni datos de presentación.
- **Modelo independiente de Postgres**: la web trabaja con entidades, propiedades y relaciones, para que los diagramas propios usen los mismos componentes.
- **Tipo de relación como enum**: un booleano dejaría al modelo atado a lo que expresa una FK y no serviría para los diagramas propios.
- **React Flow para el lienzo**: lo eligió el usuario.
- **Posiciones en `localStorage`**: sin guardarlas, el acomodo se perdería al cambiar de pestaña. Guardarlas en la api queda para los diagramas propios.

## Fuera de alcance

- Crear o editar diagramas propios, y guardarlos en la api.
- Modificar la estructura de la base desde el diagrama.
- Export a PNG, SVG o DBML.
- Acomodo por clusters de FK y grupos visuales por esquema.
- Vistas y funciones en el diagrama.
- Detectar tablas intermedias y colapsarlas en una relación `MANY_TO_MANY`.

## Plan de trabajo recomendado

1. [x] api: lectura del diagrama en `PostgresService` y query `schemaDiagram`, con sus tests e2e e integración.
2. [ ] web: componentes del diagrama con React Flow, que reciben entidades y relaciones sin depender de la api.
3. [ ] web: pestaña de diagrama, entrada desde el Explorer, acomodo automático y posiciones por conexión.
4. [ ] web: filtro de esquemas, recarga y volver al acomodo automático.

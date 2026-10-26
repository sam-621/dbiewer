# Roadmap de dbiewer

Milestones de producto, no tareas. Cada milestone se trabaja como una feature en `features/<slug>/`.

## Qué es dbiewer

Un espacio de trabajo visual para tu base de datos, en el navegador. Pegas un connection string y obtienes:

1. **Canvas del esquema**: mapa de tablas y relaciones (FK) con auto-layout. Export PNG, SVG o DBML.
2. **SQL playground**: autocompletado que conoce tus tablas y joins, ⌘↵ ejecuta la query bajo el cursor, `EXPLAIN` en árbol, queries guardadas y export.
3. **Asistente IA**: escribe SQL a partir del esquema real. Nunca escribe en la base. Se cobra por créditos.
4. **Vista de tabla**: hoja de cálculo con filtros, FKs navegables y edición con revisión antes de aplicar.

Modelo freemium:

- **Free**: 1 conexión, 50 créditos de IA al mes, 7 días de historial.
- **Pro** ($19/mes, $15 anual): 10 conexiones, 500 créditos, historial ilimitado, SSH tunnel, snapshots y diff entre entornos, trial de 14 días.

## Fase 1: MVP usable (solo Postgres)

- [ ] **1. Cuentas y workspace**: registro, login, sesión y un workspace por usuario. Todo lo demás cuelga de aquí: las conexiones y las credenciales cifradas son por workspace.
  - [x] `auth`: magic link, sesión, onboarding, workspace como tenant, pantalla de acceso y logout.
  - [ ] `social-login`: acceso con GitHub y Google, con vinculación por email.
  - [ ] `account-settings`: cambiar el nombre, borrar la cuenta y renombrar el workspace.
- [ ] **2. Conexiones**: pegar la URI, probar la conexión, elegir los esquemas y guardar las credenciales cifradas. Listar, editar y borrar conexiones. Crear una conexión o editar sus credenciales pide una sesión reciente (último inicio de sesión hace menos de 24 horas), igual que borrar la cuenta.
- [ ] **3. Exploración del esquema**: introspección y explorador lateral de esquemas, tablas, columnas, PK/FK e índices. Es la capa de datos del canvas, el autocompletado y la IA.
- [ ] **4. SQL playground**: editor con pestañas, ejecutar la query bajo el cursor, grilla de resultados, errores legibles, cancelar, límites de filas y tiempo, e historial de queries.
- [ ] **5. Queries guardadas y export**: guardar con ⌘S y exportar resultados a CSV o JSON.

## Fase 2: Diferenciadores

- [ ] **6. Canvas del esquema**: mapa visual, auto-layout por clusters de FK, grupos por esquema y export PNG, SVG o DBML.
- [ ] **7. Autocompletado inteligente y EXPLAIN**: columnas, alias y joins inferidos de las FKs. `EXPLAIN ANALYZE` en árbol.
- [ ] **8. Asistente IA**: chat basado en el esquema, adjuntar tablas como contexto, Copiar/Ejecutar/Abrir en el editor, chats guardados y buscables.
- [ ] **9. Vista de tabla**: pantalla completa, constructor visual de `WHERE`, paginación por cursor, saltar de una FK a la fila referenciada, edición inline con revisión.

## Fase 3: Monetización y lanzamiento

- [ ] **10. Planes y suscripciones**: Stripe, Free y Pro, límites por plan (conexiones, créditos, retención del historial), trial, página de billing y paquetes extra de créditos. Cambiar el plan o el medio de pago pide una sesión reciente.
- [ ] **11. Demo pública**: una base de ejemplo de solo lectura que se abre sin cuenta. Respalda los botones "See a demo" de la landing.
- [ ] **12. Listo para público**: docs, changelog, privacidad y términos, página de estado y analítica de producto.

## Fase 4: Expansión

- [ ] **13. Más motores**: MySQL primero, después SQLite.
- [ ] **14. Bases privadas**: SSH tunnel.
- [ ] **15. Snapshots y diff de esquema** entre entornos.
- [ ] **16. Team y Enterprise**: workspaces compartidos, compartir queries, SSO, audit log y self-hosted.

## Decisiones pendientes

- **Alcance de motores.** El FAQ de la landing menciona MariaDB, ClickHouse, PlanetScale, Mongo y BigQuery, pero `.claude/harness.json` solo define `postgres`. Hay que recortar la landing o asumir ese alcance.
- **SQLite en un cliente web.** No se conecta por URI: hay que elegir entre subir el archivo o un agente local (el footer menciona un "CLI").
- **Lectura vs. escritura.** El FAQ dice "Only on read", pero el playground y la vista de tabla permiten escribir. Propuesta: lectura por defecto y escrituras con confirmación explícita.
- **Conexiones salientes (SSRF).** El servidor se conecta a hosts arbitrarios: bloquear localhost y redes internas desde el milestone 2.

# dbiewer

Cliente SQL web: conectarse a bases de datos, explorar su esquema y ejecutar queries desde el navegador

## Apps

| App | Qué es | Stack |
|-----|--------|-------|
| `apps/api` | Backend: conexiones a las bases de datos del usuario, ejecución de queries, esquema e historial | Express, GraphQL Yoga, Drizzle, Postgres |
| `apps/web` | Cliente web: editor SQL, explorador del esquema, grilla de resultados e historial | React, Vite, Tailwind, i18next |

## Trabajo con Claude Code

- `CLAUDE.md` en la raíz y en cada app: reglas y qué doc leer antes de escribir código.
- `<app>/docs/`: arquitectura, estilo de código, testing y comandos de cada app o paquete.
- `features/<slug>/`: spec y bitácora de cada feature. Se empieza con `/session-start <slug>`.
- `/commit`: commits con el formato del repo.
- `/harness add-app <nombre>`: agrega una app con su `CLAUDE.md`, docs y agentes.

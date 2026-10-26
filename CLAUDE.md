# dbiewer

Cliente SQL web: conectarse a bases de datos, explorar su esquema y ejecutar queries desde el navegador

Monorepo sin workspaces: cada app en `apps/` tiene su propio `package.json`, `node_modules` y `CLAUDE.md`. Los comandos se corren dentro de la app.

## Apps

| App | Qué es | Stack |
|-----|--------|-------|
| `apps/api` | Backend: conexiones a las bases de datos del usuario, ejecución de queries, esquema e historial | Express, GraphQL Yoga, Drizzle, Postgres |
| `apps/web` | Cliente web: editor SQL, explorador del esquema, grilla de resultados e historial | React, Vite, Tailwind, i18next |
| `apps/www` | Landing de dbiewer: presenta el producto y lleva al cliente web | Astro, Tailwind |

Antes de escribir código en una app, leer su `CLAUDE.md`.

## Features

`features/<slug>/` guarda el contexto de trabajo que cruza apps:

- `spec/product.md`: contexto, flujo, reglas de negocio, decisiones vigentes y plan de trabajo recomendado. `status` en el frontmatter (`active` | `done`).
- `spec/technical.md`: modelo, API e impacto en código existente.
- `spec/ui.md`: capacidades de la UI y dónde vive, sin estilos.
- `log.md`: bitácora con una entrada por día y por autor.

Plantillas en `features/_templates/`. Una feature se crea solo cuando el usuario lo pide.

El trabajo sobre una feature empieza con `/session-start <slug>`. Sin él, no leer ni escribir en `features/`, salvo que el usuario lo pida. Dentro de esa conversación:

- Al terminar cada tarea, agregarla a la entrada de hoy del autor en `log.md` (`## YYYY-MM-DD — <autor>`, autor = parte antes de la `@` de `git config user.email`). Si la entrada no existe, crearla al final.
- Al terminar un paso del plan de trabajo recomendado, marcarlo `[x]` en `spec/product.md`.
- Si cambia una regla, decisión, parte técnica o de UI, proponer el cambio al `spec/` y escribirlo solo cuando el usuario confirme.
- Conflictos de git en `log.md`: aceptar ambas versiones.

## Docs de las apps

- La carpeta `docs/` de cada app o paquete es la fuente de verdad de cómo se escribe su código. Si un archivo existente lo contradice, manda el doc.
- Si se toma una decisión nueva de arquitectura, estilo o testing, o lo construido ya no coincide con el doc, proponer el cambio al doc y escribirlo solo cuando el usuario confirme.
- Si un comando de `docs/commands.md` todavía no existe en el `package.json`, avisar en vez de inventar otro.
- Las decisiones con las que se armó el harness están en `.claude/harness.json`. Una app nueva se agrega con `/harness add-app <nombre>`.

## Reglas generales

- Tocar solo la app en la que se está trabajando, salvo que se pida lo contrario.
- Commits solo con `/commit`.

## Reportes al usuario

- Corto y en listas de una línea por ítem: **Quedó** y **Pendiente**.
- No explicar cómo quedó el código ni repetir lo que ya se ve en el diff: el usuario lo lee directo. Si quiere detalle, lo pide.
- No hacer preguntas de decisión ni adelantarse a lo que sigue: el usuario marca el rumbo y pide lo que necesita. Riesgos o avisos, una línea cada uno dentro de Pendiente, sin pregunta.
- Aplica también a los reportes que se reenvían de los subagentes.

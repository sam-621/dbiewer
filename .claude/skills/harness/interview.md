# Entrevista

Pocas rondas. Cada ronda es una llamada a `AskUserQuestion` (máximo 4 preguntas por llamada), nunca preguntas escritas en el mensaje. Si una pregunta parece abierta, convertirla en opciones concretas: el usuario puede escribir lo suyo en "Other". La primera opción de cada pregunta es la recomendada. Lo que el usuario ya dijo no se pregunta.

## Ronda 1 — Proyecto y apps

Si no vino en el argumento, preguntar el nombre del proyecto y una línea de qué es (texto libre: es lo único de esta ronda que no tiene opciones).

Con eso, mostrar la propuesta de apps como lista, cada una con su línea de qué hace en este proyecto:

```
Propongo:
- api — backend (Node + TypeScript): ...
- web — frontend (React + Vite): ...
```

Y en el mismo turno, una sola llamada a `AskUserQuestion`. Nunca cerrar la ronda con una pregunta abierta en texto: el usuario tiene que ver claro qué contestar.

| Pregunta | Opciones | Notas |
|----------|----------|-------|
| ¿Las apps propuestas te sirven? | **Sí, así** · Cambiar nombres · Quitar alguna | single |
| ¿Agregamos alguna pieza extra? | **Ninguna** · 3 piezas que tengan sentido para este proyecto (p. ej. paquete de tipos compartidos, landing, e2e, migraciones de la DB, admin, infra) | `multiSelect`; cada opción dice qué sería y dónde vive (`apps/` o `packages/`) |
| Una duda de producto o arquitectura que cambie lo que hace cada app, si la descripción la deja abierta (p. ej. "¿Qué motores soporta al inicio?" → Postgres · MySQL · SQLite) | La recomendada primero | solo si aplica; máximo 2; `multiSelect` si se pueden elegir varias |

Con las respuestas:

- **Cambiar nombres** o **Quitar alguna**: otra `AskUserQuestion` concreta (qué app quitar, con una opción por app; o qué nombre, con 2-3 nombres sugeridos por app). No pedir "dime qué cambio".
- Si eligió **Other** en cualquier pregunta, tomar su texto y seguir; si no queda claro, repreguntar solo eso.
- Si agregó un `site`, preguntar su stack en la misma ronda: **Astro** · otro (Other).
- Si la duda de arquitectura cambia la propuesta, volver a mostrar la lista y repetir solo la primera pregunta.

Cada pieza tiene `name` (kebab-case, es el scope del commit), `kind`, `location` (`apps` o `packages`) y una línea de qué es. Lo que se comparte entre apps (tipos, configs, utilidades) va en `packages/`; lo demás en `apps/`.

| Kind | Qué es | Docs y agentes |
|------|--------|----------------|
| `backend` | API, workers con lógica de negocio | sí |
| `frontend` | SPA o app web con lógica de UI | sí |
| `site` | landing, docs, blog (Astro, estático) | solo `CLAUDE.md` |
| `custom` | cualquier otra pieza: paquete de tipos, migraciones y config de la DB, proyecto de e2e, infra, worker | sí, escritos a partir de su descripción |

Si lo que describe el usuario no encaja claro en backend o frontend, es `custom`: no forzarlo.

## Ronda 2 — Global

| Pregunta | Opciones | Clave |
|----------|----------|-------|
| Package manager | **yarn** · pnpm · npm | `packageManager` |
| Monorepo | **Sin workspaces: cada app independiente** · Workspaces con `packages/` compartido | `workspaces` |

Si alguna pieza vive en `packages/`, los workspaces son obligatorios: no se pregunta, se avisa en la confirmación.
| Comentarios en el código | **Prohibidos salvo que se pidan** · Solo para explicar el porqué | `style.comments` (`none` · `why`) |
| Commits | **`tipo(app): desc`, solo título, sin atribución** · Igual pero con cuerpo opcional | `commits.body` (`false` · `true`) |

## Ronda 3 — Por cada backend

Si hay varios backends, preguntar primero por uno y ofrecer copiar las respuestas a los demás.

| Pregunta | Opciones | Clave |
|----------|----------|-------|
| Arquitectura | **DDD: módulos con aggregates, entidades, value objects y use cases** · Modular: módulos con use cases y repos, sin capa de dominio · Capas: controllers → services → repositories | `architecture` (`ddd` · `modular` · `layered`) |
| API | **GraphQL (GraphQL Yoga)** · REST · tRPC | `api` (`graphql` · `rest` · `trpc`) |
| Base de datos | **Postgres + Knex** · Postgres + Prisma · Postgres + Drizzle · Sin DB | `db` (`knex` · `prisma` · `drizzle` · `none`) |
| Tests | **Completo: unit + integración + e2e con Postgres en Docker** · Ligero: unit + e2e · Por ahora no se escriben | `tests` (`full` · `light` · `none`) |

Segunda llamada, solo si aplica:

| Pregunta | Cuándo | Opciones | Clave |
|----------|--------|----------|-------|
| Multi-tenant | `db` ≠ `none` | **No** · Sí, aislado con RLS de Postgres | `rls` |
| Errores de negocio | `architecture` ≠ `layered` (en capas siempre se lanzan y `errors` = `throw`) | **Se retornan desde use cases y services; el dominio lanza** · Se lanzan y un handler los mapea | `errors` (`return` · `throw`) |

Defaults sin preguntar: Node + TypeScript, Express, zod para validar, Vitest, ESLint + Prettier con `simple-import-sort`, dinero en centavos. Se muestran en la confirmación.

## Ronda 4 — Por cada frontend

| Pregunta | Opciones | Clave |
|----------|----------|-------|
| Framework | **React + Vite (SPA)** · Next.js (App Router) | `framework` (`react-vite` · `next`) |
| Datos | **El mismo estilo de la API (GraphQL con codegen / REST / tRPC) + React Query** · Otro | `data` (`graphql` · `rest` · `trpc`) |
| Texto visible | **i18n con en y es** · Solo español · Solo inglés | `i18n` (`["en","es"]` · `false`) y `uiLanguage` |
| Tests | **Por ahora no se escriben** · Unit con Vitest + Testing Library · Unit + e2e con Playwright | `tests` (`none` · `unit` · `e2e`) |

Defaults sin preguntar: Tailwind v4, shadcn/ui, lucide, React Hook Form + zod, React Router (en SPA). Se muestran en la confirmación.

## Ronda 4b — Por cada custom (texto libre)

Una sola pregunta abierta, con la propuesta ya armada a partir de lo que dijo el usuario, para que confirme o corrija:

```
packages/types — tipos de GraphQL compartidos entre api y web
- Qué es y qué no: solo tipos generados con codegen desde el schema de api; sin runtime.
- Quién lo usa: web (import de @acme/types); api genera los tipos.
- Stack: TypeScript, graphql-codegen.
- Comandos: build (agente), gen (agente, necesita el schema).
- Tests: ninguno.
- Agentes implementer y reviewer: sí.
¿Así o cambio algo?
```

Se guarda en el manifiesto como `purpose` (qué es, qué hace y qué no, en un párrafo), `consumers`, `stack`, `tests` (`none` · `yes`) y `agents`. Los comandos y las reglas que mencione se usan para llenar sus docs.

## Ronda 5 — Agentes

Solo si hay más de una pieza backend, frontend o custom. Por defecto todas llevan `<app>-implementer` y `<app>-reviewer`. Preguntar si alguna no los necesita.

## Confirmación

Ver el paso 2 de `SKILL.md`.

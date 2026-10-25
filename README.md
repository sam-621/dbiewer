# monorepo-harness

Template del harness de Claude Code para monorepos web, sacado de Vendyx. Se usa con el skill `/harness`: entrevista corta, y el proyecto queda con su `CLAUDE.md`, docs por app, agentes y flujo de features listos para trabajar.

## Usar

Este repo es un template de GitHub: cada proyecto nuevo sale de él y se convierte en el proyecto. Nada se instala global.

1. En GitHub, **Use this template → Create a new repository** con el nombre del proyecto (por ejemplo `acme`). El repo nuevo arranca con un solo commit, sin el historial del template.
2. Clonarlo e iniciar el harness:

```
git clone git@github.com:<usuario>/acme.git && cd acme && claude
> /harness init acme — plataforma para que las tiendas vendan en línea
```

`/harness init` arma el harness en esa misma carpeta y reemplaza este README. El skill se queda en `.claude/skills/harness/` del proyecto, así que más adelante, dentro del proyecto:

```
> /harness add-app admin
```

Sin GitHub también sirve copiar la carpeta (`cp -R monorepo-harness acme`) o usar `npx degit <usuario>/monorepo-harness acme`. Si la copia trae el `.git` del template, conviene borrarlo y hacer `git init`.

Las mejoras al template se hacen en este repo. Los proyectos ya creados conservan la versión con la que nacieron.

## Qué es fijo y qué se elige

**Fijo (el flujo):** `features/` con spec y log, `/session-start`, `/commit`, un agente `<app>-implementer` y uno `<app>-reviewer` por app, `CLAUDE.md` raíz con la tabla de apps y `CLAUDE.md` por app con la tabla "Antes de escribir código".

**Se elige en la entrevista (el contenido de los docs):**

| Decisión | Opciones |
|----------|----------|
| Apps y paquetes | `backend`, `frontend`, `site` o `custom` (cualquier otra pieza: tipos compartidos, DB y migraciones, e2e, infra), en `apps/` o `packages/` |
| Monorepo | sin workspaces (como Vendyx) o con workspaces |
| Arquitectura backend | DDD (aggregates, entidades, VOs, use cases) · modular (use cases + repos) · capas |
| API | GraphQL · REST · tRPC |
| Base de datos | Knex · Prisma · Drizzle · sin DB, con o sin RLS multi-tenant |
| Errores | retornados (como Vendyx) · lanzados |
| Frontend | React + Vite · Next.js, con o sin i18n |
| Testing | por app: completo, ligero o "por ahora no" |
| Estilo | sin comentarios o solo el porqué; commits con o sin cuerpo |

Las decisiones quedan en `.claude/harness.json` del proyecto. A partir de ahí los docs evolucionan solos: el `CLAUDE.md` raíz pide proponer cambios a `docs/` cuando aparece una decisión nueva, y el reviewer reporta los "patrones sin documentar".

## Estructura

```
.claude/skills/harness/
├── SKILL.md                 el skill /harness: modos, pasos, sintaxis de templates
├── interview.md             las preguntas, opciones y defaults
├── manifest.example.json    forma de .claude/harness.json
├── template/                archivos del flujo
│   ├── CLAUDE.md, README.md, gitignore
│   ├── claude/              settings.json, skills commit y session-start
│   ├── features/_templates/ spec/product.md, technical.md, ui.md, log.md
│   ├── vscode/settings.json
│   └── app/                 CLAUDE.md, commands.md y agents/ de cada app
├── presets/                 contenido de los docs por decisión
│   ├── backend/             architecture-{ddd,modular,layered}, code-style, testing, database
│   ├── frontend/            architecture, code-style, testing
│   └── custom/              esqueletos con <!-- llenar --> que Claude completa según la descripción
└── scripts/
    ├── render.mjs           resuelve tokens y bloques condicionales con el manifiesto
    └── check.mjs            renderiza todas las combinaciones y falla si algo queda sin resolver
```

## Modificar el template

- Un patrón nuevo que quieras en todos los proyectos va en `presets/`. Si depende de una opción, va dentro de `<!-- si: clave=valor -->` … `<!-- /si -->`.
- Una opción nueva: agregarla en `interview.md`, `manifest.example.json`, en los presets que la usan y en `scripts/check.mjs`.
- Después de cualquier cambio: `node .claude/skills/harness/scripts/check.mjs`.

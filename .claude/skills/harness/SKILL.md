---
name: harness
description: Crea el harness de un monorepo nuevo (CLAUDE.md raíz y por app, docs de arquitectura, estilo, testing y comandos, agentes implementer/reviewer, features/, /commit y /session-start) a partir de una entrevista, o agrega una app a un proyecto que ya lo tiene. Usar solo cuando el usuario lo pida (/harness).
argument-hint: "init <nombre> — <descripción> | add-app <nombre>"
disable-model-invocation: true
---

# Harness

Arma el harness de un monorepo con el flujo de Vendyx. El **flujo** es fijo y sale de `template/`. El **contenido** de los docs (arquitectura, estilo, testing, base de datos, comandos) se arma con los bloques de `presets/` según lo que el usuario elija.

El repo `monorepo-harness` es un template: se copia a una carpeta nueva y `/harness init` convierte esa copia en el proyecto, en el mismo directorio. El skill se queda en el proyecto (`.claude/skills/harness/`) para poder correr `/harness add-app` más adelante.

- Las rutas de origen (`template/`, `presets/`, `scripts/`) son relativas a la carpeta de este skill (`${CLAUDE_SKILL_DIR}`, o la carpeta donde vive este `SKILL.md`).
- Las rutas de destino son relativas a la raíz del proyecto: el directorio donde se abrió Claude, que contiene `.claude/skills/harness/`.
- Nunca se escribe ni se borra nada dentro de `.claude/skills/harness/`.

## Modo

1. Si existe `.claude/harness.json`, el proyecto ya está armado y el modo es **add-app**. Si el argumento pide `init`, avisar que ya está armado y parar.
2. Si no existe, el modo es **init**. La copia del template trae archivos que son solo del template y se reemplazan sin preguntar ni avisar: `README.md` (empieza con `# monorepo-harness`) y `.vscode/settings.json`. Si además hay código, un `CLAUDE.md` u otros archivos, avisar qué hay y no sobrescribir nada sin confirmar archivo por archivo.
3. Si la carpeta se llama `monorepo-harness`, es el template original y no una copia: avisar y parar salvo que el usuario confirme que sí quiere convertirla.
4. `add-app <nombre>`: saltar al apartado [Agregar una app](#agregar-una-app).

No revisar ni comentar git (remotes, historial, commits): no es parte del harness. Sin preámbulo de chequeos: si nada de lo anterior aplica, empezar directo con la entrevista.

## Preguntas

Toda pregunta al usuario va con `AskUserQuestion`, con opciones concretas y la recomendada primero. Nunca terminar un mensaje con una pregunta en texto ("¿agregas algo?", "dime qué motores…"). La única excepción es el nombre y la descripción del proyecto, si no vinieron en el argumento.

## Init

### 1. Entrevista

Seguir `interview.md`. Lo que ya venga en el argumento o en el mensaje del usuario no se vuelve a preguntar. Lo que no se pregunta toma el default de `interview.md`.

### 2. Confirmación

Antes de escribir un solo archivo, mostrar el resumen en una tabla corta:

- Proyecto, package manager, workspaces, commits.
- Por app: tipo, stack, y las decisiones que se eligieron.
- Defaults que no se preguntaron (librería de UI, formularios, framework HTTP, runner de tests, lint), para que el usuario pueda cambiarlos.

Esperar confirmación. Si el usuario cambia algo, actualizar y volver a mostrar solo lo que cambió.

### 3. Manifiesto

Escribir `.claude/harness.json` con todas las decisiones (forma en `manifest.example.json`). Es la fuente de las opciones para el resto de la generación y para `add-app`.

### 4. Cómo se genera cada archivo

Cada archivo se genera con el renderer, que resuelve tokens y bloques condicionales a partir del manifiesto:

```bash
node ${CLAUDE_SKILL_DIR}/scripts/render.mjs .claude/harness.json ${CLAUDE_SKILL_DIR}/<origen> [app] > <destino>
```

Después se lee el resultado y se adapta (ver [Adaptar, no copiar](#adaptar-no-copiar)). El renderer no inventa nada: si un archivo sale raro, se corrige el preset en este repo, no a mano en el proyecto.

### 5. Archivos de la raíz

| Origen | Destino |
|--------|---------|
| `template/CLAUDE.md` | `CLAUDE.md` |
| `template/README.md` | `README.md` |
| `template/gitignore` | `.gitignore` |
| `template/claude/settings.json` | `.claude/settings.json` |
| `template/claude/skills/commit/SKILL.md.tmpl` | `.claude/skills/commit/SKILL.md` |
| `template/claude/skills/session-start/SKILL.md.tmpl` | `.claude/skills/session-start/SKILL.md` |
| `template/features/_templates/*` | `features/_templates/*` (igual, sin tocar) |
| `template/vscode/settings.json` | `.vscode/settings.json` |

Si hay workspaces (obligatorios si alguna pieza vive en `packages/`), además `package.json` raíz con `private: true`, `workspaces: ["apps/*", "packages/*"]` (o `pnpm-workspace.yaml`) y la carpeta `packages/`.

### 6. Archivos por app o paquete

Para cada pieza, según su `kind`. `<path>` es `<location>/<name>` (`apps/api`, `packages/types`):

| Origen | Destino | Kind |
|--------|---------|------|
| `template/app/CLAUDE.md` | `<path>/CLAUDE.md` | todos |
| `presets/backend/architecture-<architecture>.md` | `<path>/docs/architecture.md` | backend |
| `presets/backend/code-style.md` | `<path>/docs/code-style.md` | backend |
| `presets/backend/testing.md` | `<path>/docs/testing.md` | backend |
| `presets/backend/database.md` | `<path>/docs/database.md` | backend con `db` ≠ `none` |
| `presets/frontend/architecture.md` | `<path>/docs/architecture.md` | frontend |
| `presets/frontend/code-style.md` | `<path>/docs/code-style.md` | frontend |
| `presets/frontend/testing.md` | `<path>/docs/testing.md` | frontend |
| `template/app/commands.md` | `<path>/docs/commands.md` | backend, frontend |
| `presets/custom/architecture.md` | `<path>/docs/architecture.md` | custom |
| `presets/custom/code-style.md` | `<path>/docs/code-style.md` | custom |
| `presets/custom/testing.md` | `<path>/docs/testing.md` | custom |
| `presets/custom/commands.md` | `<path>/docs/commands.md` | custom |
| `template/app/agents/implementer.md.tmpl` | `.claude/agents/<app>-implementer.md` | backend, frontend, custom con `agents: true` |
| `template/app/agents/reviewer.md.tmpl` | `.claude/agents/<app>-reviewer.md` | backend, frontend, custom con `agents: true` |

Las apps `site` solo llevan `CLAUDE.md` (sin `docs/` ni agentes), salvo que el usuario pida más.

#### Piezas `custom`

Para todo lo que no es backend, frontend ni site: un paquete de tipos compartidos, la configuración y migraciones de la DB, un proyecto de e2e, infraestructura, un worker. Los presets de `custom` son esqueletos con marcadores `<!-- llenar: ... -->`:

- Cada marcador se reemplaza con contenido escrito a partir de `purpose` y de lo que el usuario contó en la entrevista, con el mismo tono de los demás docs: reglas cortas, concretas y verificables.
- Si una sección de otro preset aplica tal cual, se copia en vez de inventarla: `presets/backend/database.md` para un paquete de migraciones (y se agrega `docs/database.md` a su tabla), el bloque e2e de `presets/frontend/testing.md` para un proyecto de e2e, el naming de `presets/backend/code-style.md` para tipos de dominio.
- Lo que no se sabe todavía se escribe como "por definir", no se inventa.
- Si la pieza la consumen otras (`consumers`), se actualizan los docs de esas apps para que apunten a ella. Ej. con `packages/types` de GraphQL, el `architecture.md` del frontend dice que los tipos se importan de `@<project>/types` en vez de `src/lib/api/codegen/`.

No se crea código de las apps (ni `package.json`, ni `src/`). El harness describe cómo se va a escribir; el scaffold se hace después, siguiendo los docs.

### 7. Verificación

Desde la raíz del proyecto, sin revisar `.claude/skills/harness/` (ahí los marcadores son parte del template):

1. `grep -rn '{{' CLAUDE.md README.md .claude/agents .claude/skills/commit .claude/skills/session-start apps packages features` no devuelve nada.
2. `grep -rn '<!-- si:\|<!-- llenar' CLAUDE.md .claude/agents .claude/skills/commit .claude/skills/session-start apps packages` no devuelve nada.
3. Cada fila de la tabla "Antes de escribir código" de cada `<path>/CLAUDE.md` apunta a un doc que existe.
4. Cada agente apunta a una app y a docs que existen.
5. Releer cada doc generado de corrido: que no mencione opciones que no se eligieron (ej. RLS sin multi-tenant, `UnitOfWork` sin DB, i18n sin i18n).

### 8. Reporte

En pocas líneas:

- Árbol de lo creado.
- Scripts que el `package.json` de cada app tiene que implementar al hacer el scaffold (los de `docs/commands.md`).
- Siguiente paso sugerido: `git init` si no hay repo, y el scaffold de las apps.

No hacer `git init`, `git add` ni commits salvo que el usuario lo pida.

## Cómo se llenan los archivos

### Tokens

| Token | Valor |
|-------|-------|
| `{{project}}` | nombre del proyecto en kebab-case (`acme`) |
| `{{Project}}` | nombre para mostrar (`Acme`) |
| `{{ProjectPascal}}` | PascalCase sin espacios (`Acme`), para nombres de clase |
| `{{description}}` | una línea de qué es el proyecto |
| `{{app}}` | nombre de la app (`api`) |
| `{{app_path}}` | `<location>/<name>`: `apps/api`, `packages/types` |
| `{{app_purpose}}` | `purpose` de una pieza `custom`: qué es, qué hace y qué no (párrafo) |
| `{{app_description}}` | una línea de qué es la app, con su stack principal |
| `{{backend_app}}` | app backend que consume este frontend |
| `{{pm}}` | `yarn`, `pnpm` o `npm` |
| `{{run}}` | `yarn`, `pnpm` o `npm run` |
| `{{BaseError}}` | clase base de errores de negocio: `{{ProjectPascal}}Error` |
| `{{apps_table}}` | una fila por app o paquete: `` | `<path>` | <description> | <stack> | `` |
| `{{app_scopes}}` | todos los nombres de app en backticks, separados por coma |
| `{{example_app}}` | la primera app backend (o la primera app) |
| `{{example_frontend}}` | la primera app frontend (o la primera app) |
| `{{app_stack}}` | el `stack` de la app |
| `{{ui_language}}` | `español` o `inglés`, según `uiLanguage` |

Los `<app>`, `<slug>`, `<módulo>` y similares entre `< >` que no son tokens se dejan tal cual: son parte del texto de los docs.

### Bloques condicionales

```
<!-- si: <condición> -->
contenido
<!-- /si -->
```

- Se deja el contenido solo si la condición es verdadera para la app (o para el proyecto, en archivos de la raíz). Los comentarios se quitan siempre.
- Condiciones: `clave=valor`, `clave=a|b` (cualquiera), `clave!=valor`, `clave` (verdadero o no vacío), `!clave`. Se pueden unir con ` y `.
- Las claves son las del manifiesto (`architecture`, `api`, `db`, `rls`, `errors`, `tests`, `framework`, `data`, `i18n`, `forms`, `comments`, `workspaces`...).
- Un bloque de línea completa no se anida dentro de otro. Un bloque en línea (abre y cierra en la misma línea) sí puede ir dentro de uno de línea completa.
- La clave se busca primero en la app y después en la raíz del manifiesto. `comments` es alias de `style.comments`; las claves anidadas van con punto (`commits.body`). `none`, `false`, vacío y ausente son falsos.

### Adaptar, no copiar

- Los presets están escritos con ejemplos genéricos (`order`, `customer`). Si la descripción del proyecto da un dominio obvio, se cambian por entidades de ese dominio; si no, se dejan.
- Si una pieza del ejemplo no aplica a las opciones elegidas (ej. `UnitOfWork` sin DB, `apiErrors` en REST), se adapta o se quita, sin dejar referencias sueltas.
- No agregar reglas que el usuario no eligió ni que no estén en los presets. Lo que no está decidido se escribe como "por definir", igual que hace Vendyx con el testing del admin.
- Los docs se escriben en el idioma `language.docs` del manifiesto (default español). El código de los ejemplos, en `language.code`.

## Agregar una app

1. Leer `.claude/harness.json` y el `CLAUDE.md` raíz.
2. Preguntar solo lo de esa app (ronda de backend, frontend o custom de `interview.md`). Proponer como default lo que ya usan las otras apps del mismo tipo.
3. Confirmar, agregar la app al manifiesto y generar sus archivos (paso 6 de Init).
4. Actualizar en la raíz: la tabla de apps de `CLAUDE.md`, el scope en `.claude/skills/commit/SKILL.md` y `README.md`.
5. Verificar (paso 7) solo sobre los archivos tocados.

## Reglas

- Nunca sobrescribir un archivo existente sin confirmar.
- Los marcadores `<!-- llenar: ... -->` los resuelve Claude después del render; el renderer los deja tal cual.
- Al cambiar un preset o template de este repo, correr `node ${CLAUDE_SKILL_DIR}/scripts/check.mjs`: renderiza todas las combinaciones de opciones y falla si queda algún marcador o token sin resolver.
- El flujo (`features/`, `/session-start`, `/commit`, agentes implementer/reviewer, log) no se personaliza: si el usuario quiere cambiarlo, se cambia en este repo de templates, no en el proyecto.

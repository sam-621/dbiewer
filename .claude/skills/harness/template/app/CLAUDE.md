# {{app_path}}

{{app_description}}

<!-- si: kind=backend -->
## Antes de escribir código

| Si vas a... | Lee |
|-------------|-----|
| Escribir o mover lógica de negocio, resolvers, controllers, jobs o repos | `docs/architecture.md` |
| Escribir cualquier código | `docs/code-style.md` |
| Escribir o correr tests | `docs/testing.md` |
<!-- /si -->
<!-- si: kind=backend y db!=none -->
| Crear una migración o tocar queries o índices | `docs/database.md` |
<!-- /si -->
<!-- si: kind=backend -->
| Correr cualquier comando | `docs/commands.md` |

## Reglas que aplican siempre

<!-- /si -->
<!-- si: kind=backend y architecture=ddd|modular -->
- La lógica de negocio va en `src/modules/<módulo>`. Los adapters (resolvers, controllers, jobs) no la tienen.
<!-- /si -->
<!-- si: kind=backend y architecture=layered -->
- La lógica de negocio va en `src/services`. Los controllers solo validan, llaman al service y responden.
<!-- /si -->
<!-- si: kind=backend y comments=none -->
- Sin comentarios en el código.
<!-- /si -->
<!-- si: kind=backend y db=knex -->
- Migraciones solo con `{{run}} migrate:make <nombre>`.
<!-- /si -->
<!-- si: kind=backend y db=prisma|drizzle -->
- Migraciones solo con `{{run}} migrate:make <nombre>`, que genera el archivo sin aplicarlo.
<!-- /si -->
<!-- si: kind=backend y db!=none -->
- Nunca correr comandos contra una DB real (`migrate`, `rollback`, `seed`...).
<!-- /si -->
<!-- si: kind=backend y tests=full|light -->
- Tests: solo los de la feature, nunca la suite completa.
<!-- /si -->
<!-- si: kind=backend y tests=none -->
- No escribir tests salvo que se pida.
<!-- /si -->
<!-- si: kind=backend -->
- No correr `tsc` para verificar ediciones.
<!-- /si -->
<!-- si: kind=frontend -->
## Antes de escribir código

| Si vas a... | Lee |
|-------------|-----|
| Crear o mover páginas, hooks, formularios u operations | `docs/architecture.md` |
| Escribir cualquier código | `docs/code-style.md` |
| Escribir o correr tests | `docs/testing.md` |
| Correr cualquier comando | `docs/commands.md` |

## Reglas que aplican siempre

<!-- /si -->
<!-- si: kind=frontend y comments=none -->
- Sin comentarios en el código.
<!-- /si -->
<!-- si: kind=frontend y i18n -->
- Todo texto visible con `t()` y su key en todos los archivos de `src/shared/i18n/locales/`.
<!-- /si -->
<!-- si: kind=frontend y !i18n -->
- Código en inglés; texto visible en {{ui_language}}, directo en el JSX.
<!-- /si -->
<!-- si: kind=frontend y tests=none -->
- No escribir tests salvo que se pida.
<!-- /si -->
<!-- si: kind=frontend -->
- No correr `tsc` para verificar ediciones.
<!-- /si -->
<!-- si: kind=site -->
## Stack

{{app_stack}}

## Reglas que aplican siempre

- Todos los comandos se corren dentro de `{{app_path}}`.
- Levantar el dev server, hacer build o deploy lo hace el usuario.
<!-- /si -->
<!-- si: kind=site y comments=none -->
- Sin comentarios en el código.
<!-- /si -->
<!-- si: kind=custom -->
## Antes de escribir código

| Si vas a... | Lee |
|-------------|-----|
| Crear, mover o borrar archivos | `docs/architecture.md` |
| Escribir cualquier código | `docs/code-style.md` |
| Escribir o correr tests | `docs/testing.md` |
| Correr cualquier comando | `docs/commands.md` |
<!-- llenar: una fila por cada doc extra que se haya creado (ej. `docs/database.md`), o borrar este comentario -->

## Reglas que aplican siempre

<!-- /si -->
<!-- si: kind=custom y comments=none -->
- Sin comentarios en el código.
<!-- /si -->
<!-- si: kind=custom y tests=none -->
- No escribir tests salvo que se pida.
<!-- /si -->
<!-- si: kind=custom -->
- No correr `tsc` para verificar ediciones.
<!-- llenar: de 1 a 4 reglas que apliquen siempre, sacadas de docs/architecture.md (lo que nunca se hace aquí, lo que solo corre el usuario) -->
<!-- /si -->

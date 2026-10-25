<!--- cSpell:disable --->

# Comandos

Todos se corren dentro de `{{app_path}}`. Esta tabla es el contrato de los scripts del `package.json`: si falta uno, se agrega con este nombre.

## Los puede correr el agente

| Comando | Para qué |
|---------|----------|
<!-- si: kind=backend y tests=full|light -->
| `{{run}} test [ruta]` | Tests unitarios (`*.test.ts`). Sin Docker. |
<!-- /si -->
<!-- si: kind=backend y tests=full -->
| `{{run}} test:int [ruta]` | Tests de integración (`*.int.test.ts`). Levanta Postgres en Docker, migra, corre y lo baja. |
<!-- /si -->
<!-- si: kind=backend y tests=full|light -->
| `{{run}} test:e2e [ruta]` | Tests e2e (`*.e2e.test.ts`).<!-- si: db!=none --> Levanta Postgres en Docker, migra, corre y lo baja.<!-- /si --> |
<!-- /si -->
<!-- si: kind=frontend y tests=unit|e2e -->
| `{{run}} test [ruta]` | Tests con Vitest. |
<!-- /si -->
<!-- si: kind=frontend y tests=e2e -->
| `{{run}} test:e2e [ruta]` | Tests e2e con Playwright contra el dev server que levanta el propio comando. |
<!-- /si -->
| `{{run}} lint:check` | Revisa ESLint + Prettier. |
| `{{run}} lint:fix` | Arregla lint, formato y orden de imports. |
<!-- si: kind=backend y api=graphql -->
| `{{run}} gen:types` | Regenera los tipos de GraphQL a partir de los `.gql`. Correr cuando cambia un `.gql`. |
<!-- /si -->
<!-- si: kind=backend y db!=none -->
| `{{run}} migrate:make <nombre>` | Crea el archivo de una migración nueva. No toca ninguna DB. |
<!-- /si -->

- No correr `tsc --noEmit` para verificar ediciones; el diagnóstico del IDE basta. El typecheck real es `{{run}} build`.
<!-- si: tests!=none -->
- Tests: solo los de la feature, nunca la suite completa (ver `testing.md`).
<!-- /si -->

## Solo los corre el usuario

Todo lo que toca una DB real, levanta el server o pega a una API viva. Si hace falta, se le pide y se espera.

| Comando | Para qué |
|---------|----------|
| `{{run}} dev` | Levanta la app en local. |
| `{{run}} build` | Typecheck y build de producción. |
<!-- si: kind=backend -->
| `{{run}} start` | Corre la build. |
<!-- /si -->
<!-- si: kind=backend y db!=none -->
| `{{run}} migrate <config>` | Aplica las migraciones pendientes. |
| `{{run}} rollback <config>` | Revierte el último batch de migraciones. |
| `{{run}} seed` | Siembra datos base. |
<!-- /si -->
<!-- si: kind=frontend y data=graphql -->
| `{{run}} gen:types` | Regenera los tipos de GraphQL. Necesita `apps/{{backend_app}}` corriendo; si hace falta, se le pide al usuario. |
<!-- /si -->
<!-- si: kind=frontend -->
| `{{run}} preview` | Sirve la build local. |
<!-- /si -->

## Variables de entorno

| Variable | Para qué |
|----------|----------|
<!-- si: kind=backend -->
| `PORT` | Puerto del server. |
<!-- /si -->
<!-- si: kind=backend y db!=none -->
| `DATABASE_URL` | Conexión de la app. |
<!-- /si -->
<!-- si: kind=backend y rls -->
| `ADMIN_DATABASE_URL` | Conexión como superusuario, solo para tests y scripts. Se salta RLS. |
<!-- /si -->
<!-- si: kind=frontend y framework=react-vite -->
| `VITE_API_URL` | URL base de `apps/{{backend_app}}`. |
<!-- /si -->
<!-- si: kind=frontend y framework=next -->
| `NEXT_PUBLIC_API_URL` | URL base de `apps/{{backend_app}}`. |
<!-- /si -->

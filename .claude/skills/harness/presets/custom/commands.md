<!--- cSpell:disable --->

# Comandos

Todos se corren dentro de `{{app_path}}`. Esta tabla es el contrato de los scripts del `package.json`: si falta uno, se agrega con este nombre.

## Los puede correr el agente

| Comando | Para qué |
|---------|----------|
| `{{run}} lint:check` | Revisa ESLint + Prettier. |
| `{{run}} lint:fix` | Arregla lint, formato y orden de imports. |
<!-- llenar: los comandos seguros (build de tipos, generar archivos, tests contra recursos efímeros) -->

- No correr `tsc --noEmit` para verificar ediciones; el diagnóstico del IDE basta.

## Solo los corre el usuario

Todo lo que toca una DB real, infraestructura real, una API viva o publica algo.

| Comando | Para qué |
|---------|----------|
<!-- llenar: los comandos que tocan algo real (aplicar migraciones, deploy, publicar el paquete). Si no hay, borrar la sección. -->

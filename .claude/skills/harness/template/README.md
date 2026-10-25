# {{Project}}

{{description}}

## Apps

| App | Qué es | Stack |
|-----|--------|-------|
{{apps_table}}

## Trabajo con Claude Code

- `CLAUDE.md` en la raíz y en cada app: reglas y qué doc leer antes de escribir código.
- `<app>/docs/`: arquitectura, estilo de código, testing y comandos de cada app o paquete.
- `features/<slug>/`: spec y bitácora de cada feature. Se empieza con `/session-start <slug>`.
- `/commit`: commits con el formato del repo.
- `/harness add-app <nombre>`: agrega una app con su `CLAUDE.md`, docs y agentes.

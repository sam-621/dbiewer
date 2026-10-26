# apps/api

Backend: conexiones a las bases de datos del usuario, ejecución de queries, esquema e historial

## Antes de escribir código

| Si vas a... | Lee |
|-------------|-----|
| Escribir o mover lógica de negocio, resolvers, use-cases, services externos o repos | `docs/architecture.md` |
| Escribir cualquier código | `docs/code-style.md` |
| Escribir o correr tests | `docs/testing.md` |
| Crear una migración o tocar queries o índices | `docs/database.md` |
| Correr cualquier comando | `docs/commands.md` |

## Reglas que aplican siempre

- La lógica de negocio va en `src/modules/<modulo>/use-cases`. Los resolvers solo llaman al use-case y responden. `src/services` es solo para servicios externos (email, auth, logger, billing, storage), sin reglas de negocio.
- Sin comentarios en el código.
- Migraciones solo con `yarn migrate:make <nombre>`, que genera el archivo sin aplicarlo.
- Nunca correr comandos contra una DB real (`migrate`, `seed`...).
- Tests: solo los de la feature, nunca la suite completa.
- No correr `tsc` para verificar ediciones.

# Configuración de cuenta y workspace — log

## 2026-10-24 — samuel.corrales621

**Hecho:**
- (api, web) Se crea la feature `account-settings`, separada de `auth`: spec de producto, técnico y de UI, y plan de trabajo.

**Decisiones:**
- Borrar la cuenta pide escribir el email y haber iniciado sesión en las últimas 24 horas, porque no hay contraseña que pedir.
- El nombre del usuario se cambia con Better Auth y el del workspace con GraphQL.

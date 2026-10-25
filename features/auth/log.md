# Acceso y workspace — log

## 2026-10-24 — samuel.corrales621

**Hecho:**
- (api, web) Se crea la feature `auth`: spec de producto, técnico y de UI, y plan de trabajo.

**Decisiones:**
- Acceso sin contraseñas: magic link en esta feature, GitHub y Google en `social-login`. No hay recuperación de contraseña, y la verificación de email queda cubierta por el magic link.
- Better Auth con adaptador de Drizzle.
- Un workspace por usuario, creado junto con la cuenta. El workspace es el tenant del RLS.
- Sesión en la base de datos que vence a los 30 días sin uso y se extiende con el uso. Sin refresh tokens, porque la sesión ya se revoca al instante. Las acciones delicadas piden una sesión reciente, y así quedó anotado en el roadmap para Conexiones y Planes.
- El milestone 1 se parte en tres features (`auth`, `social-login`, `account-settings`) para que no quede una sola feature demasiado grande.

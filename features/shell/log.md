# Shell — log

## 2026-10-26 — samuel.corrales621

**Hecho:**
- (api, web) Se crea la feature `shell`: spec de producto, técnico y de UI, y plan de trabajo. Maqueta de referencia en https://claude.ai/artifact/1xFf1W9L8owgCoSrEYNPhb.

**Decisiones:**
- El esquema se lee en vivo de la base del usuario y no se guarda. El árbol completo llega en una sola consulta; lo pesado se pide al abrir la tabla.
- Las pestañas y los borradores van en `localStorage` por conexión. Las queries guardadas y el historial, en la api.
- Un solo selector de conexión, en el header. El árbol del sidebar se llama Explorer.
- Pestaña provisional al explorar; índices, FKs y DDL en Structure, no en el árbol.
- El diagrama queda para el milestone 6: sin pestaña fija por ahora.
- El historial es de la conexión, no de la pestaña.

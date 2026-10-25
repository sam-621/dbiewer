<!--- cSpell:disable --->

# Testing
<!-- si: tests=none -->

Por ahora no se escriben tests salvo que el usuario lo pida. Las reglas se definirán más adelante.
<!-- /si -->
<!-- si: tests!=none -->

<!-- llenar: runner, sufijo de los archivos, dónde viven, comando para correr solo una parte y qué se prueba. Si este paquete ES de tests (ej. e2e), aquí van las reglas de cómo se escribe cada test: un archivo por flujo, happy path primero, selectores, datos de prueba. -->

- Siempre solo los tests de lo que se tocó, nunca la suite completa.
- Cada `test(...)` empieza con `returns`, `does`, `does not` o el verbo real de la acción.
<!-- /si -->

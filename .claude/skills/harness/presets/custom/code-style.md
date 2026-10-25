<!--- cSpell:disable --->

# Estilo de código

## General

<!-- si: comments=none -->
- **Sin comentarios.** Ni explicativos, ni JSDoc, ni `TODO`. Solo si el usuario lo pide, y solo el que pidió.
<!-- /si -->
<!-- si: comments=why -->
- **Comentarios solo para el porqué** que el código no puede decir. Nunca para describir qué hace. Sin JSDoc.
<!-- /si -->
- **Código en inglés**: nombres, strings y valores.
- Sin `any`; `unknown` + narrowing.
- `import type` para lo que solo es tipo.
- `{{run}} lint:fix` ordena imports y formatea. No se ordenan a mano.

## Naming

| Qué | Regla | Ejemplo |
|-----|-------|---------|
| Archivos y carpetas | kebab-case | `order-status.ts` |
<!-- llenar: una fila por cada pieza propia de esto (tipos, migraciones, specs...) con su regla y un ejemplo -->

<!-- llenar: si hace falta, una sección con un ejemplo corto de la pieza más común, escrito como debe quedar. Si no, borrar este comentario. -->

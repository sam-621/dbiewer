---
name: commit
description: Crea commits con el formato del repo. Usar solo cuando el usuario lo pida explícitamente (/commit).
disable-model-invocation: true
---

# Commit

## Formato

`tipo(app): descripción`

- En inglés, minúsculas, sin punto final, en presente o como capacidad (`add ...`, `can remove ...`, `uses ...`).
- Solo la línea de título. Sin cuerpo.
- Nunca agregar `Co-Authored-By` ni ninguna otra línea de atribución.

## Tipos

`feat`, `fix`, `chore`, `docs`, `tests`, `refactor`

## Scope

- El scope es la app: `api`, `web`, `www`.
- Sin scope cuando el cambio es **solo** de la raíz del repo (`features/`, `.claude/`, `CLAUDE.md` raíz): `docs: add features folder`.

## Pasos

1. Revisar `git status` y `git diff` para entender el cambio.
2. Por defecto, un solo commit con **todos** los cambios pendientes (código, `docs/`, `features/`, `.claude/`, `CLAUDE.md`, de cualquier app). Se separa en varios commits solo si el usuario lo pide explícitamente.
3. El tipo, el scope y la descripción salen del cambio más grande y funcional. Los cambios chicos que lo acompañan (docs, reglas del harness) no se mencionan ni cambian el mensaje.
4. Agregar los archivos por ruta explícita, todos los que muestra `git status`. Nunca `git add -A` ni `git add .`.
5. Commitear con `git commit -m "<mensaje>"`.
6. Nunca hacer push.

## Ejemplos

```
feat(api): can rename saved query
fix(web): fix build errors
tests(api): add missing fixtures for connection repository tests
docs: add features folder
```

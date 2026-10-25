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
2. Agrupar los archivos por app. Si el cambio toca varias apps, hacer un commit por app.
   - Los cambios a `docs/` de la app y a `features/<slug>/` (spec, log, plan) van en el mismo commit que el código que documentan. Un commit `docs` solo existe cuando el cambio es únicamente de documentación.
3. Agregar solo los archivos de cada grupo por ruta explícita. Nunca `git add -A` ni `git add .`.
4. Commitear con `git commit -m "<mensaje>"`.
5. Si hay archivos modificados que no parecen parte del cambio, no incluirlos y avisar al usuario.
6. Nunca hacer push.

## Ejemplos

```
feat(api): can rename saved query
fix(web): fix build errors
tests(api): add missing fixtures for connection repository tests
docs: add features folder
```

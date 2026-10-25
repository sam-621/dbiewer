---
status: active
apps: [api, web]
created: 2026-10-24
---

# Acceso con GitHub y Google

## Contexto

Con la feature `auth`, el único acceso es por magic link, así que hay que salir de la app a revisar el correo. El público de dbiewer son desarrolladores, y casi todos tienen cuenta de GitHub o de Google: entrar con un clic baja la fricción del primer uso.

Es la segunda feature del milestone 1 de `docs/roadmap.md`. Depende de `auth`.

## Historia de usuario

Como desarrollador, quiero entrar con mi cuenta de GitHub o de Google, para no tener que esperar un email cada vez que inicio sesión.

## Flujo

1. En la pantalla de acceso, el usuario elige "Continue with GitHub" o "Continue with Google".
2. Autoriza en el proveedor y vuelve a la app con la sesión iniciada.
3. Si el email no existía, se crean su cuenta y su workspace, igual que con el magic link.
4. Si el email ya existía (por ejemplo, entró antes con magic link), entra a la misma cuenta y el proveedor queda vinculado.

## Reglas de negocio

- Un email es una sola cuenta, sin importar el método. GitHub, Google y el magic link con el mismo email entran a la misma cuenta y quedan vinculados.
- Solo se aceptan emails verificados por el proveedor. Si GitHub o Google no devuelve un email verificado, el acceso se rechaza con un mensaje claro y se sugiere usar el magic link.
- Con GitHub se usa el email principal y verificado de la cuenta, aunque el perfil público no lo muestre.
- Si la cuenta es nueva, el nombre y el avatar se toman del proveedor.
- Si el usuario cancela en el proveedor, vuelve a la pantalla de acceso sin error.
- La sesión que se crea es la misma que con magic link: valen las reglas de sesión de `auth`.

## Decisiones

- **Vincular por email verificado**: permite entrar con cualquier método sin duplicar cuentas. Exigir email verificado evita que alguien se apropie de una cuenta registrando ese email en un proveedor sin verificarlo. Se descarta tener una cuenta por proveedor.
- **GitHub y Google, nada más**: cubren a casi todo el público. GitLab, Microsoft y otros quedan para cuando alguien los pida.

## Fuera de alcance

- Desvincular un proveedor desde la UI.
- Otros proveedores (GitLab, Microsoft, Apple).
- Usar los tokens del proveedor para algo que no sea el login (por ejemplo, leer repos de GitHub).

## Plan de trabajo recomendado

1. [ ] api: proveedores GitHub y Google en Better Auth, con vinculación por email verificado y rechazo de emails sin verificar.
2. [ ] web: botones de GitHub y Google en la pantalla de acceso y mensajes de error del redirect.
3. [ ] web: e2e de que los botones redirigen al proveedor y de los mensajes de error.

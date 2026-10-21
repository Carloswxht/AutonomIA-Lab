# Pruebas

- `npm run lint` · `npm run typecheck` · `npm test` · `npm run build` · `npm run test:e2e` (móvil 390x844).
- Base de datos (`autonomialab-db`, desde el MCP de Supabase): pegar entero `datos/pruebas/2026-10-21-cuentas-supabase.sql`.
  Tiene que acabar con el error `PRUEBAS_OK` (ese error deshace todo: no deja nada guardado). Cualquier otro error dice
  qué falló (`FALLO n: …`). En local: Postgres 16 con una imitación de `auth` y de `comun` (ver el plan del 21 oct en
  `CLAUDE.md`). Las pruebas de la base antigua (`pruebas.aislamiento()`…) ya no existen.

## Flujo real contra Supabase (`tests/e2e/real.spec.ts`)
Necesita una cuenta de plataforma de prueba y que la red del entorno permita `dorunbacwnkwdatfscri.supabase.co`.
La contraseña NO se guarda en el repo: se genera en cada sesión.

1. Generar contraseña en el scratchpad (`python3 -c "import secrets;print(secrets.token_urlsafe(18))"`).
2. Cuenta de prueba `ejemplo-pruebas@autonomialab.test` en el negocio de plataforma (`comun.negocios`, slug
   `autonomialab`): si no existe, `insert into comun.usuarios (negocio_id, email, name, password_hash,
   must_change_password) values (<id de autonomialab>, 'ejemplo-pruebas@autonomialab.test', 'Pruebas (ejemplo)',
   extensions.crypt(<contraseña>, extensions.gen_salt('bf', 10)), false)`; si existe, `update comun.usuarios set
   password_hash = extensions.crypt(…), active = true where email = 'ejemplo-pruebas@autonomialab.test'`.
   Su cuenta de Supabase se crea y se pone al día sola (disparador `usuarios_a_supabase`).
3. `PRUEBA_EMAIL=ejemplo-pruebas@autonomialab.test PRUEBA_PASSWORD=… npm run test:e2e`
   - Recorre: solicitar acceso (correo con punto final) → datos del negocio → aprobar → ficha de un negocio.
   - Crea el miembro `ejemplo-solicitud-…@autonomialab.test` (sin contraseña). No cambia ningún negocio.
   - Con `PRUEBA_GRATIS_EMAIL=ejemplo-cliente@autonomialab.test` prueba también la cuenta gratuita: antes, ponerle la
     misma contraseña en Supabase (`update auth.users set encrypted_password = extensions.crypt(…)`) y al terminar
     dejarla vacía (`''`).
4. Al terminar: `update comun.usuarios set active = false where email = 'ejemplo-pruebas@autonomialab.test'` (bloquea
   también su cuenta de Supabase), `update auth.users set banned_until = '2999-01-01' where email like
   'ejemplo-solicitud-%'` y rechazar las solicitudes `ejemplo-%` pendientes (no se pueden borrar desde el MCP).

En el entorno de Claude Code, Node necesita el proxy (`playwright.config.ts` ya lo pone en el servidor de pruebas).

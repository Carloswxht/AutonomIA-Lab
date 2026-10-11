# Pruebas

- `npm run lint` · `npm run typecheck` · `npm test` · `npm run build` · `npm run test:e2e` (móvil 390x844).
- Base de datos (desde el MCP de Supabase): `select pruebas.aislamiento(), pruebas.admin(), pruebas.clientes();` → `OK` ×3.

## Flujo real contra Supabase (`tests/e2e/real.spec.ts`)
Necesita un usuario de prueba superadmin. La contraseña NO se guarda en el repo: se genera en cada sesión.

1. Generar contraseña en el scratchpad (`python3 -c "import secrets;print(secrets.token_urlsafe(18))"`).
2. Si no existe `ejemplo-pruebas@autonomialab.test`, crearlo por SQL (insert en `auth.users` con
   `extensions.crypt(<contraseña>, extensions.gen_salt('bf'))`, `email_confirmed_at = now()`, los campos de token a `''`,
   y su fila en `auth.identities`). Si ya existe: `update auth.users set encrypted_password = extensions.crypt(...),
   banned_until = null where email = 'ejemplo-pruebas@autonomialab.test'`.
3. Hacerlo superadmin solo durante la prueba: `update public.perfiles set es_superadmin = true where id = …`.
4. `PRUEBA_EMAIL=ejemplo-pruebas@autonomialab.test PRUEBA_PASSWORD=… npm run test:e2e`
   - Hace de cliente `ejemplo-cliente@autonomialab.test` (existe, sin contraseña: no puede entrar).
   - Con SMTP propio configurado, añadir `PRUEBA_REGISTRO=1` para probar también el registro por la web
     (Supabase rechaza dominios `.test`, por eso usa `@autonomialab.com`).
5. Al terminar: quitar superadmin, `banned_until = '2999-01-01'` y suspender las empresas `Ejemplo Bar %`
   (no se pueden borrar desde el MCP).

En el entorno de Claude Code, Node necesita el proxy (`playwright.config.ts` ya lo pone en el servidor de pruebas).

# autonomIA Lab — SaaS

@PLATAFORMA.md

> **Manda `PLATAFORMA.md`** (bases comunes de todos los repositorios; **la copia maestra es la de este repositorio** y solo se cambia desde aquí). Donde este archivo contradiga a `PLATAFORMA.md`, gana `PLATAFORMA.md`. Al cambiar las bases: subir su versión y dejar la misma copia en `gymbro` y `multibar-platform` con un PR en cada uno (`add_repo` con acceso `push`).

Responde SIEMPRE en español. Quien habla es Carlos, fundador. **Trabaja solo desde un móvil Android** (sesiones en la nube): respuestas cortas, claras y con el resultado primero. Nada de pedirle que ejecute comandos: tú lo haces todo. Carlos dicta por voz: interpretar la intención, no el literal. Cuando tenga que tocar paneles (Supabase, DonDominio, GitHub, Resend…), guiarle paso a paso, darle los enlaces en bloques de código y pedirle captura.

## Qué es este repositorio
La web de la empresa en **`https://autonomialab.es`** (GitHub Pages, repositorio **público** desde el 21 oct): portada para miembros, solicitar acceso, panel de miembros, `/admin` de Carlos y la página de servicios. Es también el **dueño de las carpetas `comun` y `autonomialab`** de la base única `autonomialab-db`. MultiBar y Gymbro son productos aparte, cada uno con su repositorio y su sesión; esta web los enlaza.

## Estado (23 oct)
- **Publicado y en `main`:** PR #9 (Fase 2 + web de páginas fijas), #10 (servicios), #11 (enlace a servicios en la portada), #12 (sello «Miembros», «Entrar» en azul suave, pie al día). Cada fusión en `main` se publica sola (`.github/workflows/publicar.yml`). Rama de trabajo: `ccr-66066c8f-u7w8ll` (al día con `main`).
- **Pantallas:**
  - `/` portada: sello «MIEMBROS», entrar, «¿Aún no eres miembro? Solicitar acceso», «Habla con un asesor», «Ver nuestros servicios».
  - `/solicitar` → `/solicitud/?t=CÓDIGO` (datos opcionales del negocio). `/recuperar`, `/nueva-contrasena`, `/auth/confirmar/`, `/confirmado/`.
  - `/miembros/`: tarjeta «Nuestros servicios» (la primera), 6 secciones (gratis: Aplicaciones útiles, Ranking, Blog; de pago: Agentes, Plantillas, Universidad; **todas «Próximamente», sin contenido**), «Tus aplicaciones» (cliente) o «Paneles de plataforma» (Carlos).
  - `/admin/` (solo cuenta de plataforma): solicitudes (aprobar/rechazar, WhatsApp), negocios de `comun.negocios` con su ficha `/admin/negocio/?id=N` (productos, datos legales, dar o quitar acceso a la web a sus dueños), miembros, enlaces a los `/plataforma/` de cada producto.
  - `/servicios/`: página pública con los 9 servicios, agente o automatización, productos y cómo trabajamos (contenido en `src/lib/servicios.ts`, que sale de `docs/servicios.md`).
- **Carlos entra en `/admin` con `carloswxht+plataforma@gmail.com`** (su cuenta de plataforma, la misma de los paneles de MultiBar y Gymbro; su Gmail normal es de La Torre Bar).

## Pendiente, en este orden
1. **Panel de Supabase (Carlos, con pasos guiados y capturas):** Authentication → URL Configuration: Site URL `https://autonomialab.es`; Redirect URLs `https://autonomialab.es/**`, `https://carta.autonomialab.es/**`, `https://gymbro.autonomialab.es/**`. SMTP de Resend. Plantillas de `supabase/plantillas/` (enlaces a `{{ .SiteURL }}/auth/confirmar/?…`; la de «Reset Password» debería llevar a la página de cada producto con `{{ .RedirectTo }}` para que MultiBar y Gymbro dejen sus correos propios). Desactivar «Allow new users to sign up». Valorar «Leaked password protection». Sin esto no salen los correos de «acceso aprobado» ni «cambiar contraseña».
2. Contenido de «Aplicaciones útiles» (demos de `prototipos/aplicaciones.html`: Control de horario y Pendientes de obra).
3. Nombre del producto de pisos en alquiler (propuestos: MultiPiso —recomendado—, Portería, PisoClaro, MiPiso al Día; comprobar en la OEPM antes).
4. Cuando todos los productos usen solo Supabase: quitar los disparadores de copia de `comun.usuarios` y pasar `comun.sesiones` / `comun.recuperaciones` a archivo (sin DROP).
5. Hetzner (cuando Carlos haga la verificación con pasaporte): ver `docs/publicar.md`.
6. Antes del primer cliente de pago: Supabase Pro y copias (ver Fase 5 de `PLATAFORMA.md`), contrato y encargo del tratamiento revisados por un asesor, aviso legal y privacidad de la web.
7. Probar un día de partido (bloqueos de LaLiga) la web, MultiBar y Gymbro con datos móviles.

## Base de datos (`autonomialab-db`, ref `dorunbacwnkwdatfscri`)
- SQL en `datos/cambios/` y pruebas en `datos/pruebas/` (como en los otros repositorios). Lo de la base antigua («autonomIA Lab antiguo», `dafmorfftnucsxcsafop`, pausada; no tocar) quedó en `supabase/archivo-base-antigua/` (no aplicar).
- `datos/cambios/2026-10-21-cuentas-supabase.sql` (**aplicado el 21 oct**): `comun.usuarios.auth_id` + disparadores de copia con `auth.users` (misma contraseña; historial intacto, comprobado con huella md5); carpeta `autonomialab` (`miembros_autonomialab`, `solicitudes_acceso_autonomialab`, `clientes_autonomialab`; cerradas, RLS sin políticas a propósito) y funciones `*_autonomialab` en `public` (la web no lee tablas); `privado.es_plataforma()`, `privado.limpiar_correo()`.
- Pruebas: pegar entero `datos/pruebas/2026-10-21-cuentas-supabase.sql`; debe acabar con el error `PRUEBAS_OK` (deshace todo). Lanzarlas tras cada cambio.
- Se aplica con `execute_sql` (MCP de Supabase) y el OK de Carlos. **Cualquier SQL con `DELETE` o `DROP` se cancela**: retirar con `revoke` o `update` de estado; si hay que borrar, lo pega Carlos en el SQL Editor. Bloques grandes, en trozos.
- Prueba en local: Postgres 16 del contenedor (`initdb` como usuario `postgres` en `/srv/pglocal`, puerto 5433) con una imitación de `auth` y de `comun` (columnas copiadas de la base real).
- No tocar nunca las carpetas `multibar` ni `gymbro` ni sus funciones: son de sus repositorios.

## Técnica de la web
- Next.js 16 (App Router) + TypeScript con `output: "export"` (páginas fijas en `out/`), `trailingSlash: true`. Sin servidor: el navegador habla con Supabase con la clave publicable (`src/lib/supabase/cliente.ts`; nunca la `service_role`).
- Acciones de los formularios en el navegador (`src/app/acciones.ts`, `src/app/admin/acciones.ts`); `<ConSesion>` y `useYo()` (`src/lib/sesion.tsx`) comprueban la sesión en cada página con `yo_autonomialab`; cada función de la base vuelve a comprobar quién llama. Catálogo de productos en `src/lib/productos.ts`.
- Campos de correo `type="text"` + `inputMode="email"` (con `type="email"` el móvil no deja enviar el punto final del dictado; la acción y la base lo quitan).
- Antes de entregar: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` y `npm run test:e2e` (sirve `out/` con `scripts/servir.mjs`; en el entorno de Claude, Chromium sale por el proxy). Prueba real contra la base: `docs/pruebas.md` (cuenta de plataforma de prueba `ejemplo-pruebas@autonomialab.test` y gratuita `ejemplo-cliente@autonomialab.test`; dejarlas bloqueadas al terminar). Capturas a 390 px a Carlos.
- Red del entorno: `dorunbacwnkwdatfscri.supabase.co` permitido (desde el 21 oct). Desde el contenedor no se abren `autonomialab.es` ni los subdominios (403 del proxy): las comprueba Carlos en su móvil.
- Para fusionar: PR desde la rama de trabajo, CI en verde («comprobar») y el «fusiónalo» de Carlos. Esperar la publicación (`publicar.yml`) y avisarle.

## Diseño
- Tema oscuro `#0A0B0D`, azul `#3B82F6`. Space Grotesk (títulos), Work Sans (cuerpo), IBM Plex Mono (números, marca, etiquetas). Marca `[autonomIA Lab]` con cursor parpadeante. Fuentes dentro de la app (RGPD).
- Móvil primero, sobrio y profesional (estilo «editorial técnico»: numeración en mono, tarjetas con borde fino, un solo botón principal azul). Evitar la plantilla genérica de IA. Lenguaje inclusivo neutro.
- Antes de una UI nueva importante: decir qué referencias se aplican.

## Negocio (lo que sigue valiendo de las notas del 11 oct)
- Se venden servicios y productos a autónomos, pymes y empresas en España (lista en `docs/servicios.md`). La membresía gratuita es el gancho; quien contrata tiene acceso completo. **Planes y precios sin definir: no inventarlos** («Subir plan» y los botones de contacto llevan a WhatsApp +34 605 288 673).
- Cuentas de la web: «Solicitar acceso» solo con el correo → Carlos aprueba en `/admin` → le llega un correo para crear su contraseña (nunca se envían contraseñas). Un cliente es un miembro de la web enlazado a su negocio desde la ficha del negocio.
- Webs de clientes: solo lo que hacemos nosotros, alojado y mantenido por nosotros (no «hosting abierto»).
- No inventar empresas, cifras ni testimonios (el caso de Suelos La Giralda del prototipo no se publica sin el OK de Carlos). Nunca afirmar que algo «cumple la ley» sin fuente oficial.
- `prototipos/`: maquetas de octubre (referencia de diseño y textos, con datos de ejemplo y afirmaciones antiguas como Cloudflare: no copiarlas tal cual).

## Correos
- Resend (cuenta de Carlos), dominio `autonomialab.com` verificado (región Irlanda), remitente `avisos@autonomialab.com`. Pendiente verificar `autonomialab.es` en Resend y pasar los remitentes a `.es`. La clave de Resend solo en Supabase.
- Plantillas con la marca en `supabase/plantillas/` (se generan con `_base.py`): «Magic Link» = acceso aprobado (`type=magiclink`), «Reset Password» = cambiar contraseña (`type=recovery`), ambas a `/auth/confirmar/` con `token_hash`.

## Forma de trabajar con Carlos
- Antes de una tarea grande: explicar qué se va a tocar y esperar su «sí». Si pide «opina» o «analicemos»: solo opinión, sin cambios.
- Dar opinión honesta y una recomendación clara; no devolverle la pregunta. No asegurar al 100 % lo que no se puede garantizar.
- Commits pequeños en español en la rama de trabajo; actualizar este archivo al terminar cada bloque.

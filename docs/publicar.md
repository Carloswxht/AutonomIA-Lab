# Publicar la web de autonomIA Lab

## Hoy (desde el 21 oct): GitHub Pages
- La web es de **páginas fijas** (Next.js con `output: "export"`, carpeta `out/`). El móvil habla **directamente con
  Supabase** con la clave publicable (`src/lib/supabase/cliente.ts`), como MultiBar y Gymbro. La seguridad la ponen
  las funciones `*_autonomialab` de la base, que comprueban quién llama.
- Cada fusión en `main` se publica sola (`.github/workflows/publicar.yml`) en `https://autonomialab.es` (`public/CNAME`).
- Direcciones con datos van como parámetro, porque las páginas son fijas: `/solicitud/?t=CÓDIGO`,
  `/admin/negocio/?id=N`. `/registro/` lleva a `/solicitar/` desde la propia página.
- Probar en local: `npm run build` y `npm start` (sirve `out/` en el puerto 3100, como GitHub Pages);
  `npm run test:e2e` hace lo mismo.
- **Riesgo conocido:** Supabase está detrás de Cloudflare. Los días de partido, los bloqueos de LaLiga en España pueden
  cortar el acceso a Supabase (y a MultiBar y Gymbro, que funcionan igual). Probarlo un día de partido con datos móviles.

## Lo que hizo Carlos una vez
1. Hacer público el repositorio (GitHub Pages gratis no publica repositorios privados). Revisado el 21 oct: en el
   historial no hay claves secretas (solo la clave publicable y contraseñas de ejemplo de las pruebas).
2. Settings → Pages → Source = «GitHub Actions»; dominio `autonomialab.es` y «Enforce HTTPS».
3. DonDominio (DNS de `autonomialab.es`): quitar el «parking»; registros A de la raíz a GitHub Pages
   (`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`) y `www` CNAME → `carloswxht.github.io`.
4. Supabase → Authentication → URL Configuration: Site URL `https://autonomialab.es`; Redirect URLs
   `https://autonomialab.es/**` (y las de cada producto). Plantillas: enlaces a `{{ .SiteURL }}/auth/confirmar/?…`.

## Volver a un servidor propio (Hetzner) delante de Supabase
Para que el móvil solo hable con nuestro dominio (a salvo de los bloqueos de LaLiga):
- La versión con servidor (Next.js con acciones del servidor, `src/proxy.ts` y cookies) es el commit `49455cf` de este
  repositorio: sirve de punto de partida.
- Opción más corta: dejar la web como está y poner en Hetzner un proxy (Caddy o Nginx) en `api.autonomialab.es` que
  reenvíe a `dorunbacwnkwdatfscri.supabase.co`; cambiar `NEXT_PUBLIC_SUPABASE_URL` a esa dirección. Sirve igual para
  MultiBar y Gymbro (cambiando su dirección de Supabase).

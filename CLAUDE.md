# autonomIA Lab — SaaS

Responde SIEMPRE en español. Quien habla es Carlos, fundador. **Trabaja solo desde un móvil Android** (sesiones en la nube): las respuestas deben ser cortas, claras y con el resultado primero. Nada de pedirle que ejecute comandos en un terminal: tú lo haces todo. Carlos dicta por voz: interpretar la intención, no el literal. Cuando tenga que tocar paneles (Supabase, DonDominio, Resend…), guiarle paso a paso y pedirle captura.

## Marca
- El nombre es **autonomIA Lab**. Nunca "IA Partner" / "Partner" (nombre viejo, descartado).
- Dominios (comprados en **DonDominio**, DNS de DonDominio): `autonomialab.com` = principal (web, plataforma y correos); `autonomialab.es` redirigirá a `.com`. El `.com` ya pasó la verificación ICANN.

## Qué es esto
Pasamos de páginas HTML sueltas a un **SaaS**. `prototipos/` son maquetas de referencia de diseño y contenido, no el código final:
- `index.html` portada filtro · `miembros.html` panel de tarjetas · `aplicaciones.html` demos (Control de horario y Pendientes de obra) · `servicios.html`, `info.html` ventas (WhatsApp +34 605 288 673) · `panel-gestion-referencia.html` patrones (tarjetas, nav inferior, vistas).

## Negocio (decidido el 11 oct)
- Se venden **aplicaciones web empresariales a medida** a autónomos, pymes y empresas en España. La membresía gratuita es el gancho para captar clientes.
- **Plataforma modular, una sola base de datos**: cada empresa cliente recibe "su" app combinando módulos (Hostelería, Pendientes de obra, Control de horario…), su marca (nombre, logo, colores) y opciones. Si algo no cabe en configuración, se hace como módulo nuevo y entra en el catálogo. Coste por cliente ≈ 0 (no un proyecto por cliente).
- **Membresía**: gratis = Aplicaciones útiles, Ranking, Blog de noticias. De pago = Agentes, Plantillas descargables, Universidad. Quien contrata una app tiene **acceso completo**. Planes y precios **sin definir: no inventarlos** ("Subir plan" → WhatsApp).
- **Cuentas — versión final**: «Solicitar acceso» **solo con el correo** → «Solicitud recibida, pendiente de aprobación, te escribiremos en breve» + formulario opcional (Eres: autónomo/pyme/empresa grande/otro · sector · nombre · WhatsApp · qué mejorar). Carlos aprueba en `/admin` → se crea el usuario y le llega un correo para **crear su contraseña** (nunca se envían contraseñas por correo ni WhatsApp). Sin nombre de empresa al registrarse.
- **Clientes**: cuando alguien compra una app, Carlos escribe su correo en `/admin` → «Nuevo cliente» → se crea su espacio (organización) y queda como admin. Los datos del negocio los pone Carlos. El cliente da acceso a sus empleados por correo.
- Cobros: factura manual al principio; Stripe más adelante.
- **Primer módulo**: **Hostelería** (carta QR + pedidos + panel de barra), rehecho a partir de `Carloswxht/la-mar-de-gambas` (cliente real; sigue funcionando aparte, en Neon + GitHub Pages, hasta migrarlo). Después Pendientes de obra y Control de horario (verificar normativa de registro de jornada en fuente oficial antes de venderlo).
- Unificar en la plataforma: `la-mar-de-gambas` y `El-Recreo` (bares) → Hostelería; `war300` (rutinas de gimnasio) → futuro módulo Entrenamiento; `Sueloslagiralda-web` (web de empresa, probablemente en Cloudflare Pages) → servicio de webs.
- **Webs de clientes**: proyectos distintos (kit base, una carpeta por cliente), fuera del MVP. Se pueden alojar en nuestro servidor y cobrar alojamiento + mantenimiento, pero **solo lo que hacemos nosotros**: no vender "hosting abierto" (que el cliente suba su propia web/WordPress). En nuestras apps solo se sube lo programado (fotos, datos), con tipo y tamaño limitados.

## Infraestructura
- **Hospedaje**: el navegador del usuario **solo habla con nuestro dominio**; Supabase solo desde el servidor (antibloqueos de LaLiga y cookies de Safari). Nada de Cloudflare delante. Sin Vercel (Carlos lo descartó).
- **Producción: VPS Hetzner (Alemania) con IP propia**, ~6–10 €/mes + copias (20 %), por horas y sin permanencia. Coolify para publicar desde GitHub. Antes de usar la IP, comprobar que no está en listas de bloqueo. App preparada para mudarse en un día. Cuando haya varios clientes: separar plataforma y webs de clientes (otro servidor o IP). Se decidió contratarlo el 11 oct (siguiente paso).
- **Supabase**: proyecto **autonomIA Lab** (ref `dafmorfftnucsxcsafop`, `eu-central-1` Frankfurt), plan gratis. Pasar a Pro (~25 $/mes) con clientes reales (el gratis se pausa por inactividad y no hace copias diarias). Otros proyectos de Carlos: "Suelos la Giralda" (pausado), "War300" (activo).
- **Correos**: Supabase envía por SMTP de **Resend** (cuenta de Carlos con su Gmail; dominio `autonomialab.com` verificado; región Irlanda; remitente `autonomIA Lab <no-responder@autonomialab.com>`; registros DNS en DonDominio: `resend._domainkey` TXT, `rsend` y `send` CNAME, `_dmarc` TXT `v=DMARC1; p=none;`). Clave de Resend solo en Supabase (permiso "Sending access").
- Plantillas de correo con la marca en `supabase/plantillas/` (se generan con `_base.py`; página para copiarlas: https://claude.ai/artifact/F4MCWsd9dP3guEvxDUfMhr). En Supabase → Authentication → Emails: **Magic Link** = acceso aprobado (`type=magiclink`), **Reset Password** = cambiar contraseña (`type=recovery`); enlaces con `token_hash` → `src/app/auth/confirmar/route.ts`. Site URL: `https://autonomialab.com`. Pendiente que Carlos repegue la última versión (letra mono sin Courier en Android). Los botones funcionarán cuando la web esté publicada.
- Seguridad recomendada a Carlos: 2FA en Gmail, GitHub, Supabase, Resend y DonDominio. Nunca usar ni guardar la `service_role` de Supabase.

## Estado (11 oct) — plan en `docs/plan-mvp.md`
1. ✅ Esqueleto Next.js 16 + TypeScript, portada (`/`), fuentes alojadas en la app (RGPD), CI en GitHub Actions.
2. ✅ Base de datos con RLS por organización (`supabase/migrations/`), tests en la propia base.
3. ✅ Login con contraseña, «¿Olvidaste tu contraseña?» (`/recuperar`, `/nueva-contrasena`), `/auth/confirmar`, `/confirmado`.
4. ✅ `/admin` (solo superadmin): solicitudes (aprobar/rechazar, WhatsApp directo), usuarios con acceso, «Nuevo cliente» por correo, ficha de cliente (marca, módulos, personas).
5. ✅ `/miembros`: tarjetas gratis/pago, «Tus aplicaciones» (clientes, solo espacios activos), barra inferior con menú hamburguesa; secciones con página «Próximamente».
- Flujo de acceso: `/solicitar` → `/solicitud/[token]` (datos opcionales; sectores de más a menos autónomos en `src/lib/sectores.ts`: 7 primeros verificados con MITES ene-2026, resto aproximado).
- **Siguiente**: publicar en Hetzner (guiar a Carlos para crear la cuenta). Después: contenido de «Aplicaciones útiles» (portar demos del prototipo) y módulo Hostelería.
- Vista previa estática (sin servidor) de las pantallas públicas: https://claude.ai/artifact/ULY9dFJ6FGL6SkTjFLJErC (se regenera con `scripts/vista-previa.mjs`).

## Al empezar cada sesión
- `cp .env.example .env.local` (dirección y clave publicable de Supabase; no son secretas).
- Red del entorno: Personalizada, con `dafmorfftnucsxcsafop.supabase.co` permitido. En Node hace falta el proxy: `NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt` (ya puesto en `playwright.config.ts`). WebFetch a webs externas está bloqueado.
- **Supabase MCP**: se cancela cualquier SQL con `DELETE` o `DROP`. Para retirar algo: `revoke`, `update` de estado o tabla nueva; si hay que borrar, pedírselo a Carlos en el SQL Editor.
- Tests de la base: `select pruebas.aislamiento(), pruebas.admin(), pruebas.clientes();` → `OK` ×3. Lanzarlos tras cada migración.
- Pruebas reales con usuarios de ejemplo: `docs/pruebas.md` (superadmin de prueba `ejemplo-pruebas@autonomialab.test`, bloqueado entre pruebas; cuenta gratuita `ejemplo-cliente@autonomialab.test`; al terminar, dejar todo bloqueado/suspendido).
- Carlos (`carloswxht@gmail.com`) es superadmin.
- Para enviar correos de prueba a Carlos: `signInWithOtp` (acceso aprobado) o `resetPasswordForEmail` con un cliente sin cookies; 60 s entre correos al mismo usuario.

## Técnica
- Next.js (App Router) + TypeScript, un solo repo. `cacheComponents` desactivado. `src/proxy.ts` refresca la sesión.
- Supabase: Auth real, Postgres con `organizacion_id` y **RLS por organización**; funciones `security definer` con `search_path = ''` para lo que necesita saltarse RLS; ayudas en el esquema `privado` y tests en `pruebas` (no expuestos). Prohibido `using (true)` para `anon`.
- Tablas: `organizaciones`, `perfiles`, `miembros`, `modulos`, `organizacion_modulos`, `solicitudes_acceso` (la antigua `solicitudes_cuenta` queda como histórico sin uso).
- SQL siempre en `supabase/migrations/`; Claude lo aplica con el MCP y avisa a Carlos.

## Diseño
- Tema oscuro `#0A0B0D`, acento azul `#3B82F6`. Tipografías: Space Grotesk (títulos), Work Sans (cuerpo), IBM Plex Mono (números, marca).
- Marca en pantalla: `[autonomIA Lab]` con cursor parpadeante.
- Móvil primero. Barra inferior con menú hamburguesa, tarjetas con badge.
- Evitar el aspecto de plantilla genérica de IA. No sacrificar usabilidad por estética. Lenguaje inclusivo neutro ("Ya tienes acceso", no "Bienvenido").
- Antes de cualquier UI nueva importante: decir qué referencias/tendencias se aplican.

## Forma de trabajar con Carlos
- Antes de entregar: lint, typecheck, tests, build y pruebas de pantalla a 390x844 (también las reales contra Supabase cuando aplique); confirmarle que se validó y mandarle capturas.
- Cuando haya varias formas válidas, dar opinión honesta y una recomendación clara; no devolverle la pregunta.
- Feedback directo, incluso crítico. No asegurar al 100 % lo que no se puede garantizar.
- No inventar empresas, cifras ni testimonios. Los datos de ejemplo se marcan como "ejemplo". Cifras con fuente.
- Nunca afirmar que algo "cumple la ley" sin verificarlo en fuente oficial.
- Commits pequeños en español, en la rama de trabajo; actualizar este archivo al terminar cada bloque.

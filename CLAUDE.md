# autonomIA Lab — SaaS

Responde SIEMPRE en español. Quien habla es Carlos, fundador. **Trabaja solo desde un móvil Android** (sesiones en la nube): las respuestas deben ser cortas, claras y con el resultado primero. Nada de pedirle que ejecute comandos en un terminal: tú lo haces todo.

## Marca
- El nombre es **autonomIA Lab**. Nunca "IA Partner" / "Partner" (nombre viejo, descartado).
- Dominios: `autonomialab.com` (plataforma y membresía gratuita para captar clientes) y `autonomialab.es` (redirige a `.com`).

## Qué es esto
Pasamos de páginas HTML sueltas a un **SaaS**. Todo lo que hay en `prototipos/` son maquetas navegables hechas para validar la idea; sirven de referencia de diseño y de contenido, no son el código final.

Lo que ya está decidido (de los prototipos):
- `index.html`: portada filtro. Solo marca + login de miembros + "Solicitar cuenta" + 3 mensajes + "Habla con un asesor". Sin catálogo de ventas.
- `miembros.html`: panel de miembros con tarjetas. Gratis: Aplicaciones útiles, Ranking, Blog de noticias. De pago ("Subir plan"): Agentes, Plantillas descargables, Universidad. Los precios/planes NO están definidos todavía: no inventarlos.
- `aplicaciones.html`: catálogo de aplicaciones útiles (problema → aplicación → demo tocable → botón "Quiero esto en mi empresa" a WhatsApp). Hay 2: Control de horario y Pendientes de obra. Carlos irá añadiendo más.
- `servicios.html`, `info.html`: ventas y captación (WhatsApp +34 605 288 673).
- `panel-gestion-referencia.html`: panel de gestión de otro negocio; solo referencia de patrones (tarjetas, nav inferior, vistas).

## Decidido en la sesión 1
- Negocio: vender paneles y aplicaciones web a medida para cada empresa. La membresía es el gancho gratuito.
- Membresía gratis: acceso a 2-3 secciones. Quien compra una aplicación tiene acceso total a la membresía.
- Cuentas (decidido el 11 oct, versión final): **«Solicitar acceso» solo con el correo** → pantalla «Solicitud recibida, pendiente de aprobación, te escribiremos en breve» + formulario opcional (Eres: autónomo/pyme/empresa/otro, sector, nombre, WhatsApp, qué mejorar). Carlos aprueba en /admin → se crea el usuario y le llega un correo para entrar y crear su contraseña (nunca se envían contraseñas). Cuando alguien compra una app, Carlos lo da de alta como cliente con su correo («Nuevo cliente») y se crea su espacio (organización). Se cobra al cliente, que da acceso a sus empleados por correo.
- Primeros cobros por factura manual; Stripe más adelante. Precios sin definir.
- Primer módulo del MVP: **Hostelería** (carta + pedidos + panel de barra), rehecho a partir de `Carloswxht/la-mar-de-gambas` (cliente real, sigue funcionando aparte hasta migrarlo). Pendientes de obra y Control de horario, después.
- Hospedaje: el navegador solo habla con nuestro dominio (antibloqueos de LaLiga y Safari). Producción futura en VPS Hetzner (Alemania) con IP propia. Sin Vercel. De momento sin servidor: Claude prueba la app en su entorno y envía capturas y un enlace de vista a Carlos.
- Webs de clientes: proyectos distintos (kit base, una carpeta por cliente), fuera del MVP.
- Supabase de la plataforma: proyecto **autonomIA Lab** (ref `dafmorfftnucsxcsafop`, región `eu-central-1` Frankfurt), creado el 11 oct 2026. Proyecto "Suelos la Giralda" pausado; "War300" activo.
- Unificar todo en la plataforma: `la-mar-de-gambas` y `El-Recreo` (bares) → módulo Hostelería; `war300` (rutinas de gimnasio) → futuro módulo Entrenamiento; `Sueloslagiralda-web` (web de empresa) → servicio de webs.
- Modelo (confirmado): una sola plataforma modular. Cada empresa recibe "su" app combinando módulos (Pendientes de obra, Control de horario…), su marca (logo, colores) y opciones/campos propios. Una sola base de datos con RLS por organización. Lo que no quepa en configuración se hace como módulo nuevo, que luego entra en el catálogo.

Plan técnico del MVP: `docs/plan-mvp.md`.

## Al empezar cada sesión
- `cp .env.example .env.local` (dirección y clave publicable de Supabase; no son secretas).
- El entorno tiene permitido `dafmorfftnucsxcsafop.supabase.co` (red Personalizada) para probar el login de verdad.
- Supabase MCP: cualquier SQL con `DELETE` se cancela solo; evitarlo o pedir a Carlos que lo ejecute en el SQL Editor.
- Tests de seguridad de la base: `select pruebas.aislamiento(), pruebas.admin(), pruebas.clientes();` → 'OK'. Flujo real con usuario de prueba: ver `docs/pruebas.md`.
- Carlos (carloswxht@gmail.com) es superadmin en la plataforma.
- Correos de Supabase: el SMTP de serie NO envía; hace falta SMTP propio (Resend) para el correo de aprobación y «olvidé mi contraseña». Pendiente de Carlos. Además, en Authentication → Emails las plantillas deben enlazar con token_hash (ver `src/app/auth/confirmar/route.ts`) y la Site URL debe ser el dominio real (cuando haya servidor).
- Supabase MCP: también se cancela cualquier SQL con `DROP`. Para retirar algo: `revoke` o tabla nueva.

## Lo que NO está definido (aclararlo con Carlos en plan mode antes de programar)
- Qué es exactamente el producto que se cobra y a quién (¿membresía con contenido?, ¿las aplicaciones como servicio para empresas?, ¿ambas?).
- Planes y precios. Carlos pidió explícitamente no diseñarlos aún.

## Propuesta técnica (confirmar con Carlos en la sesión 1, dar opinión clara)
La plantilla antigua (un HTML + Supabase con política abierta `anon`, un proyecto Supabase por cliente) **NO sirve para un SaaS**: sin login real cualquiera lee los datos de todos. Propuesta:
- Next.js (App Router) + TypeScript, un solo repo.
- Supabase: UN proyecto para todos los clientes. Auth real (email + contraseña / magic link), Postgres con `organizacion_id` en cada tabla y **RLS por organización**. Prohibido `using (true)` para `anon`.
- Pagos: Stripe (suscripciones, portal de cliente). Más adelante.
- Despliegue: VPS Hetzner (Alemania) con IP propia y solo dominios nuestros/de clientes, con Coolify (publica desde GitHub, vista previa por rama); comprobar que la IP está limpia antes de usarla. Sin Vercel. Nada de Cloudflare delante. Ver `docs/plan-mvp.md`.
- Entrega del SQL: siempre el SQL exacto en `supabase/migrations/` y avisar a Carlos de lo que tiene que correr.

## Diseño
- Tema oscuro `#0A0B0D`, acento azul `#3B82F6`. Tipografías: Space Grotesk (títulos), Work Sans (cuerpo), IBM Plex Mono (números, marca).
- Marca en pantalla: `[autonomIA Lab]` con cursor parpadeante.
- Móvil primero (la mayoría ve esto en el móvil). Barra inferior con menú hamburguesa, tarjetas con badge, vistas por hash.
- Evitar el aspecto de plantilla genérica de IA. No sacrificar usabilidad por estética.
- Antes de cualquier UI nueva importante: decir qué referencias/tendencias se aplican.

## Forma de trabajar con Carlos
- Antes de entregar: ejecutar lint/build/tests, probar en viewport móvil (390x844) y confirmarle que se validó.
- Cuando haya varias formas válidas, dar opinión honesta y una recomendación clara; no devolverle la pregunta.
- Feedback directo, incluso crítico.
- No inventar empresas, cifras ni testimonios. Los datos de ejemplo se marcan como "ejemplo".
- Nunca afirmar que algo "cumple la ley" (p. ej. registro de jornada) sin verificarlo en fuente oficial.
- Hacer commits pequeños con mensajes en español y trabajar en ramas; Carlos revisa las vistas previas.

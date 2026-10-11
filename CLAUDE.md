# autonomIA Lab — SaaS

Responde SIEMPRE en español. Quien habla es Carlos, fundador. **Trabaja solo desde un móvil Android** (sesiones en la nube): las respuestas deben ser cortas, claras y con el resultado primero. Nada de pedirle que ejecute comandos en un terminal: tú lo haces todo.

## Marca
- El nombre es **autonomIA Lab**. Nunca "IA Partner" / "Partner" (nombre viejo, descartado).
- Dominios: `autonomialab.com` (plataforma y membresía gratuita para captar clientes) y `autonomialab.es` (uso por confirmar).

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
- Cuentas: solicitud y aprobación manual por Carlos. Se cobra a la empresa (organización), que invita a sus empleados.
- Primeros cobros por factura manual; Stripe más adelante. Precios sin definir.
- Primera app del MVP: Pendientes de obra (Control de horario después, verificando antes la parte legal).
- Pendiente: decidir si los datos de cada cliente van en una base compartida (RLS) o separada.

## Lo que NO está definido (aclararlo con Carlos en plan mode antes de programar)
- Qué es exactamente el producto que se cobra y a quién (¿membresía con contenido?, ¿las aplicaciones como servicio para empresas?, ¿ambas?).
- Planes y precios. Carlos pidió explícitamente no diseñarlos aún.
- Quién crea cuentas: ¿registro libre, o solicitud y aprobación manual (como sugiere "Solicitar cuenta")?

## Propuesta técnica (confirmar con Carlos en la sesión 1, dar opinión clara)
La plantilla antigua (un HTML + Supabase con política abierta `anon`, un proyecto Supabase por cliente) **NO sirve para un SaaS**: sin login real cualquiera lee los datos de todos. Propuesta:
- Next.js (App Router) + TypeScript, un solo repo.
- Supabase: UN proyecto para todos los clientes. Auth real (email + contraseña / magic link), Postgres con `organizacion_id` en cada tabla y **RLS por organización**. Prohibido `using (true)` para `anon`.
- Pagos: Stripe (suscripciones, portal de cliente). Más adelante.
- Despliegue: Vercel (o Cloudflare si hay motivo). Previews por rama.
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

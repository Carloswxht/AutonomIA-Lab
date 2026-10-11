# Plan técnico del MVP — autonomIA Lab

Estado: aprobado por Carlos (sesión 1, 11 oct 2026). Nada programado todavía.

## Modelo
Una sola plataforma modular, UNA base de datos para todos los clientes. Cada empresa recibe "su" app combinando:
1. **Módulos** activados (catálogo). Primer módulo: **Hostelería** (carta digital + pedidos + panel de barra).
2. **Marca**: nombre de la app, logo, colores, tipografía.
3. **Interruptores y opciones** por empresa (ver abajo) y campos personalizados para lo raro de cada negocio.

- Cada tabla de módulo lleva `organizacion_id`. Una empresa solo ve sus filas y solo los módulos activados.
  Las tablas de módulos que no usa existen, pero para ella están vacías.
- Membresía: cuenta gratis → 3 secciones (Aplicaciones útiles, Ranking, Blog). Empresa con algún módulo comprado → acceso total.
- Lo que no quepa en opciones → se programa una vez como opción o módulo nuevo y queda en el catálogo para todos.
- Velocidad: índices por `organizacion_id` en todas las tablas; 1 o 200 clientes no se nota.

## Primer módulo: Hostelería (a partir de La Mar de Gambas)
Origen: repo `Carloswxht/la-mar-de-gambas` (HTML + Neon, carta v7 y panel v8 funcionando con cliente real).
Se **rehace** dentro de la plataforma aprovechando diseño, lógica de pedidos y SQL (reglas anti-spam, estados,
código secreto por mesa, precio que pone la base, limpieza de datos).
**La Mar de Gambas sigue funcionando tal cual** hasta que la versión de la plataforma esté igual o mejor; entonces se migra
(sus datos de Neon → la plataforma) sin cambiar los QR si es posible (redirección de las URL antiguas).

Pantallas del módulo:
- Carta pública por QR: `/<bar>/carta?mesa=N&c=CÓDIGO` (pestañas, Tapa/Plato, notas, tique, enviar pedido, estado del pedido).
- Panel de barra: pedidos (nuevo → en preparación → servido), modificar pedido, nuevo pedido del camarero,
  lista de precios y agotados, resumen del día, mesas (QR) y usuarios.
- Roles dentro de cada bar: `admin`, `barra`, `camarero`.

Interruptores por bar (los pone Carlos desde `/admin`):
- Pedidos desde la mesa (si está apagado, la carta es solo para mirar).
- Tamaños (Tapa/Plato, Copa/Botella).
- Alérgenos en la carta.
- Aceptación automática a los N minutos.
- Resumen del día.
- Futuro: checklist de apertura/cierre, reservas, etc.

## Tecnología
- Next.js (App Router) + TypeScript, un solo repo.
- Supabase (UN proyecto, región UE): Postgres con RLS por organización, Auth, Storage (logos, fotos).
  - La base de La Mar de Gambas está en Neon; los dos son Postgres, así que su SQL se aprovecha.
- **Regla antibloqueo y de Safari:** el navegador SOLO habla con nuestro dominio. Datos, login y fotos pasan por el servidor
  de la app (cookies de nuestro propio dominio). Así: (1) un bloqueo de LaLiga a IPs de Supabase/Cloudflare en España no
  rompe la app; (2) Safari/iPhone no bloquea el login (problema que La Mar de Gambas tuvo con Neon Auth).
- Hospedaje (decidido 11 oct): **Hetzner desde el principio, sin Vercel**. VPS en Alemania con IP propia (~6–10 €/mes con copias)
  y Coolify para publicar solo desde GitHub (cada push publica; vista previa por rama). Nada de Cloudflare delante.
  El contenedor de Claude Code no tiene SSH: el servidor se crea por la API de Hetzner (token como secreto del entorno,
  dominio `api.hetzner.cloud` permitido) y se instala solo al arrancar (cloud-init).
- Tests: Vitest (lógica), Playwright a 390x844 (pantallas), tests de aislamiento RLS (empresa A no ve nada de B;
  usuario anónimo solo puede crear pedidos válidos).
- CI en GitHub Actions: lint + build + tests en cada push.

## Base de datos (primera migración)
Plataforma:
- `organizaciones`: nombre, slug, nombre_app, logo_url, colores, tipografía, estado.
- `perfiles` (`es_superadmin` solo Carlos), `miembros` (usuario ↔ organización, rol).
- `solicitudes_cuenta` (anon solo INSERTA, nunca lee).
- `modulos` (catálogo) y `organizacion_modulos` (activos + `config` jsonb con los interruptores).
Hostelería (todas con `organizacion_id`):
- `hos_categorias`, `hos_productos` (con tamaños y precio por tamaño, agotado, oculto, alérgenos),
  `hos_mesas` (código secreto), `hos_pedidos`, `hos_pedido_lineas` (copian nombre, tamaño y precio del momento).
- Pedidos de clientes anónimos: solo a través de funciones del servidor que comprueban código de mesa y límites anti-spam.
- Sin `using (true)` para `anon` en ninguna tabla.

## Pasos (cada uno = commit pequeño + vista previa)
1. Esqueleto Next.js, colores y tipografías, marca `[autonomIA Lab]`, CI.
2. Proyecto Supabase + migración de plataforma + RLS + tests de aislamiento.
3. Portada + solicitar cuenta + login.
4. Panel `/admin` de Carlos: solicitudes, empresas, módulos, marca, interruptores.
5. Panel de miembros (gratis / total).
6. Hostelería — carta pública con la marca del bar.
7. Hostelería — pedidos desde la mesa + panel de barra.
8. Hostelería — precios, mesas/QR, usuarios, resumen del día.
9. Segundo bar de ejemplo con otra marca (para enseñar a clientes; datos marcados como "ejemplo").
10. Despliegue en VPS + dominio `autonomialab.com` (`.es` redirige). Prueba en iPhone y Android y un día de partido.
11. Migrar La Mar de Gambas a la plataforma (cuando Carlos y el local lo aprueben).

## Mientras tanto
Si aparece un bar nuevo antes de que el módulo esté listo: copiar La Mar de Gambas (1–2 días) y migrarlo después.
Aceptable con 2–3 bares; a partir de 4–5 copias el mantenimiento se dispara.

## Fuera del MVP
Pendientes de obra y Control de horario (este último, verificando antes la normativa en fuente oficial), módulos comunes
(clientes, presupuestos, tareas, checklist), webs de clientes (kit base, una carpeta por cliente, mismo servidor),
Stripe y planes, blog/ranking reales, Universidad/Agentes/Plantillas, subdominio o dominio propio por cliente,
notificaciones push, instancia dedicada.

## Costes previstos (no crecen por cliente)
- Supabase Pro ~25 $/mes (el gratis se pausa y solo permite 2 proyectos activos; Carlos ya tiene 2).
- VPS Hetzner ~6–10 €/mes (también da las vistas previas). Sin Vercel.
- Envío de correos (p. ej. Resend): plan gratis con límite; comprobar antes de lanzar.

## Riesgos y avisos
- Bloqueos de LaLiga: ver regla antibloqueo. Comprobar en bandaancha.eu/bloqueos-futbol las IPs elegidas.
- El rehacer Hostelería cuesta trabajo una vez; a cambio, cada bar nuevo es configuración, no código.

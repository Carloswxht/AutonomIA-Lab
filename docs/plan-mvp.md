# Plan técnico del MVP — autonomIA Lab

Estado: aprobado por Carlos (sesión 1). Nada programado todavía.

## Modelo
Una sola plataforma modular. Cada empresa (organización) recibe "su" app combinando:
1. Módulos activados (catálogo): en el MVP solo **Pendientes de obra**.
2. Marca: nombre de la app, logo, color principal.
3. Opciones: nombres de las cosas ("obra"/"proyecto"…), estados, campos extra.

Membresía: cuenta gratis → 3 secciones (Aplicaciones útiles, Ranking, Blog). Empresa con algún módulo comprado → acceso total.
Lo que no quepa en opciones → módulo nuevo, cobrado a ese cliente, que luego entra al catálogo.

## Tecnología
- Next.js (App Router) + TypeScript, un solo repo. Estilos con variables CSS sacadas de `prototipos/`.
- Supabase (UN proyecto, región UE): Auth, Postgres con `organizacion_id` y RLS por organización, Storage para fotos.
- Vercel para desplegar, con vista previa por rama. `autonomialab.com` principal; `autonomialab.es` redirige a `.com`.
- Tests: Vitest (lógica), Playwright en 390x844 (pantallas), tests de aislamiento RLS (empresa A no ve nada de empresa B).
- CI en GitHub Actions: lint + build + tests en cada push.

## Base de datos (primera migración)
- `organizaciones`: nombre, slug, nombre_app, logo_url, color_primario, estado (activa/suspendida).
- `perfiles`: un registro por usuario; `es_superadmin` (solo Carlos).
- `miembros`: usuario ↔ organización, rol `admin` | `empleado`.
- `solicitudes_cuenta`: nombre, email, empresa, teléfono, mensaje, estado (pendiente/aprobada/rechazada).
- `modulos`: catálogo (clave, nombre).
- `organizacion_modulos`: qué módulos tiene cada empresa + `config` (jsonb: nombres, estados, campos extra).
- Pendientes de obra: `obras` (nombre, dirección, estado) y `pendientes` (obra, texto, para quién, estado, foto, creado por, fecha, `extra` jsonb).
- RLS en todas: solo miembros de la organización; superadmin ve todo. Sin `using (true)` para `anon`
  (única excepción: `anon` puede INSERTAR en `solicitudes_cuenta`, nunca leer).

## Pantallas
| Ruta | Qué es |
|---|---|
| `/` | Portada filtro (como `prototipos/index.html`) |
| `/solicitar` | Formulario de solicitud de cuenta |
| `/entrar` | Login (email + contraseña o enlace mágico) |
| `/miembros` | Panel de tarjetas; las de pago bloqueadas → WhatsApp |
| `/miembros/aplicaciones` | Catálogo de aplicaciones útiles (demos de los prototipos) |
| `/app` | "Su" app: marca de la empresa + módulos activos |
| `/app/pendientes` | Módulo Pendientes de obra |
| `/app/equipo` | El admin de la empresa invita empleados |
| `/admin` | Panel de Carlos: solicitudes, empresas, módulos, marca |

## Pasos (cada uno = commit pequeño + vista previa)
1. Esqueleto Next.js, tipografías/colores, marca `[autonomIA Lab]`, CI.
2. Migración SQL + RLS + tests de aislamiento.
3. Portada + solicitar cuenta.
4. Login + invitaciones.
5. Panel `/admin`: aprobar solicitud → crea empresa e invita a su admin; activar módulos; logo y color.
6. Panel de miembros con reglas gratis / total.
7. Módulo Pendientes de obra (crear pendiente con foto, filtrar por obra, marcar resuelto, aviso al destinatario).
8. Despliegue en Vercel + dominios. Prueba completa en móvil.

## Fuera del MVP
Stripe y planes, Control de horario (antes verificar la normativa en fuente oficial), blog/ranking reales,
Universidad/Agentes/Plantillas, subdominio por cliente, notificaciones push, instancia dedicada.

## Riesgos y avisos
- Emails: el correo de Supabase gratis tiene un límite muy bajo por hora → configurar un servicio de envío (p. ej. Resend) antes de clientes reales.
- Supabase gratis se pausa por inactividad y permite 2 proyectos activos → plan Pro con el primer cliente.
- Vercel gratis no permite uso comercial → plan Pro al lanzar.

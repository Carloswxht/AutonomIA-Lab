# Correos de las cuentas con la imagen de cada negocio (para MultiBar, Gymbro y los productos que vengan)

Desde el 23 oct todos los correos del login de Supabase (cambiar contraseña, bienvenida, confirmar correo…) los
manda la Edge Function común **`enviar-correo`** (Supabase Auth → Hooks → Send Email Hook; código en
`AutonomIA-Lab/supabase/functions/enviar-correo/`). El correo sale desde `avisos@autonomialab.com` con el
**nombre del negocio como remitente**, su logo y sus colores, y el botón lleva a la página que lo pidió.

## Qué tiene que hacer cada producto (en su propia sesión)

### 1. Sus colores y su logo: `public.marca_correo_<tipo>`
Una función en su `datos/cambios/` (nombre con el tipo del negocio al final: `marca_correo_multibar`,
`marca_correo_gymbro`…). La común (`public.marca_correo`, de `AutonomIA-Lab`) la llama sola si existe.

```sql
create or replace function public.marca_correo_multibar(p_negocio integer) returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'logo',    ...,   -- dirección https COMPLETA de la imagen (no rutas relativas); PNG o JPG, mejor ancha y baja
    'fondo',   ...,   -- #RRGGBB: color de fuera de la tarjeta
    'tarjeta', ...,   -- #RRGGBB (opcional: si falta, se saca del fondo)
    'texto',   ...,   -- #RRGGBB
    'acento',  ...,   -- #RRGGBB: botón y franja de arriba
    'nombre',  ...,   -- opcional: si el producto usa otro nombre que comun.negocios.nombre
    'responder_a', ..., -- opcional: correo al que llegan las respuestas (si no, comun.negocios.correo_legal)
    'entrar', ...)      -- opcional: página https://…autonomialab.es donde entran sus cuentas (si alguien pide el
                        --   correo desde autonomialab.es, el botón lleva aquí; MultiBar y Gymbro ya tienen la suya por defecto)
  from multibar.ajustes_multibar a where a.negocio_id = p_negocio;
$$;
revoke all on function public.marca_correo_multibar(integer) from public, anon, authenticated;
grant execute on function public.marca_correo_multibar(integer) to service_role;
```
- Todas las claves son opcionales; lo que falte o no sea válido se ignora. Si el texto no se lee sobre el fondo,
  el correo lo corrige solo. Si la función falla, el correo sale igual con los colores de autonomIA Lab.
- Pistas con los datos de hoy: **MultiBar** guarda `ajustes->'aspecto'->'colores'` (`fondo`, `texto`, `principal`,
  `acento`; para el botón encaja mejor `principal`) y el icono como ruta relativa
  (`datos/bares/SLUG/icono-512.png` → `https://carta.autonomialab.es/datos/bares/SLUG/icono-512.png`).
  **Gymbro** guarda `ajustes_gymbro.logo` (`/icons/icon-512.png` → `https://gymbro.autonomialab.es/icons/icon-512.png`)
  y un tema (`aspecto->>'tema'`, p. ej. `theme-dark`) que hay que traducir a colores.
- Probarla con dos negocios y mandar la huella md5 como siempre.

### 2. Recuperar contraseña y bienvenida con Supabase
- `supabase.auth.resetPasswordForEmail(correo, { redirectTo: 'https://<subdominio>/<página>/' })`.
  La dirección debe estar en «Redirect URLs» (ya están `https://carta.autonomialab.es/**` y
  `https://gymbro.autonomialab.es/**`); si no, Supabase manda a `https://autonomialab.es` y la web la reenvía a
  su propia página (la sesión quedaría en la web de autonomIA Lab, no en el producto).
- El botón del correo abre esa página con `?token_hash=…&type=recovery` (o `&token_hash=…` si ya llevaba «?»).
  La página llama a `supabase.auth.verifyOtp({ token_hash, type })` y luego pide la contraseña nueva con
  `updateUser({ password })`.
- Después, quitar el permiso (`revoke execute`, sin DROP) a las funciones viejas de token y apagar las Edge
  Functions propias de recuperar contraseña cuando ya no se usen.

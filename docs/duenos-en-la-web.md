# Los dueños de los negocios entran en la web de autonomIA Lab (para MultiBar, Gymbro y los que vengan)

Decisión de Carlos (24 oct): quien contrata un producto tiene membresía. La cuenta de **administrador** de la app de un
negocio entra en `autonomialab.es` con su **mismo correo y contraseña**, como miembro y cliente de su negocio, mientras:
- el negocio esté activo y tenga algún producto contratado activo (`comun.productos_contratados`),
- su producto diga que es administradora (`public.es_dueno_<tipo>`, abajo), y
- Carlos no le haya quitado el acceso desde `/admin` → ficha del negocio.

Camareros, socios de gimnasio y demás personal **no** entran. No se crea nada: la web lo comprueba cada vez
(`privado.dueno_autonomialab`, en `datos/cambios/2026-10-25-duenos-en-la-web.sql` de `AutonomIA-Lab`).

## Qué tiene que hacer cada producto (en su propia sesión)

Una función en su `datos/cambios/`, con su tipo al final del nombre, que diga si una cuenta de `comun.usuarios` es
administradora de su negocio. Mientras no exista, nadie de ese producto entra solo (como hasta ahora).

```sql
-- MultiBar (rol en multibar.personal_multibar.role)
create or replace function public.es_dueno_multibar(p_usuario integer) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from multibar.personal_multibar p
                  where p.usuario_id = p_usuario and p.role = 'admin');
$$;
revoke all on function public.es_dueno_multibar(integer) from public, anon, authenticated;

-- Gymbro (rol en gymbro.socios_gymbro.rol)
create or replace function public.es_dueno_gymbro(p_usuario integer) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from gymbro.socios_gymbro s
                  where s.usuario_id = p_usuario and s.rol = 'admin');
$$;
revoke all on function public.es_dueno_gymbro(integer) from public, anon, authenticated;
```
- Solo la llama la base común (nadie desde la web). Si el producto distingue «dueño» de «encargado», que devuelva
  true solo para quien contrata.
- Probarla con dos negocios y aplicar con el OK de Carlos, como siempre.
- Después, en la ficha del negocio de `autonomialab.es/admin/` sale cada dueño con «Entra» y el botón para quitarle el
  acceso.

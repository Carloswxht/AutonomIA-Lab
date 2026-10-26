-- autonomIA Lab · 24 oct 2026 · public.marca_correo devuelve además el slug del negocio, si la cuenta es miembro de la
-- web (miembro_web) y la página «entrar» que dé el producto. Así, si una cuenta de un negocio pide el correo desde
-- autonomialab.es, «enviar-correo» lleva el botón a la página de su producto (Carlos, 24 oct: pidió cambiar la
-- contraseña de La Torre Bar desde la web y el enlace le llevaba a una web donde esa cuenta no entra).
-- Base: autonomialab-db. Repositorio dueño: AutonomIA-Lab. Sustituye a la de 2026-10-23-marca-correo.sql (mismos permisos).
-- Sin DELETE ni DROP. Se puede volver a aplicar.

create or replace function public.marca_correo(p_auth_id uuid) returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_neg comun.negocios;
  v_persona text;
  v_marca jsonb;
  v_extra jsonb;
  v_funcion text;
begin
  select u.name into v_persona from comun.usuarios u where u.auth_id = p_auth_id;
  select n.* into v_neg
    from comun.usuarios u join comun.negocios n on n.id = u.negocio_id
   where u.auth_id = p_auth_id;

  -- Miembros de la web y cuenta de plataforma: imagen de autonomIA Lab.
  if v_neg.id is null or v_neg.tipo = 'plataforma' then
    if v_persona is null then
      select m.nombre into v_persona from autonomialab.miembros_autonomialab m where m.auth_id = p_auth_id;
    end if;
    return jsonb_strip_nulls(jsonb_build_object('marca', 'autonomialab', 'persona', v_persona));
  end if;

  v_marca := jsonb_build_object(
    'marca', 'negocio', 'producto', v_neg.tipo, 'nombre', v_neg.nombre, 'persona', v_persona,
    'logo', case when v_neg.logo ~ '^https://' then v_neg.logo end,
    'responder_a', nullif(btrim(v_neg.correo_legal), ''), 'slug', v_neg.slug,
    'miembro_web', exists (select 1 from autonomialab.miembros_autonomialab m where m.auth_id = p_auth_id));

  -- Colores y logo propios del producto, si ya tiene su función.
  v_funcion := 'marca_correo_' || v_neg.tipo;
  if v_neg.tipo ~ '^[a-z0-9_]+$' and to_regprocedure(format('public.%I(integer)', v_funcion)) is not null then
    begin
      execute format('select public.%I($1)', v_funcion) into v_extra using v_neg.id;
      if jsonb_typeof(v_extra) = 'object' then
        v_marca := v_marca || jsonb_strip_nulls(
          jsonb_build_object(
            'nombre', v_extra->>'nombre', 'logo', v_extra->>'logo', 'fondo', v_extra->>'fondo',
            'tarjeta', v_extra->>'tarjeta', 'texto', v_extra->>'texto', 'acento', v_extra->>'acento',
            'responder_a', v_extra->>'responder_a', 'entrar', v_extra->>'entrar'));
      end if;
    exception when others then
      raise warning 'marca_correo: % falló (%)', v_funcion, sqlerrm;
    end;
  end if;

  return jsonb_strip_nulls(v_marca);
end;
$$;
revoke all on function public.marca_correo(uuid) from public, anon, authenticated;
grant execute on function public.marca_correo(uuid) to service_role;

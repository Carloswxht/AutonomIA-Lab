-- autonomIA Lab · 25 oct 2026 · Los dueños de los negocios clientes entran en la web con su misma cuenta (Carlos, 24 oct).
-- Base: autonomialab-db. Repositorio dueño: AutonomIA-Lab (carpetas comun y autonomialab).
--
-- Regla: una cuenta de comun.usuarios entra en autonomialab.es como miembro y cliente de su negocio si
--   · su negocio está activo, no es la plataforma y tiene algún producto contratado activo,
--   · su producto dice que es administradora (public.es_dueno_<tipo>(usuario) → true; la pone cada producto), y
--   · Carlos no le ha quitado el acceso a mano (autonomialab.accesos_dueno_autonomialab).
-- No se crea nada: se comprueba cada vez (si el negocio se da de baja o deja de ser admin, pierde el acceso solo).
-- Mientras un producto no tenga su es_dueno_<tipo>, sus cuentas no entran (como hasta hoy).
-- Camareros, socios y demás personal no entran nunca por esta regla.
--
-- Cambia: yo_autonomialab, admin_cliente_autonomialab (+ dueños), solicitar_acceso_autonomialab (mensaje) y
-- marca_correo (miembro_web). Nuevas: privado.es_dueno_negocio, privado.dueno_autonomialab,
-- admin_acceso_dueno_autonomialab y admin_duenos_web_autonomialab. Sin DELETE ni DROP. Se puede volver a aplicar.

create table if not exists autonomialab.accesos_dueno_autonomialab (
  auth_id     uuid primary key references auth.users (id) on delete cascade,
  quitado     boolean not null default true,
  cambiado_en timestamptz not null default now()
);
comment on table autonomialab.accesos_dueno_autonomialab is
  'Dueños a los que Carlos ha quitado (quitado = true) o devuelto el acceso automático a la web.';
alter table autonomialab.accesos_dueno_autonomialab enable row level security;
revoke all on autonomialab.accesos_dueno_autonomialab from public, anon, authenticated;

-- ¿Esta cuenta (comun.usuarios.id) es administradora de su negocio según su producto? Sin función del producto, no.
create or replace function privado.es_dueno_negocio(p_usuario integer, p_tipo text) returns boolean
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_funcion text := 'es_dueno_' || p_tipo;
  v_si boolean;
begin
  if p_tipo !~ '^[a-z0-9_]+$' or to_regprocedure(format('public.%I(integer)', v_funcion)) is null then
    return false;
  end if;
  execute format('select public.%I($1)', v_funcion) into v_si using p_usuario;
  return coalesce(v_si, false);
exception when others then
  raise warning 'es_dueno_negocio: % falló (%)', v_funcion, sqlerrm;
  return false;
end;
$$;
revoke all on function privado.es_dueno_negocio(integer, text) from public, anon, authenticated;

-- Negocio del que esta cuenta de Supabase es dueña con acceso a la web (o null).
create or replace function privado.dueno_autonomialab(p_auth uuid) returns integer
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_usuario integer;
  v_negocio integer;
  v_tipo text;
begin
  if p_auth is null then
    return null;
  end if;
  select u.id, n.id, n.tipo into v_usuario, v_negocio, v_tipo
    from comun.usuarios u join comun.negocios n on n.id = u.negocio_id
   where u.auth_id = p_auth and u.active and n.activo and n.tipo <> 'plataforma'
     and exists (select 1 from comun.productos_contratados p where p.negocio_id = n.id and p.activo);
  if v_usuario is null
     or exists (select 1 from autonomialab.accesos_dueno_autonomialab a where a.auth_id = p_auth and a.quitado)
     or not privado.es_dueno_negocio(v_usuario, v_tipo) then
    return null;
  end if;
  return v_negocio;
end;
$$;
revoke all on function privado.dueno_autonomialab(uuid) from public, anon, authenticated;

create or replace function public.yo_autonomialab() returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_res jsonb;
  v_neg integer;
begin
  if v_uid is null then
    return null;
  end if;
  if privado.es_plataforma() then
    select jsonb_build_object('tipo', 'plataforma', 'nombre', u.name, 'email', u.email, 'cliente', null)
      into v_res from comun.usuarios u where u.auth_id = v_uid;
    return v_res;
  end if;
  select jsonb_build_object(
           'tipo', 'miembro', 'nombre', m.nombre, 'email', au.email,
           'cliente', (
             select jsonb_build_object(
                      'negocio_id', n.id, 'nombre', n.nombre, 'tipo', n.tipo, 'rol', c.rol,
                      'productos', coalesce((select jsonb_agg(p.producto order by p.producto)
                                               from comun.productos_contratados p
                                              where p.negocio_id = n.id and p.activo), '[]'::jsonb))
               from autonomialab.clientes_autonomialab c join comun.negocios n on n.id = c.negocio_id
              where c.auth_id = m.auth_id and c.activo and n.activo))
    into v_res
    from autonomialab.miembros_autonomialab m join auth.users au on au.id = m.auth_id
   where m.auth_id = v_uid;
  if v_res is not null then
    return v_res;
  end if;

  -- Dueño de un negocio activo con producto contratado (24 oct): entra con su misma cuenta, como cliente.
  v_neg := privado.dueno_autonomialab(v_uid);
  if v_neg is null then
    return null;
  end if;
  select jsonb_build_object(
           'tipo', 'miembro', 'nombre', u.name, 'email', au.email, 'automatico', true,
           'cliente', jsonb_build_object(
                        'negocio_id', n.id, 'nombre', n.nombre, 'tipo', n.tipo, 'rol', 'admin',
                        'productos', coalesce((select jsonb_agg(p.producto order by p.producto)
                                                 from comun.productos_contratados p
                                                where p.negocio_id = n.id and p.activo), '[]'::jsonb)))
    into v_res
    from comun.usuarios u join comun.negocios n on n.id = u.negocio_id join auth.users au on au.id = u.auth_id
   where u.auth_id = v_uid and n.id = v_neg;
  return v_res;
end;
$$;

create or replace function public.admin_cliente_autonomialab(p_negocio integer) returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_res jsonb;
begin
  perform privado.exigir_plataforma_autonomialab();
  select jsonb_build_object(
           'id', n.id, 'nombre', n.nombre, 'slug', n.slug, 'tipo', n.tipo, 'activo', n.activo,
           'alta', n.created_at, 'titular', n.titular, 'nif', n.nif, 'correo_legal', n.correo_legal,
           'telefono_legal', n.telefono_legal,
           'cuentas_app', (select count(*) from comun.usuarios u where u.negocio_id = n.id and u.active),
           'productos', coalesce((select jsonb_agg(jsonb_build_object('producto', p.producto, 'activo', p.activo,
                                                                        'desde', p.desde) order by p.producto)
                                    from comun.productos_contratados p where p.negocio_id = n.id), '[]'::jsonb),
           'personas', coalesce((select jsonb_agg(jsonb_build_object('auth_id', c.auth_id, 'email', au.email,
                                                                       'nombre', m.nombre, 'rol', c.rol)
                                                  order by c.rol, au.email)
                                   from autonomialab.clientes_autonomialab c
                                   join autonomialab.miembros_autonomialab m on m.auth_id = c.auth_id
                                   join auth.users au on au.id = c.auth_id
                                  where c.negocio_id = n.id and c.activo), '[]'::jsonb),
           -- Dueños con acceso automático (24 oct): las cuentas que su producto dice que son administradoras.
           'acceso_automatico', n.activo and exists (select 1 from comun.productos_contratados p
                                                      where p.negocio_id = n.id and p.activo),
           'producto_dice_duenos', to_regprocedure(format('public.%I(integer)', 'es_dueno_' || n.tipo)) is not null,
           'duenos', coalesce((select jsonb_agg(jsonb_build_object(
                                        'auth_id', u.auth_id, 'email', u.email, 'nombre', u.name,
                                        'quitado', coalesce(a.quitado, false)) order by u.email)
                                 from comun.usuarios u
                                 left join autonomialab.accesos_dueno_autonomialab a on a.auth_id = u.auth_id
                                where u.negocio_id = n.id and u.active and u.auth_id is not null
                                  and privado.es_dueno_negocio(u.id, n.tipo)), '[]'::jsonb))
    into v_res
    from comun.negocios n
   where n.id = p_negocio and n.tipo <> 'plataforma';
  return v_res;
end;
$$;

create or replace function public.solicitar_acceso_autonomialab(p_email text) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_email text := privado.limpiar_correo(p_email);
  v_token uuid;
begin
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or char_length(v_email) > 254 then
    raise exception 'Revisa el correo: no parece válido.';
  end if;
  if exists (select 1 from autonomialab.miembros_autonomialab m join auth.users u on u.id = m.auth_id
              where lower(u.email) = v_email) then
    raise exception 'Ese correo ya tiene acceso. Entra con tu contraseña o usa «¿Olvidaste tu contraseña?».';
  end if;
  if exists (select 1 from comun.usuarios u where lower(u.email) = v_email
              and privado.dueno_autonomialab(u.auth_id) is not null) then
    raise exception 'Ese correo ya tiene acceso: es el de tu negocio. Entra con tu contraseña o usa «¿Olvidaste tu contraseña?».';
  end if;
  if exists (select 1 from comun.usuarios u where lower(u.email) = v_email) then
    raise exception 'Ese correo ya se usa en la aplicación de un negocio. Para esta web, usa otro correo.';
  end if;
  if (select count(*) from autonomialab.solicitudes_acceso_autonomialab s
       where s.creado_en > now() - interval '1 hour') >= 200 then
    raise exception 'Demasiadas solicitudes ahora mismo. Prueba más tarde.';
  end if;

  -- Si ya pidió acceso y sigue pendiente, se reutiliza su solicitud.
  select s.token into v_token from autonomialab.solicitudes_acceso_autonomialab s
   where lower(s.email) = v_email and s.estado = 'pendiente'
   order by s.creado_en desc limit 1;
  if v_token is null then
    insert into autonomialab.solicitudes_acceso_autonomialab (email) values (v_email) returning token into v_token;
  end if;
  return v_token;
end;
$$;

-- Plataforma: quitar (p_quitar = true) o devolver el acceso automático de un dueño a la web. No borra nada.
create or replace function public.admin_acceso_dueno_autonomialab(p_negocio integer, p_auth uuid, p_quitar boolean)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  perform privado.exigir_plataforma_autonomialab();
  if not exists (select 1 from comun.usuarios u where u.auth_id = p_auth and u.negocio_id = p_negocio) then
    raise exception 'Esa cuenta no es de este negocio.';
  end if;
  insert into autonomialab.accesos_dueno_autonomialab (auth_id, quitado) values (p_auth, coalesce(p_quitar, true))
  on conflict (auth_id) do update set quitado = excluded.quitado, cambiado_en = now();
end;
$$;

-- Plataforma: dueños que hoy entran en la web por la regla automática (para la lista de miembros de /admin).
create or replace function public.admin_duenos_web_autonomialab()
returns table (auth_id uuid, email text, nombre text, negocio text, ha_entrado boolean)
language plpgsql stable security definer set search_path = ''
as $$
begin
  perform privado.exigir_plataforma_autonomialab();
  return query
    select u.auth_id, u.email, u.name, n.nombre, au.last_sign_in_at is not null
      from comun.usuarios u
      join comun.negocios n on n.id = u.negocio_id
      join auth.users au on au.id = u.auth_id
     where privado.dueno_autonomialab(u.auth_id) = n.id
     order by n.nombre, u.email
     limit 500;
end;
$$;

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
    'miembro_web', exists (select 1 from autonomialab.miembros_autonomialab m where m.auth_id = p_auth_id)
                   or privado.dueno_autonomialab(p_auth_id) is not null);

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

revoke all on function public.yo_autonomialab() from public, anon;
grant execute on function public.yo_autonomialab() to authenticated;
revoke all on function public.admin_cliente_autonomialab(integer) from public, anon;
grant execute on function public.admin_cliente_autonomialab(integer) to authenticated;
revoke all on function public.admin_acceso_dueno_autonomialab(integer, uuid, boolean) from public, anon;
grant execute on function public.admin_acceso_dueno_autonomialab(integer, uuid, boolean) to authenticated;
revoke all on function public.admin_duenos_web_autonomialab() from public, anon;
grant execute on function public.admin_duenos_web_autonomialab() to authenticated;
revoke all on function public.marca_correo(uuid) from public, anon, authenticated;
grant execute on function public.marca_correo(uuid) to service_role;

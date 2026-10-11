-- Mensajes adaptados a «Solicitar acceso» (ya no hay registro libre).
create or replace function public.admin_nuevo_cliente(p_email text, p_nombre text default null)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_usuario uuid;
  v_email text;
  v_org uuid;
begin
  if not privado.es_superadmin() then
    raise exception 'No tienes permiso para crear clientes.';
  end if;

  select u.id, u.email into v_usuario, v_email from auth.users u where lower(u.email) = lower(trim(p_email));
  if v_usuario is null then
    raise exception 'Ese correo todavía no tiene acceso. Que lo solicite en autonomialab.com y apruébalo primero.';
  end if;

  insert into public.organizaciones (nombre, slug)
  values (
    coalesce(nullif(trim(p_nombre), ''), v_email),
    'c-' || substr(md5(gen_random_uuid()::text), 1, 10)
  )
  returning id into v_org;
  insert into public.miembros (organizacion_id, usuario_id, rol) values (v_org, v_usuario, 'admin');
  return v_org;
end;
$$;

create or replace function public.admin_anadir_miembro(p_org uuid, p_email text, p_rol text)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_usuario uuid;
begin
  if not privado.es_superadmin() then
    raise exception 'No tienes permiso para añadir miembros.';
  end if;
  if p_rol not in ('admin', 'empleado') then
    raise exception 'Rol no válido.';
  end if;

  select u.id into v_usuario from auth.users u where lower(u.email) = lower(trim(p_email));
  if v_usuario is null then
    raise exception 'Ese correo todavía no tiene acceso. Que lo solicite en autonomialab.com y apruébalo primero.';
  end if;

  insert into public.miembros (organizacion_id, usuario_id, rol) values (p_org, v_usuario, p_rol)
  on conflict (organizacion_id, usuario_id) do update set rol = excluded.rol;
end;
$$;

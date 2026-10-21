-- autonomIA Lab · Funciones del panel de administración (paso 4).
-- Hacen falta porque la app no puede leer auth.users (correos) ni hacer varios cambios a la vez de forma segura.
-- Todas comprueban quién llama: solo Carlos (superadmin), salvo admin_miembros (también el admin de esa empresa).

-- Aprobar una solicitud: crea la empresa, marca la solicitud como aprobada y, si ya existe un usuario con
-- ese correo, lo añade como administrador de la empresa. Devuelve el id de la empresa.
create function public.admin_aprobar_solicitud(p_solicitud uuid, p_nombre text, p_slug text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_email text;
  v_org uuid;
  v_usuario uuid;
begin
  if not privado.es_superadmin() then
    raise exception 'No tienes permiso para aprobar solicitudes.';
  end if;

  select s.email into v_email from public.solicitudes_cuenta s
  where s.id = p_solicitud and s.estado = 'pendiente'
  for update;
  if v_email is null then
    raise exception 'Esa solicitud ya no está pendiente.';
  end if;

  insert into public.organizaciones (nombre, slug) values (trim(p_nombre), p_slug) returning id into v_org;
  update public.solicitudes_cuenta set estado = 'aprobada' where id = p_solicitud;

  select u.id into v_usuario from auth.users u where lower(u.email) = lower(v_email);
  if v_usuario is not null then
    insert into public.miembros (organizacion_id, usuario_id, rol) values (v_org, v_usuario, 'admin');
  end if;

  return v_org;
exception
  when unique_violation then
    raise exception 'Ya existe una empresa con esa dirección corta (%). Cambia el nombre.', p_slug;
end;
$$;

-- Añadir a una empresa un usuario que ya existe (por su correo).
create function public.admin_anadir_miembro(p_org uuid, p_email text, p_rol text)
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
    raise exception 'No hay ningún usuario con ese correo. Créalo primero en Supabase (Authentication → Users → Add user).';
  end if;

  insert into public.miembros (organizacion_id, usuario_id, rol) values (p_org, v_usuario, p_rol)
  on conflict (organizacion_id, usuario_id) do update set rol = excluded.rol;
end;
$$;

-- Miembros de una empresa con su correo (Carlos o el admin de esa empresa).
create function public.admin_miembros(p_org uuid)
returns table (usuario_id uuid, email text, nombre text, rol text)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not (privado.es_superadmin() or privado.es_admin_de(p_org)) then
    raise exception 'No tienes permiso para ver los miembros de esta empresa.';
  end if;
  return query
    select m.usuario_id, u.email::text, p.nombre, m.rol
    from public.miembros m
    join auth.users u on u.id = m.usuario_id
    left join public.perfiles p on p.id = m.usuario_id
    where m.organizacion_id = p_org
    order by m.rol, u.email;
end;
$$;

revoke all on function public.admin_aprobar_solicitud(uuid, text, text) from public, anon;
revoke all on function public.admin_anadir_miembro(uuid, text, text) from public, anon;
revoke all on function public.admin_miembros(uuid) from public, anon;
grant execute on function public.admin_aprobar_solicitud(uuid, text, text) to authenticated;
grant execute on function public.admin_anadir_miembro(uuid, text, text) to authenticated;
grant execute on function public.admin_miembros(uuid) to authenticated;

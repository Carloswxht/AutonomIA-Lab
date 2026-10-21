-- Con el registro libre, el mensaje para un correo sin cuenta ya no manda a crear el usuario en Supabase.
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
    raise exception 'Ese correo todavía no tiene cuenta. Pídele que se registre primero en autonomialab.com.';
  end if;

  insert into public.miembros (organizacion_id, usuario_id, rol) values (p_org, v_usuario, p_rol)
  on conflict (organizacion_id, usuario_id) do update set rol = excluded.rol;
end;
$$;

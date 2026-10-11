-- autonomIA Lab · Registro libre (correo + contraseña + confirmación por email), decidido por Carlos el 11 oct.
-- Ya no hay "Solicitar cuenta": la tabla solicitudes_cuenta se conserva como histórico, pero nadie puede escribir.
-- Las empresas solo se crean cuando alguien compra una aplicación: Carlos escribe el correo del cliente.

revoke execute on function public.solicitar_cuenta(text, text, text, text, text) from anon, authenticated;

-- Nuevo cliente: crea su espacio (empresa) y lo deja como administrador. El cliente no rellena nada:
-- el nombre comercial, la marca, etc. los pone Carlos después. Devuelve el id de la empresa.
create function public.admin_nuevo_cliente(p_email text, p_nombre text default null)
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
    raise exception 'Ese correo todavía no tiene cuenta. Pídele que se registre primero en autonomialab.com.';
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

-- Usuarios registrados (para el panel de Carlos).
create function public.admin_usuarios()
returns table (id uuid, email text, creado_en timestamptz, confirmado boolean, empresas bigint)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not privado.es_superadmin() then
    raise exception 'No tienes permiso para ver los usuarios.';
  end if;
  return query
    select u.id, u.email::text, u.created_at, u.email_confirmed_at is not null,
           (select count(*) from public.miembros m where m.usuario_id = u.id)
    from auth.users u
    where u.banned_until is null or u.banned_until < now()
    order by u.created_at desc
    limit 200;
end;
$$;

revoke all on function public.admin_nuevo_cliente(text, text) from public, anon;
revoke all on function public.admin_usuarios() from public, anon;
grant execute on function public.admin_nuevo_cliente(text, text) to authenticated;
grant execute on function public.admin_usuarios() to authenticated;

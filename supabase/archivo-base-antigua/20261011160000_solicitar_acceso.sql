-- autonomIA Lab · "Solicitar acceso" solo con el correo + aprobación de Carlos (decidido el 11 oct, sustituye
-- al registro libre). Tras pedir acceso, la persona puede contar (opcional) qué tipo de negocio tiene.
-- Al aprobar, se crea su usuario (sin contraseña) y la app le envía un correo para entrar y crear la contraseña.
-- Tabla nueva: solicitudes_cuenta (versión anterior) se queda como histórico sin uso.
-- Sin DROP/DELETE: la conexión de Claude con Supabase cancela esas órdenes.

create table public.solicitudes_acceso (
  id            uuid primary key default gen_random_uuid(),
  email         text not null check (char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  token         uuid not null unique default gen_random_uuid(),
  estado        text not null default 'pendiente' check (estado in ('pendiente', 'aprobada', 'rechazada')),
  tipo          text check (tipo in ('autonomo', 'pyme', 'empresa', 'otro')),
  sector        text check (char_length(sector) <= 60),
  nombre        text check (char_length(nombre) <= 120),
  telefono      text check (char_length(telefono) <= 30),
  mensaje       text check (char_length(mensaje) <= 1000),
  creado_en     timestamptz not null default now(),
  completada_en timestamptz
);
create index solicitudes_acceso_estado_idx on public.solicitudes_acceso (estado, creado_en desc);
create index solicitudes_acceso_email_idx on public.solicitudes_acceso (lower(email));
comment on table public.solicitudes_acceso is 'Peticiones de acceso (solo correo + datos opcionales). Solo Carlos las ve.';

revoke all on public.solicitudes_acceso from anon, authenticated;
grant select, update on public.solicitudes_acceso to authenticated;
alter table public.solicitudes_acceso enable row level security;
create policy solicitudes_acceso_ver on public.solicitudes_acceso for select to authenticated
  using (privado.es_superadmin());
create policy solicitudes_acceso_cambiar on public.solicitudes_acceso for update to authenticated
  using (privado.es_superadmin()) with check (privado.es_superadmin());

-- Paso 1 (visitante sin sesión): deja su correo. Devuelve el código de su solicitud para el paso 2.
create function public.solicitar_acceso(p_email text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_email text := lower(trim(p_email));
  v_token uuid;
begin
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or char_length(v_email) > 254 then
    raise exception 'Revisa el correo: no parece válido.';
  end if;
  if exists (select 1 from auth.users u where lower(u.email) = v_email) then
    raise exception 'Ese correo ya tiene acceso. Entra con tu contraseña o usa «¿Olvidaste tu contraseña?».';
  end if;
  if (select count(*) from public.solicitudes_acceso s where s.creado_en > now() - interval '1 hour') >= 200 then
    raise exception 'Demasiadas solicitudes ahora mismo. Prueba más tarde.';
  end if;

  -- Si ya pidió acceso y sigue pendiente, se reutiliza su solicitud.
  select s.token into v_token from public.solicitudes_acceso s
  where lower(s.email) = v_email and s.estado = 'pendiente'
  order by s.creado_en desc limit 1;
  if v_token is null then
    insert into public.solicitudes_acceso (email) values (v_email) returning token into v_token;
  end if;
  return v_token;
end;
$$;

-- Paso 2 (opcional): datos del negocio, con el código del paso 1. Solo mientras siga pendiente.
create function public.completar_solicitud(
  p_token uuid, p_tipo text, p_sector text, p_nombre text, p_telefono text, p_mensaje text
) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  update public.solicitudes_acceso set
    tipo = case when p_tipo in ('autonomo', 'pyme', 'empresa', 'otro') then p_tipo end,
    sector = nullif(left(trim(coalesce(p_sector, '')), 60), ''),
    nombre = nullif(left(trim(coalesce(p_nombre, '')), 120), ''),
    telefono = nullif(left(trim(coalesce(p_telefono, '')), 30), ''),
    mensaje = nullif(left(trim(coalesce(p_mensaje, '')), 1000), ''),
    completada_en = now()
  where token = p_token and estado = 'pendiente';
  if not found then
    raise exception 'Esta solicitud ya no se puede modificar.';
  end if;
end;
$$;

-- Aprobar: crea el usuario (correo confirmado, sin contraseña) si no existe y marca la solicitud.
-- Devuelve el correo para que la app le envíe el enlace de acceso.
create function public.admin_aprobar_acceso(p_solicitud uuid)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_email text;
  v_usuario uuid;
  v_nombre text;
begin
  if not privado.es_superadmin() then
    raise exception 'No tienes permiso para aprobar solicitudes.';
  end if;

  select lower(s.email), s.nombre into v_email, v_nombre from public.solicitudes_acceso s
  where s.id = p_solicitud and s.estado = 'pendiente'
  for update;
  if v_email is null then
    raise exception 'Esa solicitud ya no está pendiente.';
  end if;

  select u.id into v_usuario from auth.users u where lower(u.email) = v_email;
  if v_usuario is null then
    v_usuario := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token
    ) values (
      '00000000-0000-0000-0000-000000000000', v_usuario, 'authenticated', 'authenticated', v_email, '', now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      case when v_nombre is null then '{}'::jsonb else jsonb_build_object('nombre', v_nombre) end,
      now(), now(), '', '', '', '', '', '', '', ''
    );
    insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at)
    values (v_usuario::text, v_usuario,
      jsonb_build_object('sub', v_usuario::text, 'email', v_email, 'email_verified', true), 'email', now(), now());
  end if;

  update public.solicitudes_acceso set estado = 'aprobada' where id = p_solicitud;
  return v_email;
end;
$$;

-- La aprobación antigua (crear empresa al aprobar) ya no se usa: se le quita el permiso.
revoke execute on function public.admin_aprobar_solicitud(uuid, text, text) from authenticated;

revoke all on function public.solicitar_acceso(text) from public;
revoke all on function public.completar_solicitud(uuid, text, text, text, text, text) from public;
revoke all on function public.admin_aprobar_acceso(uuid) from public, anon;
grant execute on function public.solicitar_acceso(text) to anon, authenticated;
grant execute on function public.completar_solicitud(uuid, text, text, text, text, text) to anon, authenticated;
grant execute on function public.admin_aprobar_acceso(uuid) to authenticated;

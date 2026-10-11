-- autonomIA Lab · Plataforma: empresas, usuarios, miembros, solicitudes y módulos.
-- Regla: TODAS las tablas con RLS. Nada abierto a `anon`. Las ayudas de seguridad viven en el
-- esquema `privado`, que la API no expone.

create schema if not exists privado;
revoke all on schema privado from public, anon, authenticated;
grant usage on schema privado to authenticated;

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

create table public.organizaciones (
  id             uuid primary key default gen_random_uuid(),
  nombre         text not null check (char_length(nombre) between 1 and 120),
  slug           text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 60),
  nombre_app     text check (char_length(nombre_app) <= 60),
  logo_url       text check (char_length(logo_url) <= 500),
  color_primario text check (color_primario ~ '^#[0-9A-Fa-f]{6}$'),
  color_acento   text check (color_acento ~ '^#[0-9A-Fa-f]{6}$'),
  estado         text not null default 'activa' check (estado in ('activa', 'suspendida')),
  creado_en      timestamptz not null default now()
);
comment on table public.organizaciones is 'Cada empresa cliente. Marca (nombre_app, logo, colores) configurable por Carlos.';

create table public.perfiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  nombre         text check (char_length(nombre) <= 120),
  es_superadmin  boolean not null default false,
  creado_en      timestamptz not null default now()
);
comment on table public.perfiles is 'Un registro por usuario. es_superadmin solo para Carlos (se pone a mano por SQL).';

create table public.miembros (
  organizacion_id uuid not null references public.organizaciones (id) on delete cascade,
  usuario_id      uuid not null references auth.users (id) on delete cascade,
  rol             text not null default 'empleado' check (rol in ('admin', 'empleado')),
  creado_en       timestamptz not null default now(),
  primary key (organizacion_id, usuario_id)
);
create index miembros_usuario_idx on public.miembros (usuario_id);
comment on table public.miembros is 'Qué usuarios pertenecen a qué empresa y con qué rol.';

create table public.solicitudes_cuenta (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null check (char_length(nombre) between 1 and 120),
  email      text not null check (char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  empresa    text check (char_length(empresa) <= 120),
  telefono   text check (char_length(telefono) <= 30),
  mensaje    text check (char_length(mensaje) <= 1000),
  estado     text not null default 'pendiente' check (estado in ('pendiente', 'aprobada', 'rechazada')),
  creado_en  timestamptz not null default now()
);
create index solicitudes_estado_idx on public.solicitudes_cuenta (estado, creado_en desc);
create index solicitudes_email_idx on public.solicitudes_cuenta (lower(email), creado_en desc);
comment on table public.solicitudes_cuenta is 'Solicitudes desde "Solicitar cuenta". Solo Carlos las ve. Se crean con public.solicitar_cuenta().';

create table public.modulos (
  clave       text primary key check (clave ~ '^[a-z_]+$'),
  nombre      text not null,
  descripcion text
);
comment on table public.modulos is 'Catálogo de módulos (Hostelería, Pendientes de obra…).';

create table public.organizacion_modulos (
  organizacion_id uuid not null references public.organizaciones (id) on delete cascade,
  modulo          text not null references public.modulos (clave) on delete restrict,
  activo          boolean not null default true,
  config          jsonb not null default '{}'::jsonb check (jsonb_typeof(config) = 'object'),
  creado_en       timestamptz not null default now(),
  primary key (organizacion_id, modulo)
);
comment on table public.organizacion_modulos is 'Módulos que tiene cada empresa y sus interruptores/opciones (config).';

insert into public.modulos (clave, nombre, descripcion) values
  ('hosteleria', 'Hostelería', 'Carta digital por QR, pedidos desde la mesa y panel de barra.');

-- ---------------------------------------------------------------------------
-- Ayudas de seguridad (security definer: leen sin pasar por RLS, evitan recursión)
-- ---------------------------------------------------------------------------

create function privado.es_superadmin() returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce((select p.es_superadmin from public.perfiles p where p.id = auth.uid()), false);
$$;

create function privado.es_miembro(org uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.miembros m
    join public.organizaciones o on o.id = m.organizacion_id
    where m.organizacion_id = org and m.usuario_id = auth.uid() and o.estado = 'activa'
  );
$$;

create function privado.es_admin_de(org uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.miembros m
    join public.organizaciones o on o.id = m.organizacion_id
    where m.organizacion_id = org and m.usuario_id = auth.uid() and m.rol = 'admin' and o.estado = 'activa'
  );
$$;

create function privado.comparte_organizacion(otro uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.miembros yo
    join public.miembros el on el.organizacion_id = yo.organizacion_id
    where yo.usuario_id = auth.uid() and el.usuario_id = otro
  );
$$;

revoke all on function privado.es_superadmin(), privado.es_miembro(uuid), privado.es_admin_de(uuid),
  privado.comparte_organizacion(uuid) from public, anon;
grant execute on function privado.es_superadmin(), privado.es_miembro(uuid), privado.es_admin_de(uuid),
  privado.comparte_organizacion(uuid) to authenticated;

-- Perfil automático al crear un usuario.
create function privado.crear_perfil() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.perfiles (id, nombre)
  values (new.id, nullif(left(coalesce(new.raw_user_meta_data ->> 'nombre', ''), 120), ''));
  return new;
end;
$$;
revoke all on function privado.crear_perfil() from public, anon, authenticated;

create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function privado.crear_perfil();

-- No se puede quitar ni degradar al último admin de una empresa.
create function privado.proteger_ultimo_admin() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if old.rol = 'admin'
     and (tg_op = 'DELETE' or new.rol <> 'admin')
     and exists (select 1 from public.organizaciones o where o.id = old.organizacion_id)
     and not exists (
       select 1 from public.miembros m
       where m.organizacion_id = old.organizacion_id and m.rol = 'admin' and m.usuario_id <> old.usuario_id
     ) then
    raise exception 'La empresa no puede quedarse sin administrador.';
  end if;
  return coalesce(new, old);
end;
$$;
revoke all on function privado.proteger_ultimo_admin() from public, anon, authenticated;

create trigger proteger_ultimo_admin
  before update or delete on public.miembros
  for each row execute function privado.proteger_ultimo_admin();

-- ---------------------------------------------------------------------------
-- Permisos de tabla: nada para anon; lo justo para authenticated (RLS filtra filas)
-- ---------------------------------------------------------------------------

revoke all on public.organizaciones, public.perfiles, public.miembros, public.solicitudes_cuenta,
  public.modulos, public.organizacion_modulos from anon, authenticated;

grant select, insert, update, delete on public.organizaciones to authenticated;
grant select on public.perfiles to authenticated;
grant update (nombre) on public.perfiles to authenticated;  -- es_superadmin NO se puede tocar desde la app
grant select, insert, update, delete on public.miembros to authenticated;
grant select, update, delete on public.solicitudes_cuenta to authenticated;
grant select on public.modulos to authenticated;
grant select, insert, update, delete on public.organizacion_modulos to authenticated;

alter table public.organizaciones       enable row level security;
alter table public.perfiles             enable row level security;
alter table public.miembros             enable row level security;
alter table public.solicitudes_cuenta   enable row level security;
alter table public.modulos              enable row level security;
alter table public.organizacion_modulos enable row level security;

-- ---------------------------------------------------------------------------
-- Políticas RLS
-- ---------------------------------------------------------------------------

-- Empresas: los miembros ven la suya; solo Carlos crea, cambia o borra.
create policy organizaciones_ver on public.organizaciones for select to authenticated
  using (privado.es_miembro(id) or privado.es_superadmin());
create policy organizaciones_crear on public.organizaciones for insert to authenticated
  with check (privado.es_superadmin());
create policy organizaciones_cambiar on public.organizaciones for update to authenticated
  using (privado.es_superadmin()) with check (privado.es_superadmin());
create policy organizaciones_borrar on public.organizaciones for delete to authenticated
  using (privado.es_superadmin());

-- Perfiles: el propio, los compañeros de empresa y Carlos. Cada uno cambia solo su nombre.
create policy perfiles_ver on public.perfiles for select to authenticated
  using (id = auth.uid() or privado.comparte_organizacion(id) or privado.es_superadmin());
create policy perfiles_cambiar on public.perfiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Miembros: los de la empresa se ven entre sí; el admin de la empresa (o Carlos) gestiona.
create policy miembros_ver on public.miembros for select to authenticated
  using (privado.es_miembro(organizacion_id) or privado.es_superadmin());
create policy miembros_crear on public.miembros for insert to authenticated
  with check (privado.es_admin_de(organizacion_id) or privado.es_superadmin());
create policy miembros_cambiar on public.miembros for update to authenticated
  using (privado.es_admin_de(organizacion_id) or privado.es_superadmin())
  with check (privado.es_admin_de(organizacion_id) or privado.es_superadmin());
create policy miembros_borrar on public.miembros for delete to authenticated
  using (privado.es_admin_de(organizacion_id) or privado.es_superadmin());

-- Solicitudes: solo Carlos.
create policy solicitudes_ver on public.solicitudes_cuenta for select to authenticated
  using (privado.es_superadmin());
create policy solicitudes_cambiar on public.solicitudes_cuenta for update to authenticated
  using (privado.es_superadmin()) with check (privado.es_superadmin());
create policy solicitudes_borrar on public.solicitudes_cuenta for delete to authenticated
  using (privado.es_superadmin());

-- Catálogo de módulos: lo ve cualquier usuario con sesión; se cambia solo por migración.
create policy modulos_ver on public.modulos for select to authenticated
  using (true);

-- Módulos de cada empresa: los ven sus miembros; solo Carlos los activa o configura.
create policy org_modulos_ver on public.organizacion_modulos for select to authenticated
  using (privado.es_miembro(organizacion_id) or privado.es_superadmin());
create policy org_modulos_crear on public.organizacion_modulos for insert to authenticated
  with check (privado.es_superadmin());
create policy org_modulos_cambiar on public.organizacion_modulos for update to authenticated
  using (privado.es_superadmin()) with check (privado.es_superadmin());
create policy org_modulos_borrar on public.organizacion_modulos for delete to authenticated
  using (privado.es_superadmin());

-- ---------------------------------------------------------------------------
-- Solicitar cuenta (única puerta para visitantes sin sesión)
-- ---------------------------------------------------------------------------

create function public.solicitar_cuenta(
  p_nombre text, p_email text, p_empresa text default null, p_telefono text default null, p_mensaje text default null
) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_email text := lower(trim(p_email));
begin
  -- Anti-spam: máximo 3 solicitudes por correo en 24 h y 200 en total por hora.
  if (select count(*) from public.solicitudes_cuenta s
      where lower(s.email) = v_email and s.creado_en > now() - interval '24 hours') >= 3 then
    raise exception 'Ya hemos recibido tu solicitud. Te contestaremos pronto.';
  end if;
  if (select count(*) from public.solicitudes_cuenta s where s.creado_en > now() - interval '1 hour') >= 200 then
    raise exception 'Demasiadas solicitudes ahora mismo. Prueba más tarde.';
  end if;

  insert into public.solicitudes_cuenta (nombre, email, empresa, telefono, mensaje)
  values (trim(p_nombre), v_email, nullif(trim(p_empresa), ''), nullif(trim(p_telefono), ''), nullif(trim(p_mensaje), ''));
end;
$$;
revoke all on function public.solicitar_cuenta(text, text, text, text, text) from public;
grant execute on function public.solicitar_cuenta(text, text, text, text, text) to anon, authenticated;

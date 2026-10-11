-- Tests de aislamiento entre empresas (RLS), guardados como función para poder lanzarlos cuando haga falta:
--   select pruebas.aislamiento();   → 'OK' o el motivo del fallo.
-- Todo lo que crea (usuarios y empresas de ejemplo) se deshace al terminar: el bloque interior acaba
-- siempre en excepción y Postgres vuelve atrás hasta el punto de guardado.
-- Esquema `pruebas`: no expuesto por la API y sin permisos para anon/authenticated.

create schema if not exists pruebas;
revoke all on schema pruebas from public, anon, authenticated;

create or replace function pruebas.aislamiento() returns text
language plpgsql
set search_path = ''
as $fn$
declare
  a uuid := gen_random_uuid();  -- admin de la empresa 1
  b uuid := gen_random_uuid();  -- admin de la empresa 2
  c uuid := gen_random_uuid();  -- empleado de la empresa 1
  s uuid := gen_random_uuid();  -- superadmin (Carlos)
  x uuid := gen_random_uuid();  -- usuario sin empresa
  o1 uuid; o2 uuid;
  n int;
  fallo boolean;
begin
  begin
    insert into auth.users (id, email) values
      (a, 'ejemplo-a@ejemplo.test'), (b, 'ejemplo-b@ejemplo.test'), (c, 'ejemplo-c@ejemplo.test'),
      (s, 'ejemplo-s@ejemplo.test'), (x, 'ejemplo-x@ejemplo.test');
    update public.perfiles set es_superadmin = true where id = s;

    insert into public.organizaciones (nombre, slug) values ('Ejemplo Uno', 'ejemplo-uno') returning id into o1;
    insert into public.organizaciones (nombre, slug) values ('Ejemplo Dos', 'ejemplo-dos') returning id into o2;
    insert into public.miembros values (o1, a, 'admin'), (o2, b, 'admin'), (o1, c, 'empleado');
    insert into public.organizacion_modulos (organizacion_id, modulo) values (o1, 'hosteleria'), (o2, 'hosteleria');
    insert into public.solicitudes_cuenta (nombre, email) values ('Ejemplo', 'ejemplo@ejemplo.test');

    -- ---------- Admin de la empresa 1 ----------
    perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
    perform set_config('role', 'authenticated', true);

    select count(*) into n from public.organizaciones;
    if n <> 1 then raise exception 'A ve % empresas (debería ver 1)', n; end if;
    select count(*) into n from public.organizaciones where id = o2;
    if n <> 0 then raise exception 'A ve la empresa 2'; end if;
    select count(*) into n from public.miembros where organizacion_id = o2;
    if n <> 0 then raise exception 'A ve miembros de la empresa 2'; end if;
    select count(*) into n from public.organizacion_modulos where organizacion_id = o2;
    if n <> 0 then raise exception 'A ve módulos de la empresa 2'; end if;
    select count(*) into n from public.perfiles;
    if n <> 2 then raise exception 'A ve % perfiles (debería ver 2: el suyo y su compañero)', n; end if;
    select count(*) into n from public.solicitudes_cuenta;
    if n <> 0 then raise exception 'A ve solicitudes de cuenta'; end if;

    update public.organizaciones set nombre = 'Hackeado' where id = o2;
    update public.organizaciones set color_primario = '#FF0000' where id = o1;
    select count(*) into n from public.organizaciones where nombre = 'Hackeado' or color_primario = '#FF0000';
    if n <> 0 then raise exception 'A pudo cambiar una empresa'; end if;

    fallo := false;
    begin insert into public.organizaciones (nombre, slug) values ('Nueva', 'nueva'); exception when others then fallo := true; end;
    if not fallo then raise exception 'A pudo crear una empresa'; end if;

    fallo := false;
    begin insert into public.miembros values (o2, a, 'admin'); exception when others then fallo := true; end;
    if not fallo then raise exception 'A pudo meterse en la empresa 2'; end if;

    fallo := false;
    begin update public.perfiles set es_superadmin = true where id = a; exception when others then fallo := true; end;
    if not fallo then raise exception 'A pudo hacerse superadmin'; end if;

    fallo := false;
    begin insert into public.organizacion_modulos (organizacion_id, modulo) values (o1, 'hosteleria'); exception when others then fallo := true; end;
    if not fallo then raise exception 'A pudo activarse módulos'; end if;

    fallo := false;
    begin delete from public.miembros where usuario_id = a; exception when others then fallo := true; end;
    if not fallo then raise exception 'La empresa 1 se quedó sin administrador'; end if;

    -- El admin sí puede cambiar el rol de su empleado (y vuelve a dejarlo).
    update public.miembros set rol = 'admin' where organizacion_id = o1 and usuario_id = c;
    get diagnostics n = row_count;
    if n <> 1 then raise exception 'A no pudo gestionar a su empleado'; end if;
    update public.miembros set rol = 'empleado' where organizacion_id = o1 and usuario_id = c;

    -- ---------- Empleado de la empresa 1 ----------
    perform set_config('role', 'none', true);
    perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
    perform set_config('role', 'authenticated', true);

    fallo := false;
    begin insert into public.miembros values (o1, x, 'admin'); exception when others then fallo := true; end;
    if not fallo then raise exception 'Un empleado pudo añadir miembros'; end if;
    delete from public.miembros where usuario_id = a;
    get diagnostics n = row_count;
    if n <> 0 then raise exception 'Un empleado pudo borrar al admin'; end if;

    -- ---------- Usuario sin empresa ----------
    perform set_config('role', 'none', true);
    perform set_config('request.jwt.claims', json_build_object('sub', x, 'role', 'authenticated')::text, true);
    perform set_config('role', 'authenticated', true);
    select count(*) into n from public.organizaciones;
    if n <> 0 then raise exception 'Un usuario sin empresa ve % empresas', n; end if;
    select count(*) into n from public.miembros;
    if n <> 0 then raise exception 'Un usuario sin empresa ve miembros'; end if;

    -- ---------- Superadmin ----------
    perform set_config('role', 'none', true);
    perform set_config('request.jwt.claims', json_build_object('sub', s, 'role', 'authenticated')::text, true);
    perform set_config('role', 'authenticated', true);
    select count(*) into n from public.organizaciones where id in (o1, o2);
    if n <> 2 then raise exception 'El superadmin no ve las dos empresas'; end if;
    select count(*) into n from public.solicitudes_cuenta where email = 'ejemplo@ejemplo.test';
    if n <> 1 then raise exception 'El superadmin no ve las solicitudes'; end if;

    -- ---------- Empresa suspendida: sus miembros dejan de verla ----------
    update public.organizaciones set estado = 'suspendida' where id = o1;
    perform set_config('role', 'none', true);
    perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
    perform set_config('role', 'authenticated', true);
    select count(*) into n from public.organizaciones;
    if n <> 0 then raise exception 'Una empresa suspendida sigue visible'; end if;

    -- ---------- Visitante sin sesión (anon) ----------
    perform set_config('role', 'none', true);
    perform set_config('request.jwt.claims', '{"role":"anon"}', true);
    perform set_config('role', 'anon', true);

    fallo := false;
    begin perform 1 from public.organizaciones; exception when insufficient_privilege then fallo := true; end;
    if not fallo then raise exception 'anon puede leer empresas'; end if;
    fallo := false;
    begin perform 1 from public.solicitudes_cuenta; exception when insufficient_privilege then fallo := true; end;
    if not fallo then raise exception 'anon puede leer solicitudes'; end if;
    fallo := false;
    begin perform privado.es_superadmin(); exception when insufficient_privilege then fallo := true; end;
    if not fallo then raise exception 'anon puede usar el esquema privado'; end if;

    perform public.solicitar_cuenta('Ejemplo anon', 'ejemplo-anon@ejemplo.test');
    perform public.solicitar_cuenta('Ejemplo anon', 'ejemplo-anon@ejemplo.test');
    perform public.solicitar_cuenta('Ejemplo anon', 'ejemplo-anon@ejemplo.test');
    fallo := false;
    begin perform public.solicitar_cuenta('Ejemplo anon', 'ejemplo-anon@ejemplo.test'); exception when others then fallo := true; end;
    if not fallo then raise exception 'El límite anti-spam de solicitudes no funciona'; end if;
    fallo := false;
    begin perform public.solicitar_cuenta('', 'no-es-un-correo'); exception when others then fallo := true; end;
    if not fallo then raise exception 'Se aceptó una solicitud con datos no válidos'; end if;

    perform set_config('role', 'none', true);
    raise exception 'OK';
  exception when others then
    return sqlerrm;
  end;
end;
$fn$;

revoke all on function pruebas.aislamiento() from public, anon, authenticated;

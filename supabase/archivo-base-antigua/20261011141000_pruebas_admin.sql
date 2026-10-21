-- Tests de las funciones del panel de administración: select pruebas.admin(); → 'OK' o el motivo del fallo.
-- Mismo mecanismo que pruebas.aislamiento(): todo se deshace al terminar. Sin sentencias DELETE (ver CLAUDE.md).

create or replace function pruebas.admin() returns text
language plpgsql
set search_path = ''
as $fn$
declare
  a uuid := gen_random_uuid();  -- admin de la empresa 1 (no superadmin)
  s uuid := gen_random_uuid();  -- superadmin
  e uuid := gen_random_uuid();  -- usuario que pidió cuenta
  o1 uuid; o2 uuid; nueva uuid; sol uuid;
  n int;
  fallo boolean;
begin
  begin
    insert into auth.users (id, email) values
      (a, 'ejemplo-a@ejemplo.test'), (s, 'ejemplo-s@ejemplo.test'), (e, 'ejemplo-e@ejemplo.test');
    update public.perfiles set es_superadmin = true where id = s;
    insert into public.organizaciones (nombre, slug) values ('Ejemplo Uno', 'ejemplo-uno') returning id into o1;
    insert into public.organizaciones (nombre, slug) values ('Ejemplo Dos', 'ejemplo-dos') returning id into o2;
    insert into public.miembros values (o1, a, 'admin');
    insert into public.solicitudes_cuenta (nombre, email, empresa)
      values ('Ejemplo', 'EJEMPLO-E@ejemplo.test', 'Ejemplo Tres') returning id into sol;

    -- ---------- Admin de empresa (no superadmin) ----------
    perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
    perform set_config('role', 'authenticated', true);

    fallo := false;
    begin perform public.admin_aprobar_solicitud(sol, 'X', 'x'); exception when others then fallo := true; end;
    if not fallo then raise exception 'Un admin de empresa pudo aprobar solicitudes'; end if;
    fallo := false;
    begin perform public.admin_anadir_miembro(o1, 'ejemplo-e@ejemplo.test', 'empleado'); exception when others then fallo := true; end;
    if not fallo then raise exception 'Un admin de empresa pudo usar admin_anadir_miembro'; end if;
    select count(*) into n from public.admin_miembros(o1);
    if n <> 1 then raise exception 'El admin no ve los miembros de su empresa'; end if;
    fallo := false;
    begin perform public.admin_miembros(o2); exception when others then fallo := true; end;
    if not fallo then raise exception 'Un admin ve los miembros de otra empresa'; end if;

    -- ---------- Visitante sin sesión ----------
    perform set_config('role', 'none', true);
    perform set_config('request.jwt.claims', '{"role":"anon"}', true);
    perform set_config('role', 'anon', true);
    fallo := false;
    begin perform public.admin_miembros(o1); exception when insufficient_privilege then fallo := true; end;
    if not fallo then raise exception 'anon puede usar admin_miembros'; end if;
    fallo := false;
    begin perform public.admin_aprobar_solicitud(sol, 'X', 'x'); exception when insufficient_privilege then fallo := true; end;
    if not fallo then raise exception 'anon puede usar admin_aprobar_solicitud'; end if;

    -- ---------- Superadmin ----------
    perform set_config('role', 'none', true);
    perform set_config('request.jwt.claims', json_build_object('sub', s, 'role', 'authenticated')::text, true);
    perform set_config('role', 'authenticated', true);

    fallo := false;
    begin perform public.admin_aprobar_solicitud(sol, 'Repetida', 'ejemplo-uno'); exception when others then fallo := true; end;
    if not fallo then raise exception 'Se aceptó una dirección corta repetida'; end if;
    select count(*) into n from public.solicitudes_cuenta where id = sol and estado = 'pendiente';
    if n <> 1 then raise exception 'Un fallo al aprobar dejó la solicitud a medias'; end if;

    nueva := public.admin_aprobar_solicitud(sol, 'Ejemplo Tres', 'ejemplo-tres');
    select count(*) into n from public.solicitudes_cuenta where id = sol and estado = 'aprobada';
    if n <> 1 then raise exception 'La solicitud no quedó aprobada'; end if;
    select count(*) into n from public.miembros where organizacion_id = nueva and usuario_id = e and rol = 'admin';
    if n <> 1 then raise exception 'Quien pidió la cuenta no quedó como admin de su empresa'; end if;
    fallo := false;
    begin perform public.admin_aprobar_solicitud(sol, 'Otra', 'otra'); exception when others then fallo := true; end;
    if not fallo then raise exception 'Se pudo aprobar dos veces la misma solicitud'; end if;

    fallo := false;
    begin perform public.admin_anadir_miembro(o1, 'nadie@ejemplo.test', 'empleado'); exception when others then fallo := true; end;
    if not fallo then raise exception 'Se añadió un correo que no existe'; end if;
    perform public.admin_anadir_miembro(o1, 'ejemplo-e@ejemplo.test', 'empleado');
    perform public.admin_anadir_miembro(o1, 'ejemplo-e@ejemplo.test', 'admin');
    select count(*) into n from public.miembros where organizacion_id = o1 and usuario_id = e and rol = 'admin';
    if n <> 1 then raise exception 'admin_anadir_miembro no actualiza el rol'; end if;

    perform set_config('role', 'none', true);
    raise exception 'OK';
  exception when others then
    return sqlerrm;
  end;
end;
$fn$;

revoke all on function pruebas.admin() from public, anon, authenticated;

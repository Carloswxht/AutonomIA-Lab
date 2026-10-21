-- Tests del flujo "Solicitar acceso" y del panel: select pruebas.admin(); → 'OK' o el motivo del fallo.
-- Sustituye a la versión anterior (que probaba la aprobación antigua). Todo se deshace al terminar.
create or replace function pruebas.admin() returns text
language plpgsql
set search_path = ''
as $fn$
declare
  a uuid := gen_random_uuid();
  s uuid := gen_random_uuid();
  e uuid := gen_random_uuid();
  o1 uuid; o2 uuid;
  tk uuid; tk2 uuid; sol uuid;
  correo text;
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

    -- ---------- Visitante sin sesión: pide acceso ----------
    perform set_config('request.jwt.claims', '{"role":"anon"}', true);
    perform set_config('role', 'anon', true);
    tk := public.solicitar_acceso(' Ejemplo-Nuevo@Ejemplo.TEST ');
    tk2 := public.solicitar_acceso('ejemplo-nuevo@ejemplo.test');
    if tk is distinct from tk2 then raise exception 'Pedir acceso dos veces crea dos solicitudes'; end if;
    fallo := false;
    begin perform public.solicitar_acceso('ejemplo-e@ejemplo.test'); exception when others then fallo := true; end;
    if not fallo then raise exception 'Se pidió acceso con un correo que ya tiene cuenta'; end if;
    fallo := false;
    begin perform public.solicitar_acceso('no-es-correo'); exception when others then fallo := true; end;
    if not fallo then raise exception 'Se aceptó un correo no válido'; end if;
    perform public.completar_solicitud(tk, 'autonomo', 'Hostelería', 'Ejemplo Nuevo', '600000000', 'Ejemplo');
    fallo := false;
    begin perform public.completar_solicitud(gen_random_uuid(), 'pyme', 'x', 'x', 'x', 'x'); exception when others then fallo := true; end;
    if not fallo then raise exception 'Se completó una solicitud con un código inventado'; end if;
    fallo := false;
    begin perform 1 from public.solicitudes_acceso; exception when insufficient_privilege then fallo := true; end;
    if not fallo then raise exception 'anon puede leer solicitudes de acceso'; end if;
    fallo := false;
    begin perform public.admin_aprobar_acceso(gen_random_uuid()); exception when insufficient_privilege then fallo := true; end;
    if not fallo then raise exception 'anon puede usar admin_aprobar_acceso'; end if;
    fallo := false;
    begin perform public.admin_miembros(o1); exception when insufficient_privilege then fallo := true; end;
    if not fallo then raise exception 'anon puede usar admin_miembros'; end if;

    -- ---------- Admin de empresa (no superadmin) ----------
    perform set_config('role', 'none', true);
    perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
    perform set_config('role', 'authenticated', true);
    select count(*) into n from public.solicitudes_acceso;
    if n <> 0 then raise exception 'Un usuario normal ve solicitudes de acceso'; end if;
    select id into sol from public.solicitudes_acceso limit 1;
    fallo := false;
    begin perform public.admin_aprobar_acceso((select id from public.solicitudes_acceso limit 1)); exception when others then fallo := true; end;
    if not fallo then raise exception 'Un usuario normal pudo aprobar'; end if;
    fallo := false;
    begin perform public.admin_anadir_miembro(o1, 'ejemplo-e@ejemplo.test', 'empleado'); exception when others then fallo := true; end;
    if not fallo then raise exception 'Un admin de empresa pudo usar admin_anadir_miembro'; end if;
    select count(*) into n from public.admin_miembros(o1);
    if n <> 1 then raise exception 'El admin no ve los miembros de su empresa'; end if;
    fallo := false;
    begin perform public.admin_miembros(o2); exception when others then fallo := true; end;
    if not fallo then raise exception 'Un admin ve los miembros de otra empresa'; end if;

    -- ---------- Superadmin: ve y aprueba ----------
    perform set_config('role', 'none', true);
    perform set_config('request.jwt.claims', json_build_object('sub', s, 'role', 'authenticated')::text, true);
    perform set_config('role', 'authenticated', true);
    select id into sol from public.solicitudes_acceso where token = tk and sector = 'Hostelería' and tipo = 'autonomo';
    if sol is null then raise exception 'El superadmin no ve la solicitud con sus datos'; end if;
    correo := public.admin_aprobar_acceso(sol);
    if correo <> 'ejemplo-nuevo@ejemplo.test' then raise exception 'La aprobación devolvió otro correo (%)', correo; end if;

    perform set_config('role', 'none', true);
    select count(*) into n from auth.users u
      where u.email = 'ejemplo-nuevo@ejemplo.test' and u.email_confirmed_at is not null;
    if n <> 1 then raise exception 'Al aprobar no se creó el usuario confirmado'; end if;
    select count(*) into n from public.perfiles p join auth.users u on u.id = p.id
      where u.email = 'ejemplo-nuevo@ejemplo.test' and p.nombre = 'Ejemplo Nuevo' and not p.es_superadmin;
    if n <> 1 then raise exception 'El nuevo usuario no tiene perfil o tiene permisos de más'; end if;
    perform set_config('role', 'authenticated', true);

    fallo := false;
    begin perform public.admin_aprobar_acceso(sol); exception when others then fallo := true; end;
    if not fallo then raise exception 'Se pudo aprobar dos veces'; end if;
    perform set_config('role', 'none', true);
    perform set_config('role', 'anon', true);
    fallo := false;
    begin perform public.completar_solicitud(tk, 'pyme', 'x', 'x', 'x', 'x'); exception when others then fallo := true; end;
    if not fallo then raise exception 'Se pudo cambiar una solicitud ya aprobada'; end if;
    perform set_config('role', 'none', true);
    perform set_config('role', 'authenticated', true);

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

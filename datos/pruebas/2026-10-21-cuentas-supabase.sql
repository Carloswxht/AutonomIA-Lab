-- Pruebas de datos/cambios/2026-10-21-cuentas-supabase.sql. Crean sus propios negocios y cuentas de ejemplo
-- (dos negocios + una plataforma de prueba) y al final lanzan el error 'PRUEBAS_OK', que deshace TODO:
-- no queda nada guardado. Si algo falla, el error dice qué. Se pueden lanzar en local y en Supabase.
do $pruebas$
declare
  v_sufijo text := substr(md5(random()::text), 1, 8);
  v_a int; v_b int; v_plat int;
  v_barra int; v_plataforma int; v_socio int;
  v_auth uuid; v_auth_plat uuid; v_auth_barra uuid; v_miembro uuid;
  v_token uuid; v_token2 uuid; v_email text; v_yo jsonb; v_n int;
  v_ok boolean;
begin
  -- Negocios de prueba
  insert into comun.negocios (slug, nombre, tipo) values ('prueba-a-' || v_sufijo, 'Prueba A (ejemplo)', 'multibar') returning id into v_a;
  insert into comun.negocios (slug, nombre, tipo) values ('prueba-b-' || v_sufijo, 'Prueba B (ejemplo)', 'gymbro') returning id into v_b;
  insert into comun.negocios (slug, nombre, tipo) values ('prueba-p-' || v_sufijo, 'Plataforma de prueba', 'plataforma') returning id into v_plat;
  insert into comun.productos_contratados (negocio_id, producto) values (v_a, 'multibar'), (v_b, 'gymbro');

  -- 1. Alta de una cuenta desde un producto → nace su cuenta de Supabase con la misma contraseña.
  insert into comun.usuarios (negocio_id, email, name, password_hash, must_change_password)
  values (v_a, 'barra-' || v_sufijo || '@ejemplo.test', 'Barra', privado.crypt('clave-uno-1', privado.gen_salt('bf', 10)), false)
  returning id, auth_id into v_barra, v_auth_barra;
  if v_auth_barra is null then raise exception 'FALLO 1: la cuenta nueva no se enlazó'; end if;
  select au.encrypted_password = privado.crypt('clave-uno-1', au.encrypted_password)
    into v_ok from auth.users au where au.id = v_auth_barra;
  if not v_ok then raise exception 'FALLO 1: la contraseña en Supabase no es la misma'; end if;
  if not exists (select 1 from auth.identities i where i.user_id = v_auth_barra and i.provider = 'email') then
    raise exception 'FALLO 1: falta la identidad de correo';
  end if;

  -- 2. El producto cambia la contraseña → se copia a Supabase.
  update comun.usuarios set password_hash = privado.crypt('clave-dos-2', privado.gen_salt('bf', 10)) where id = v_barra;
  select au.encrypted_password = privado.crypt('clave-dos-2', au.encrypted_password)
    into v_ok from auth.users au where au.id = v_auth_barra;
  if not v_ok then raise exception 'FALLO 2: el cambio de contraseña no llegó a Supabase'; end if;

  -- 3. Cambio de contraseña con Supabase (como hace «nueva contraseña») → se copia a comun.usuarios.
  update comun.usuarios set must_change_password = true, failed_attempts = 3 where id = v_barra;
  update auth.users set encrypted_password = privado.crypt('clave-tres-3', privado.gen_salt('bf', 10)) where id = v_auth_barra;
  select u.password_hash = privado.crypt('clave-tres-3', u.password_hash) and not u.must_change_password and u.failed_attempts = 0
    into v_ok from comun.usuarios u where u.id = v_barra;
  if not v_ok then raise exception 'FALLO 3: el cambio desde Supabase no llegó a comun.usuarios'; end if;

  -- 4. Cambio de correo (con punto y mayúsculas) → Supabase lo guarda limpio en minúsculas; identidad también.
  update comun.usuarios set email = 'Barra2-' || v_sufijo || '@Ejemplo.test' where id = v_barra;
  select au.email = 'barra2-' || v_sufijo || '@ejemplo.test' into v_ok from auth.users au where au.id = v_auth_barra;
  if not v_ok then raise exception 'FALLO 4: el correo no se copió'; end if;
  if not exists (select 1 from auth.identities i where i.user_id = v_auth_barra
                   and i.identity_data ->> 'email' = 'barra2-' || v_sufijo || '@ejemplo.test') then
    raise exception 'FALLO 4: la identidad no tiene el correo nuevo';
  end if;

  -- 5. Baja y vuelta → bloqueada y desbloqueada en Supabase.
  update comun.usuarios set active = false where id = v_barra;
  if not exists (select 1 from auth.users au where au.id = v_auth_barra and au.banned_until > now() + interval '50 years') then
    raise exception 'FALLO 5: la baja no bloqueó la cuenta de Supabase';
  end if;
  update comun.usuarios set active = true where id = v_barra;
  if exists (select 1 from auth.users au where au.id = v_auth_barra and au.banned_until is not null) then
    raise exception 'FALLO 5: la vuelta no desbloqueó la cuenta';
  end if;

  -- 6. Cambios que no tocan la cuenta (intentos fallidos) no tocan Supabase.
  update comun.usuarios set failed_attempts = 2 where id = v_barra;
  if (select auth_id from comun.usuarios where id = v_barra) <> v_auth_barra then raise exception 'FALLO 6'; end if;

  -- Socio de gimnasio y cuenta de plataforma de prueba.
  insert into comun.usuarios (negocio_id, email, name, password_hash)
  values (v_b, 'socio-' || v_sufijo || '@ejemplo.test', 'Socio', privado.crypt('x', privado.gen_salt('bf', 4)))
  returning id into v_socio;
  insert into comun.usuarios (negocio_id, email, name, password_hash, must_change_password)
  values (v_plat, 'plataforma-' || v_sufijo || '@ejemplo.test', 'Carlos (prueba)', privado.crypt('x', privado.gen_salt('bf', 4)), false)
  returning id, auth_id into v_plataforma, v_auth_plat;

  -- 7. Visitante sin sesión: pedir acceso (correo dictado con punto final) y completar datos.
  execute 'set local role anon';
  perform set_config('request.jwt.claim.sub', '', true);
  v_token := public.solicitar_acceso_autonomialab(' Nuevo-' || v_sufijo || '@Ejemplo.TEST. ');
  v_token2 := public.solicitar_acceso_autonomialab('nuevo-' || v_sufijo || '@ejemplo.test');
  if v_token <> v_token2 then raise exception 'FALLO 7: la segunda petición no reutilizó la solicitud'; end if;
  perform public.completar_solicitud_autonomialab(v_token, 'pyme', 'Hostelería', 'Persona de ejemplo', '600000000', 'Probar');
  begin
    perform public.solicitar_acceso_autonomialab('barra2-' || v_sufijo || '@ejemplo.test');
    raise exception 'FALLO 7: aceptó el correo de una cuenta de negocio';
  exception when raise_exception then
    if sqlerrm like 'FALLO%' then raise; end if;
  end;
  -- Un visitante no puede usar nada más.
  begin
    perform public.yo_autonomialab();
    raise exception 'FALLO 7: anon pudo llamar a yo_autonomialab';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.admin_solicitudes_autonomialab();
    raise exception 'FALLO 7: anon pudo ver solicitudes';
  exception when insufficient_privilege then null;
  end;
  begin
    perform 1 from autonomialab.solicitudes_acceso_autonomialab;
    raise exception 'FALLO 7: anon pudo leer la tabla';
  exception when insufficient_privilege then null;
  end;
  execute 'reset role';
  select email into v_email from autonomialab.solicitudes_acceso_autonomialab where token = v_token;
  if v_email <> 'nuevo-' || v_sufijo || '@ejemplo.test' then raise exception 'FALLO 7: correo mal limpiado: %', v_email; end if;

  -- 8. Cuenta de un negocio (barra) con sesión: no es de la web y no puede administrar.
  execute 'set local role authenticated';
  perform set_config('request.jwt.claim.sub', v_auth_barra::text, true);
  if public.yo_autonomialab() is not null then raise exception 'FALLO 8: la barra aparece como miembro de la web'; end if;
  begin
    perform public.admin_clientes_autonomialab();
    raise exception 'FALLO 8: la barra pudo ver los clientes';
  exception when raise_exception then
    if sqlerrm like 'FALLO%' then raise; end if;
  end;
  begin
    perform 1 from comun.usuarios;
    raise exception 'FALLO 8: authenticated pudo leer comun.usuarios';
  exception when insufficient_privilege then null;
  end;
  begin
    perform 1 from autonomialab.miembros_autonomialab;
    raise exception 'FALLO 8: authenticated pudo leer miembros';
  exception when insufficient_privilege then null;
  end;

  -- 9. Plataforma: ve la solicitud, la aprueba, da acceso de cliente y lo quita.
  perform set_config('request.jwt.claim.sub', v_auth_plat::text, true);
  v_yo := public.yo_autonomialab();
  if v_yo ->> 'tipo' <> 'plataforma' then raise exception 'FALLO 9: la plataforma no se reconoce: %', v_yo; end if;
  if not exists (select 1 from public.admin_solicitudes_autonomialab() s where s.email = v_email and s.tipo = 'pyme') then
    raise exception 'FALLO 9: la solicitud no aparece';
  end if;
  if public.admin_aprobar_acceso_autonomialab((select s.id from public.admin_solicitudes_autonomialab() s where s.email = v_email)) <> v_email then
    raise exception 'FALLO 9: aprobar no devolvió el correo';
  end if;
  select m.auth_id into v_miembro from public.admin_miembros_autonomialab() m where m.email = v_email;
  if v_miembro is null then raise exception 'FALLO 9: el miembro aprobado no aparece'; end if;
  if exists (select 1 from public.admin_clientes_autonomialab() c where c.tipo = 'plataforma') then
    raise exception 'FALLO 9: la lista de clientes incluye la plataforma';
  end if;
  perform public.admin_anadir_persona_autonomialab(v_a, upper(v_email) || '.', 'admin');
  begin
    perform public.admin_anadir_persona_autonomialab(v_b, v_email, 'empleado');
    raise exception 'FALLO 9: una persona quedó en dos negocios';
  exception when raise_exception then
    if sqlerrm like 'FALLO%' then raise; end if;
  end;
  begin
    perform public.admin_anadir_persona_autonomialab(v_a, 'barra2-' || v_sufijo || '@ejemplo.test', 'admin');
    raise exception 'FALLO 9: se dio acceso de web a una cuenta de negocio';
  exception when raise_exception then
    if sqlerrm like 'FALLO%' then raise; end if;
  end;
  v_yo := public.admin_cliente_autonomialab(v_a);
  if jsonb_array_length(v_yo -> 'personas') <> 1 or v_yo -> 'personas' -> 0 ->> 'rol' <> 'admin' then
    raise exception 'FALLO 9: la ficha no muestra a la persona: %', v_yo;
  end if;
  if public.admin_cliente_autonomialab(v_plat) is not null then raise exception 'FALLO 9: se abrió la ficha de la plataforma'; end if;

  -- 10. El miembro ve su negocio y sus productos; el negocio B no aparece.
  perform set_config('request.jwt.claim.sub', v_miembro::text, true);
  v_yo := public.yo_autonomialab();
  if v_yo ->> 'tipo' <> 'miembro' or (v_yo -> 'cliente' ->> 'negocio_id')::int <> v_a
     or v_yo -> 'cliente' -> 'productos' <> '["multibar"]'::jsonb then
    raise exception 'FALLO 10: el miembro no ve su negocio: %', v_yo;
  end if;
  begin
    perform public.admin_cliente_autonomialab(v_b);
    raise exception 'FALLO 10: un miembro pudo abrir una ficha';
  exception when raise_exception then
    if sqlerrm like 'FALLO%' then raise; end if;
  end;

  -- 11. Quitar acceso de cliente: vuelve a cuenta gratuita.
  perform set_config('request.jwt.claim.sub', v_auth_plat::text, true);
  perform public.admin_quitar_persona_autonomialab(v_a, v_miembro);
  perform set_config('request.jwt.claim.sub', v_miembro::text, true);
  if public.yo_autonomialab() -> 'cliente' <> 'null'::jsonb then raise exception 'FALLO 11: sigue como cliente'; end if;
  execute 'reset role';

  -- 12. Un producto no puede crear una cuenta con el correo de un miembro de la web.
  begin
    insert into comun.usuarios (negocio_id, email, name, password_hash) values (v_b, v_email, 'Choque', 'x');
    raise exception 'FALLO 12: se creó una cuenta de negocio con el correo de un miembro';
  exception when raise_exception then
    if sqlerrm <> 'CORREO_EN_USO' then raise; end if;
  end;

  -- 13. Si la cuenta de plataforma se da de baja, deja de ser plataforma.
  update comun.usuarios set active = false where id = v_plataforma;
  execute 'set local role authenticated';
  perform set_config('request.jwt.claim.sub', v_auth_plat::text, true);
  if public.yo_autonomialab() is not null then raise exception 'FALLO 13: una plataforma de baja sigue entrando'; end if;
  execute 'reset role';

  raise exception 'PRUEBAS_OK';
end;
$pruebas$;

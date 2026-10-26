-- Pruebas de datos/cambios/2026-10-25-duenos-en-la-web.sql (aplicado antes). Crean sus propios negocios, cuentas y un
-- producto de mentira («pruebadueno», con su es_dueno_pruebadueno) y al final lanzan 'PRUEBAS_OK', que deshace TODO.
do $pruebas$
declare
  v_s text := substr(md5(random()::text), 1, 8);
  v_a int; v_b int; v_c int;
  v_dueno_a uuid; v_camarero_a uuid; v_dueno_b uuid; v_dueno_c uuid; v_id_dueno_a int;
  v_plat uuid;
  v_yo jsonb; v_f jsonb; v_m jsonb; v_n int; v_ok boolean;
begin
  -- Producto de mentira: es dueña la cuenta cuyo nombre empieza por «Dueño».
  execute $f$create function public.es_dueno_pruebadueno(p_usuario integer) returns boolean language sql stable
    as $c$ select exists (select 1 from comun.usuarios u where u.id = p_usuario and u.name like 'Dueño%') $c$$f$;

  insert into comun.negocios (slug, nombre, tipo) values ('dueno-a-' || v_s, 'Negocio A', 'pruebadueno') returning id into v_a;
  insert into comun.negocios (slug, nombre, tipo) values ('dueno-b-' || v_s, 'Negocio B sin producto', 'pruebadueno') returning id into v_b;
  insert into comun.negocios (slug, nombre, tipo) values ('dueno-c-' || v_s, 'Negocio C sin función', 'pruebasinfuncion') returning id into v_c;
  insert into comun.productos_contratados (negocio_id, producto) values (v_a, 'pruebadueno'), (v_c, 'pruebasinfuncion');
  insert into comun.usuarios (negocio_id, email, name, password_hash)
  values (v_a, 'dueno-a-' || v_s || '@ejemplo.test', 'Dueño A', privado.crypt('clave-1', privado.gen_salt('bf', 4)))
  returning id, auth_id into v_id_dueno_a, v_dueno_a;
  insert into comun.usuarios (negocio_id, email, name, password_hash)
  values (v_a, 'camarero-a-' || v_s || '@ejemplo.test', 'Camarero A', privado.crypt('clave-1', privado.gen_salt('bf', 4)))
  returning auth_id into v_camarero_a;
  insert into comun.usuarios (negocio_id, email, name, password_hash)
  values (v_b, 'dueno-b-' || v_s || '@ejemplo.test', 'Dueño B', privado.crypt('clave-1', privado.gen_salt('bf', 4)))
  returning auth_id into v_dueno_b;
  insert into comun.usuarios (negocio_id, email, name, password_hash)
  values (v_c, 'dueno-c-' || v_s || '@ejemplo.test', 'Dueño C', privado.crypt('clave-1', privado.gen_salt('bf', 4)))
  returning auth_id into v_dueno_c;

  -- 1. Solo el dueño de un negocio activo con producto y con función del producto.
  if privado.dueno_autonomialab(v_dueno_a) is distinct from v_a then raise exception 'FALLO 1: dueño A'; end if;
  if privado.dueno_autonomialab(v_camarero_a) is not null then raise exception 'FALLO 1: camarero A entra'; end if;
  if privado.dueno_autonomialab(v_dueno_b) is not null then raise exception 'FALLO 1: B sin producto entra'; end if;
  if privado.dueno_autonomialab(v_dueno_c) is not null then raise exception 'FALLO 1: C sin función entra'; end if;
  if privado.dueno_autonomialab(gen_random_uuid()) is not null or privado.dueno_autonomialab(null) is not null then
    raise exception 'FALLO 1: cuenta inexistente';
  end if;

  -- 2. yo_autonomialab con la sesión del dueño: miembro automático y cliente de su negocio.
  perform set_config('request.jwt.claims', json_build_object('sub', v_dueno_a, 'role', 'authenticated')::text, true);
  v_yo := public.yo_autonomialab();
  if v_yo->>'tipo' <> 'miembro' or not (v_yo->>'automatico')::boolean or (v_yo->'cliente'->>'negocio_id')::int <> v_a
     or v_yo->'cliente'->>'rol' <> 'admin' or v_yo->'cliente'->'productos' <> '["pruebadueno"]'::jsonb
     or v_yo->>'nombre' <> 'Dueño A' then
    raise exception 'FALLO 2: %', v_yo;
  end if;
  perform set_config('request.jwt.claims', json_build_object('sub', v_camarero_a, 'role', 'authenticated')::text, true);
  if public.yo_autonomialab() is not null then raise exception 'FALLO 2: el camarero entra'; end if;

  -- 3. El correo lo ve como miembro de la web (el botón se queda en la web).
  v_m := public.marca_correo(v_dueno_a);
  if not (v_m->>'miembro_web')::boolean or v_m->>'marca' <> 'negocio' then raise exception 'FALLO 3: %', v_m; end if;
  if (public.marca_correo(v_camarero_a)->>'miembro_web')::boolean then raise exception 'FALLO 3: camarero'; end if;

  -- 4. Pedir acceso con el correo del dueño: ya lo tiene. Con el del camarero: el mensaje de siempre.
  begin
    perform public.solicitar_acceso_autonomialab('Dueno-A-' || v_s || '@ejemplo.test. ');
    raise exception 'FALLO 4: dejó pedir acceso al dueño';
  exception when raise_exception then
    if sqlerrm not like 'Ese correo ya tiene acceso: es el de tu negocio%' then raise exception 'FALLO 4: %', sqlerrm; end if;
  end;
  begin
    perform public.solicitar_acceso_autonomialab('camarero-a-' || v_s || '@ejemplo.test');
    raise exception 'FALLO 4b: dejó pedir acceso al camarero';
  exception when raise_exception then
    if sqlerrm not like 'Ese correo ya se usa en la aplicación de un negocio%' then raise exception 'FALLO 4b: %', sqlerrm; end if;
  end;

  -- 5. Baja del negocio o del producto: pierde el acceso solo.
  update comun.negocios set activo = false where id = v_a;
  if privado.dueno_autonomialab(v_dueno_a) is not null then raise exception 'FALLO 5: negocio de baja'; end if;
  update comun.negocios set activo = true where id = v_a;
  update comun.productos_contratados set activo = false where negocio_id = v_a;
  if privado.dueno_autonomialab(v_dueno_a) is not null then raise exception 'FALLO 5: producto de baja'; end if;
  update comun.productos_contratados set activo = true where negocio_id = v_a;
  update comun.usuarios set active = false where id = v_id_dueno_a;
  if privado.dueno_autonomialab(v_dueno_a) is not null then raise exception 'FALLO 5: cuenta de baja'; end if;
  update comun.usuarios set active = true where id = v_id_dueno_a;

  -- 6. Carlos (plataforma) quita y devuelve el acceso; la ficha lo enseña.
  select u.auth_id into v_plat from comun.usuarios u join comun.negocios n on n.id = u.negocio_id
   where n.tipo = 'plataforma' and u.active limit 1;
  perform set_config('request.jwt.claims', json_build_object('sub', v_plat, 'role', 'authenticated')::text, true);
  v_f := public.admin_cliente_autonomialab(v_a);
  if not (v_f->>'acceso_automatico')::boolean or not (v_f->>'producto_dice_duenos')::boolean
     or jsonb_array_length(v_f->'duenos') <> 1 or v_f->'duenos'->0->>'nombre' <> 'Dueño A'
     or (v_f->'duenos'->0->>'quitado')::boolean then
    raise exception 'FALLO 6: ficha %', v_f;
  end if;
  select count(*) into v_n from public.admin_duenos_web_autonomialab() d where d.auth_id = v_dueno_a;
  if v_n <> 1 then raise exception 'FALLO 6: no sale en la lista de dueños'; end if;
  perform public.admin_acceso_dueno_autonomialab(v_a, v_dueno_a, true);
  if privado.dueno_autonomialab(v_dueno_a) is not null then raise exception 'FALLO 6: quitado y sigue entrando'; end if;
  if not (public.admin_cliente_autonomialab(v_a)->'duenos'->0->>'quitado')::boolean then raise exception 'FALLO 6: no sale quitado'; end if;
  select count(*) into v_n from public.admin_duenos_web_autonomialab() d where d.auth_id = v_dueno_a;
  if v_n <> 0 then raise exception 'FALLO 6: quitado y sale en la lista'; end if;
  perform public.admin_acceso_dueno_autonomialab(v_a, v_dueno_a, false);
  if privado.dueno_autonomialab(v_dueno_a) is distinct from v_a then raise exception 'FALLO 6: devuelto y no entra'; end if;
  begin
    perform public.admin_acceso_dueno_autonomialab(v_b, v_dueno_a, true);
    raise exception 'FALLO 6: quitó el acceso desde otro negocio';
  exception when raise_exception then
    if sqlerrm <> 'Esa cuenta no es de este negocio.' then raise exception 'FALLO 6: %', sqlerrm; end if;
  end;
  if (public.admin_cliente_autonomialab(v_c)->>'producto_dice_duenos')::boolean then raise exception 'FALLO 6: C'; end if;

  -- 7. Un dueño no puede usar las funciones de Carlos.
  perform set_config('request.jwt.claims', json_build_object('sub', v_dueno_a, 'role', 'authenticated')::text, true);
  begin
    perform public.admin_acceso_dueno_autonomialab(v_a, v_camarero_a, false);
    raise exception 'FALLO 7: un dueño usa funciones de plataforma';
  exception when raise_exception then
    if sqlerrm like 'FALLO%' then raise; end if;
  end;

  -- 8. Permisos: la web no llama a las ayudas privadas; los visitantes no llaman a las de Carlos.
  if has_function_privilege('authenticated', 'privado.dueno_autonomialab(uuid)', 'execute')
     or has_function_privilege('authenticated', 'privado.es_dueno_negocio(integer, text)', 'execute')
     or has_function_privilege('anon', 'public.admin_acceso_dueno_autonomialab(integer, uuid, boolean)', 'execute')
     or has_function_privilege('anon', 'public.admin_duenos_web_autonomialab()', 'execute')
     or has_table_privilege('authenticated', 'autonomialab.accesos_dueno_autonomialab', 'select') then
    raise exception 'FALLO 8: permisos';
  end if;

  raise exception 'PRUEBAS_OK';
end
$pruebas$;

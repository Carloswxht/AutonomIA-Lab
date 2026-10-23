-- Pruebas de datos/cambios/2026-10-23-marca-correo.sql. Crean sus propios negocios y cuentas de ejemplo y al final
-- lanzan el error 'PRUEBAS_OK', que deshace TODO (también la función de producto de mentira «marca_correo_pruebacorreo»).
-- Necesitan aplicadas 2026-10-21-cuentas-supabase.sql (cuentas enlazadas) y 2026-10-23-marca-correo.sql.
do $pruebas$
declare
  v_sufijo text := substr(md5(random()::text), 1, 8);
  v_a int; v_b int; v_plat int;
  v_auth_a uuid; v_auth_b uuid; v_auth_plat uuid; v_miembro uuid;
  v_m jsonb;
begin
  insert into comun.negocios (slug, nombre, tipo, logo, correo_legal)
  values ('prueba-a-' || v_sufijo, 'Bar de ejemplo', 'pruebacorreo', 'https://ejemplo.test/logo.png', 'hola@ejemplo.test')
  returning id into v_a;
  insert into comun.negocios (slug, nombre, tipo, logo) values ('prueba-b-' || v_sufijo, 'Gimnasio de ejemplo', 'pruebasinfuncion', 'datos/logo.png')
  returning id into v_b;
  insert into comun.negocios (slug, nombre, tipo) values ('prueba-p-' || v_sufijo, 'Plataforma de prueba', 'plataforma') returning id into v_plat;
  insert into comun.usuarios (negocio_id, email, name, password_hash)
  values (v_a, 'a-' || v_sufijo || '@ejemplo.test', 'Ana', privado.crypt('clave-uno-1', privado.gen_salt('bf', 4))) returning auth_id into v_auth_a;
  insert into comun.usuarios (negocio_id, email, name, password_hash)
  values (v_b, 'b-' || v_sufijo || '@ejemplo.test', 'Bea', privado.crypt('clave-uno-1', privado.gen_salt('bf', 4))) returning auth_id into v_auth_b;
  insert into comun.usuarios (negocio_id, email, name, password_hash)
  values (v_plat, 'p-' || v_sufijo || '@ejemplo.test', 'Plataforma', privado.crypt('clave-uno-1', privado.gen_salt('bf', 4))) returning auth_id into v_auth_plat;
  if v_auth_a is null or v_auth_b is null or v_auth_plat is null then raise exception 'FALLO 0: cuentas sin enlazar'; end if;

  -- 1. Producto sin función propia: nombre, logo solo si es https, correo para responder.
  v_m := public.marca_correo(v_auth_b);
  if v_m->>'marca' <> 'negocio' or v_m->>'nombre' <> 'Gimnasio de ejemplo' or v_m->>'persona' <> 'Bea'
     or v_m->>'producto' <> 'pruebasinfuncion' or v_m ? 'logo' or v_m ? 'fondo' then
    raise exception 'FALLO 1: %', v_m;
  end if;

  -- 2. Producto con función propia: sus colores mandan; lo que no da, se queda de comun.negocios.
  execute $f$create function public.marca_correo_pruebacorreo(p_negocio integer) returns jsonb language sql
    as $c$ select jsonb_build_object('fondo', '#FFFFFF', 'acento', '#D9722A', 'texto', null, 'otra', 'x') $c$$f$;
  v_m := public.marca_correo(v_auth_a);
  if v_m->>'nombre' <> 'Bar de ejemplo' or v_m->>'logo' <> 'https://ejemplo.test/logo.png' or v_m->>'fondo' <> '#FFFFFF'
     or v_m->>'acento' <> '#D9722A' or v_m->>'responder_a' <> 'hola@ejemplo.test' or v_m ? 'texto' or v_m ? 'otra' then
    raise exception 'FALLO 2: %', v_m;
  end if;

  -- 3. Si la función del producto falla, el correo sale igual (sin sus colores).
  execute $f$create or replace function public.marca_correo_pruebacorreo(p_negocio integer) returns jsonb language sql
    as $c$ select (1/0)::text::jsonb $c$$f$;
  v_m := public.marca_correo(v_auth_a);
  if v_m->>'nombre' <> 'Bar de ejemplo' or v_m ? 'fondo' then raise exception 'FALLO 3: %', v_m; end if;

  -- 4. Cuenta de plataforma y miembro de la web: imagen de autonomIA Lab.
  v_m := public.marca_correo(v_auth_plat);
  if v_m->>'marca' <> 'autonomialab' or v_m ? 'nombre' then raise exception 'FALLO 4: %', v_m; end if;
  select m.auth_id into v_miembro from autonomialab.miembros_autonomialab m limit 1;
  if v_miembro is not null then
    v_m := public.marca_correo(v_miembro);
    if v_m->>'marca' <> 'autonomialab' then raise exception 'FALLO 4b: %', v_m; end if;
  end if;
  v_m := public.marca_correo(gen_random_uuid());
  if v_m->>'marca' <> 'autonomialab' then raise exception 'FALLO 4c: %', v_m; end if;

  -- 5. La web no puede llamarla (solo la Edge Function).
  if has_function_privilege('anon', 'public.marca_correo(uuid)', 'execute')
     or has_function_privilege('authenticated', 'public.marca_correo(uuid)', 'execute')
     or not has_function_privilege('service_role', 'public.marca_correo(uuid)', 'execute') then
    raise exception 'FALLO 5: permisos';
  end if;

  raise exception 'PRUEBAS_OK';
end
$pruebas$;

import "server-only";
import { cache } from "react";
import { exigirSesion } from "@/lib/sesion";

export type Espacio = { id: string; nombre: string; modulos: string[]; rol: string };

/**
 * Datos del miembro con sesión: perfil, sus espacios (empresas cliente) y si tiene acceso total.
 * Acceso total = superadmin o miembro de algún espacio activo.
 */
export const datosMiembro = cache(async () => {
  const { supabase, user } = await exigirSesion();
  const [{ data: perfil }, { data: membresias }] = await Promise.all([
    supabase.from("perfiles").select("nombre, es_superadmin").eq("id", user.id).maybeSingle(),
    supabase
      .from("miembros")
      .select("rol, organizaciones(id, nombre, nombre_app, estado, organizacion_modulos(modulo, activo))")
      .eq("usuario_id", user.id),
  ]);

  type Fila = {
    rol: string;
    organizaciones: {
      id: string;
      nombre: string;
      nombre_app: string | null;
      estado: string;
      organizacion_modulos: { modulo: string; activo: boolean }[];
    } | null;
  };
  const espacios: Espacio[] = ((membresias ?? []) as unknown as Fila[])
    .filter((m) => m.organizaciones?.estado === "activa") // el superadmin ve también las suspendidas por RLS
    .map((m) => ({
      id: m.organizaciones!.id,
      nombre: m.organizaciones!.nombre_app || m.organizaciones!.nombre,
      modulos: m.organizaciones!.organizacion_modulos.filter((x) => x.activo).map((x) => x.modulo),
      rol: m.rol,
    }));

  const superadmin = Boolean(perfil?.es_superadmin);
  return {
    supabase,
    user,
    nombre: perfil?.nombre ?? null,
    superadmin,
    espacios,
    accesoTotal: superadmin || espacios.length > 0,
  };
});

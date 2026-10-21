import "server-only";
import { cache } from "react";
import { producto, type Producto } from "@/lib/productos";
import { exigirSesion } from "@/lib/sesion";

/**
 * Datos del miembro con sesión: su nombre, sus aplicaciones y si tiene acceso total.
 * Acceso total = cuenta de plataforma (Carlos) o cliente de un negocio activo.
 */
export const datosMiembro = cache(async () => {
  const { supabase, user, yo } = await exigirSesion();
  const plataforma = yo.tipo === "plataforma";
  const aplicaciones: Producto[] = (yo.cliente?.productos ?? []).map(producto);
  return {
    supabase,
    user,
    nombre: yo.nombre,
    superadmin: plataforma,
    negocio: yo.cliente?.nombre ?? null,
    aplicaciones,
    accesoTotal: plataforma || yo.cliente !== null,
  };
});

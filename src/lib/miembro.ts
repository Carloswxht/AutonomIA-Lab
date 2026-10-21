import { producto, type Producto } from "@/lib/productos";
import type { Yo } from "@/lib/sesion";

/**
 * Lo que ve el miembro con sesión: su nombre, sus aplicaciones y si tiene acceso total.
 * Acceso total = cuenta de plataforma (Carlos) o cliente de un negocio activo.
 */
export function resumenMiembro(yo: Yo) {
  const plataforma = yo.tipo === "plataforma";
  const aplicaciones: Producto[] = (yo.cliente?.productos ?? []).map(producto);
  return {
    nombre: yo.nombre,
    email: yo.email,
    superadmin: plataforma,
    negocio: yo.cliente?.nombre ?? null,
    aplicaciones,
    accesoTotal: plataforma || yo.cliente !== null,
  };
}

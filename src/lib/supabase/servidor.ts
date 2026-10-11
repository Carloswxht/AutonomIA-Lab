import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente de Supabase para el servidor (páginas y acciones). El navegador nunca habla con Supabase:
 * la sesión vive en cookies de nuestro dominio. Crear uno nuevo en cada petición.
 */
export async function crearClienteServidor() {
  const almacen = await cookies();
  return createServerClient(variable("SUPABASE_URL"), variable("SUPABASE_PUBLISHABLE_KEY"), {
    cookies: {
      getAll() {
        return almacen.getAll();
      },
      setAll(aGuardar) {
        try {
          aGuardar.forEach(({ name, value, options }) => almacen.set(name, value, options));
        } catch {
          // Desde una página (no acción) no se pueden escribir cookies; el proxy ya refresca la sesión.
        }
      },
    },
  });
}

export function variable(nombre: "SUPABASE_URL" | "SUPABASE_PUBLISHABLE_KEY"): string {
  const valor = process.env[nombre];
  if (!valor) throw new Error(`Falta la variable de entorno ${nombre}`);
  return valor;
}

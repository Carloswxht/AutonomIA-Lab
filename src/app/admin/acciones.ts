"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { EstadoFormulario } from "@/app/acciones";
import { exigirSuperadmin } from "@/lib/sesion";
import { colorValido } from "@/lib/color";

const texto = (f: FormData, campo: string) => String(f.get(campo) ?? "").trim();
const FALLO = "No se ha podido guardar. Inténtalo de nuevo.";

/** Los errores que lanzan nuestras funciones de la base (P0001) ya vienen escritos para Carlos. */
function mensaje(error: { code?: string; message: string }) {
  return error.code === "P0001" ? error.message : FALLO;
}

/** Alguien ha comprado una aplicación: se crea su espacio ligado a su correo. */
export async function nuevoCliente(_p: EstadoFormulario, f: FormData): Promise<EstadoFormulario> {
  const { supabase } = await exigirSuperadmin();
  const email = texto(f, "email").toLowerCase();
  if (!email) return { error: "Escribe el correo con el que se registró el cliente." };
  const nombre = texto(f, "nombre");
  if (nombre.length > 120) return { error: "El nombre es demasiado largo." };

  const { data, error } = await supabase.rpc("admin_nuevo_cliente", { p_email: email, p_nombre: nombre || null });
  if (error) return { error: mensaje(error) };
  revalidatePath("/admin");
  redirect(`/admin/empresas/${data}`);
}

export async function guardarMarca(_p: EstadoFormulario, f: FormData): Promise<EstadoFormulario> {
  const { supabase } = await exigirSuperadmin();
  const id = texto(f, "empresa");
  let cambios;
  try {
    cambios = {
      nombre: texto(f, "nombre"),
      nombre_app: texto(f, "nombre_app") || null,
      logo_url: texto(f, "logo_url") || null,
      color_primario: colorValido(texto(f, "color_primario")),
      color_acento: colorValido(texto(f, "color_acento")),
      estado: texto(f, "estado") === "suspendida" ? "suspendida" : "activa",
    };
  } catch (e) {
    return { error: (e as Error).message };
  }
  if (!cambios.nombre) return { error: "El cliente necesita un nombre." };
  if (cambios.logo_url && !/^https:\/\//.test(cambios.logo_url))
    return { error: "El logo tiene que ser una dirección que empiece por https://" };

  const { error } = await supabase.from("organizaciones").update(cambios).eq("id", id);
  if (error) return { error: mensaje(error) };
  revalidatePath(`/admin/empresas/${id}`);
  revalidatePath("/admin");
  return { ok: true };
}

export async function cambiarModulo(_p: EstadoFormulario, f: FormData): Promise<EstadoFormulario> {
  const { supabase } = await exigirSuperadmin();
  const empresa = texto(f, "empresa");
  const { error } = await supabase
    .from("organizacion_modulos")
    .upsert(
      { organizacion_id: empresa, modulo: texto(f, "modulo"), activo: texto(f, "activo") === "si" },
      { onConflict: "organizacion_id,modulo" },
    );
  if (error) return { error: mensaje(error) };
  revalidatePath(`/admin/empresas/${empresa}`);
  return { ok: true };
}

export async function anadirMiembro(_p: EstadoFormulario, f: FormData): Promise<EstadoFormulario> {
  const { supabase } = await exigirSuperadmin();
  const empresa = texto(f, "empresa");
  const email = texto(f, "email").toLowerCase();
  const rol = texto(f, "rol") === "admin" ? "admin" : "empleado";
  if (!email) return { error: "Escribe el correo de la persona." };

  const { error } = await supabase.rpc("admin_anadir_miembro", { p_org: empresa, p_email: email, p_rol: rol });
  if (error) return { error: mensaje(error) };
  revalidatePath(`/admin/empresas/${empresa}`);
  return { ok: true };
}

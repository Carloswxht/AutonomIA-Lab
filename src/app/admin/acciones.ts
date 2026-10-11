"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { EstadoFormulario } from "@/app/acciones";
import { exigirSuperadmin } from "@/lib/sesion";
import { colorValido, crearSlug } from "@/lib/slug";

const texto = (f: FormData, campo: string) => String(f.get(campo) ?? "").trim();
const FALLO = "No se ha podido guardar. Inténtalo de nuevo.";

/** Los errores que lanzan nuestras funciones de la base (P0001) ya vienen escritos para Carlos. */
function mensaje(error: { code?: string; message: string }) {
  if (error.code === "P0001") return error.message;
  if (error.code === "23505") return "Ya existe una empresa con esa dirección corta. Cambia el nombre.";
  return FALLO;
}

export async function aprobarSolicitud(_p: EstadoFormulario, f: FormData): Promise<EstadoFormulario> {
  const { supabase } = await exigirSuperadmin();
  const nombre = texto(f, "empresa");
  const slug = crearSlug(nombre);
  if (!nombre || !slug) return { error: "Escribe el nombre de la empresa." };

  const { data, error } = await supabase.rpc("admin_aprobar_solicitud", {
    p_solicitud: texto(f, "solicitud"),
    p_nombre: nombre,
    p_slug: slug,
  });
  if (error) return { error: mensaje(error) };
  revalidatePath("/admin");
  redirect(`/admin/empresas/${data}`);
}

export async function rechazarSolicitud(_p: EstadoFormulario, f: FormData): Promise<EstadoFormulario> {
  const { supabase } = await exigirSuperadmin();
  const { error } = await supabase
    .from("solicitudes_cuenta")
    .update({ estado: "rechazada" })
    .eq("id", texto(f, "solicitud"))
    .eq("estado", "pendiente");
  if (error) return { error: mensaje(error) };
  revalidatePath("/admin");
  return { ok: true };
}

export async function crearEmpresa(_p: EstadoFormulario, f: FormData): Promise<EstadoFormulario> {
  const { supabase } = await exigirSuperadmin();
  const nombre = texto(f, "nombre");
  const slug = crearSlug(nombre);
  if (!nombre || !slug) return { error: "Escribe el nombre de la empresa." };
  if (nombre.length > 120) return { error: "El nombre es demasiado largo." };

  const { data, error } = await supabase.from("organizaciones").insert({ nombre, slug }).select("id").single();
  if (error) return { error: mensaje(error) };
  revalidatePath("/admin");
  redirect(`/admin/empresas/${data.id}`);
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
  if (!cambios.nombre) return { error: "La empresa necesita un nombre." };
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
  const modulo = texto(f, "modulo");
  const activo = texto(f, "activo") === "si";

  const { error } = await supabase
    .from("organizacion_modulos")
    .upsert({ organizacion_id: empresa, modulo, activo }, { onConflict: "organizacion_id,modulo" });
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

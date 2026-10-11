"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { EstadoFormulario } from "@/app/acciones";
import { exigirSuperadmin } from "@/lib/sesion";
import { colorValido } from "@/lib/color";
import { variable } from "@/lib/supabase/servidor";

const texto = (f: FormData, campo: string) => String(f.get(campo) ?? "").trim();
const FALLO = "No se ha podido guardar. Inténtalo de nuevo.";

/** Los errores que lanzan nuestras funciones de la base (P0001) ya vienen escritos para Carlos. */
function mensaje(error: { code?: string; message: string }) {
  return error.code === "P0001" ? error.message : FALLO;
}

/**
 * Aprobar una solicitud: crea el usuario y le envía un correo con un enlace para entrar y crear su contraseña
 * (plantilla «Magic link» de Supabase, ver src/app/auth/confirmar/route.ts). Se envía con un cliente sin cookies
 * para no mezclar nada con la sesión de Carlos.
 */
export async function aprobarAcceso(_p: EstadoFormulario, f: FormData): Promise<EstadoFormulario> {
  const { supabase } = await exigirSuperadmin();
  const { data: email, error } = await supabase.rpc("admin_aprobar_acceso", { p_solicitud: texto(f, "solicitud") });
  if (error) return { error: mensaje(error) };

  const h = await headers();
  const origen = h.get("origin") ?? `https://${h.get("host")}`;
  const envio = createClient(variable("SUPABASE_URL"), variable("SUPABASE_PUBLISHABLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false, flowType: "implicit" },
  });
  const { error: errorCorreo } = await envio.auth.signInWithOtp({
    email: email as string,
    options: { shouldCreateUser: false, emailRedirectTo: `${origen}/auth/confirmar` },
  });
  // Si el correo falla no se refresca la lista, para que el aviso se vea (la solicitud ya está aprobada).
  if (errorCorreo)
    return { error: "Acceso aprobado, pero el correo no ha salido (falta configurar el envío de correos). Avísale por WhatsApp." };
  revalidatePath("/admin");
  return { ok: true };
}

export async function rechazarAcceso(_p: EstadoFormulario, f: FormData): Promise<EstadoFormulario> {
  const { supabase } = await exigirSuperadmin();
  const { error } = await supabase
    .from("solicitudes_acceso")
    .update({ estado: "rechazada" })
    .eq("id", texto(f, "solicitud"))
    .eq("estado", "pendiente");
  if (error) return { error: mensaje(error) };
  revalidatePath("/admin");
  return { ok: true };
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

import type { EstadoFormulario } from "@/app/acciones";
import { limpiarCorreo } from "@/lib/registro";
import { supabase, supabaseSinSesion } from "@/lib/supabase/cliente";

// Acciones del panel de administración. Corren en el navegador; cada función de la base comprueba que quien llama
// es la cuenta de plataforma (si no, «No tienes permiso para esto.»).

const texto = (f: FormData, campo: string) => String(f.get(campo) ?? "").trim();
const FALLO = "No se ha podido guardar. Inténtalo de nuevo.";

/** Los errores que lanzan nuestras funciones de la base (P0001) ya vienen escritos para Carlos. */
function mensaje(error: { code?: string; message: string }) {
  return error.code === "P0001" ? error.message : FALLO;
}

/** Número de negocio de un formulario (los negocios de comun.negocios tienen id entero). */
function negocio(f: FormData) {
  const id = Number(texto(f, "negocio"));
  return Number.isInteger(id) && id > 0 ? id : null;
}

/**
 * Aprobar una solicitud: crea su cuenta y le envía un correo con un enlace para entrar y crear su contraseña
 * (plantilla «Magic link» de Supabase, ver src/app/auth/confirmar/Confirmar.tsx). Se envía con un cliente sin sesión
 * para no mezclar nada con la sesión de Carlos.
 */
export async function aprobarAcceso(_p: EstadoFormulario, f: FormData): Promise<EstadoFormulario> {
  const { data: email, error } = await supabase().rpc("admin_aprobar_acceso_autonomialab", {
    p_solicitud: texto(f, "solicitud"),
  });
  if (error) return { error: mensaje(error) };

  const { error: errorCorreo } = await supabaseSinSesion().auth.signInWithOtp({
    email: email as string,
    options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/auth/confirmar/` },
  });
  // Si el correo falla no se refresca la lista, para que el aviso se vea (la solicitud ya está aprobada).
  if (errorCorreo)
    return { error: "Acceso aprobado, pero el correo no ha salido (falta configurar el envío de correos). Avísale por WhatsApp." };
  return { ok: true };
}

export async function rechazarAcceso(_p: EstadoFormulario, f: FormData): Promise<EstadoFormulario> {
  const { error } = await supabase().rpc("admin_rechazar_acceso_autonomialab", { p_solicitud: texto(f, "solicitud") });
  if (error) return { error: mensaje(error) };
  return { ok: true };
}

/** Dar acceso de cliente a un miembro de la web: ve «Tus aplicaciones» de ese negocio y tiene acceso completo. */
export async function anadirPersona(_p: EstadoFormulario, f: FormData): Promise<EstadoFormulario> {
  const id = negocio(f);
  const email = limpiarCorreo(texto(f, "email"));
  const rol = texto(f, "rol") === "admin" ? "admin" : "empleado";
  if (!id) return { error: FALLO };
  if (!email) return { error: "Escribe el correo de la persona." };

  const { error } = await supabase().rpc("admin_anadir_persona_autonomialab", { p_negocio: id, p_email: email, p_rol: rol });
  if (error) return { error: mensaje(error) };
  return { ok: true };
}

export async function quitarPersona(_p: EstadoFormulario, f: FormData): Promise<EstadoFormulario> {
  const id = negocio(f);
  if (!id) return { error: FALLO };
  const { error } = await supabase().rpc("admin_quitar_persona_autonomialab", { p_negocio: id, p_auth: texto(f, "persona") });
  if (error) return { error: mensaje(error) };
  return { ok: true };
}

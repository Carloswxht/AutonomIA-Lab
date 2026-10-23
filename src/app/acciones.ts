/* eslint-disable @next/next/no-location-assign-relative-destination -- tras entrar o salir se carga la página entera, para que cada página vuelva a comprobar la sesión desde cero. */
import { limpiarCorreo, mensajeErrorAuth, validarContrasenas, validarCorreo } from "@/lib/registro";
import { consultarYo } from "@/lib/sesion";
import { supabase } from "@/lib/supabase/cliente";

// Acciones de los formularios. Corren en el navegador (la web es de páginas fijas) y hablan con Supabase con la
// clave publicable; cada función de la base comprueba quién llama.

export type EstadoFormulario = { error?: string; ok?: boolean; email?: string };

/** Los errores que lanzan nuestras funciones de la base (P0001) ya vienen escritos para el usuario. */
const errorBase = (error: { code?: string; message: string }, porDefecto: string) =>
  error.code === "P0001" ? error.message : porDefecto;

export async function entrar(_previo: EstadoFormulario, f: FormData): Promise<EstadoFormulario> {
  const email = limpiarCorreo(String(f.get("email") ?? ""));
  const password = String(f.get("password") ?? "");
  if (!email || !password) return { error: "Escribe tu correo y tu contraseña." };

  try {
    const { error } = await supabase().auth.signInWithPassword({ email, password });
    if (error) return { error: mensajeErrorAuth(error.code) };
    // Las cuentas del personal de un negocio (bar, gimnasio…) son de la app de su negocio, no de esta web.
    if (!(await consultarYo())) {
      await supabase().auth.signOut({ scope: "local" });
      return { error: "Esta cuenta es de la aplicación de tu negocio. Entra desde allí." };
    }
  } catch {
    return { error: mensajeErrorAuth(undefined) };
  }
  window.location.assign("/miembros/");
  return { ok: true };
}

export async function salir() {
  try {
    await supabase().auth.signOut({ scope: "local" });
  } finally {
    window.location.assign("/");
  }
}

export async function solicitarAcceso(_previo: EstadoFormulario, f: FormData): Promise<EstadoFormulario> {
  const email = limpiarCorreo(String(f.get("email") ?? ""));
  const v = validarCorreo(f);
  if (!v.ok) return { error: v.error, email };

  try {
    const { data, error } = await supabase().rpc("solicitar_acceso_autonomialab", { p_email: v.datos.email });
    if (error) return { error: errorBase(error, mensajeErrorAuth(undefined)), email };
    window.location.assign(`/solicitud/?t=${encodeURIComponent(String(data))}`);
    return { ok: true, email };
  } catch {
    return { error: mensajeErrorAuth(undefined), email };
  }
}

export async function completarSolicitud(_previo: EstadoFormulario, f: FormData): Promise<EstadoFormulario> {
  const campo = (c: string, max: number) => String(f.get(c) ?? "").trim().slice(0, max);
  const fallo = "No se ha podido guardar. Inténtalo de nuevo.";
  try {
    const { error } = await supabase().rpc("completar_solicitud_autonomialab", {
      p_token: campo("token", 36),
      p_tipo: campo("tipo", 20),
      p_sector: campo("sector", 60),
      p_nombre: campo("nombre", 120),
      p_telefono: campo("telefono", 30),
      p_mensaje: campo("mensaje", 1000),
    });
    if (error) return { error: errorBase(error, fallo) };
  } catch {
    return { error: fallo };
  }
  return { ok: true };
}

export async function recuperarContrasena(_previo: EstadoFormulario, f: FormData): Promise<EstadoFormulario> {
  const v = validarCorreo(f);
  if (!v.ok) return { error: v.error, email: limpiarCorreo(String(f.get("email") ?? "")) };

  try {
    const { error } = await supabase().auth.resetPasswordForEmail(v.datos.email, {
      // Sin «?»: la plantilla «Reset Password» añade «?token_hash=…» a esta dirección (ver supabase/plantillas/_base.py).
      redirectTo: `${window.location.origin}/auth/confirmar/`,
    });
    if (error && (error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit"))
      return { error: mensajeErrorAuth(error.code) };
  } catch {
    return { error: mensajeErrorAuth(undefined) };
  }
  return { ok: true, email: v.datos.email };
}

export async function cambiarContrasena(_previo: EstadoFormulario, f: FormData): Promise<EstadoFormulario> {
  const v = validarContrasenas(f);
  if (!v.ok) return { error: v.error };

  try {
    const { data } = await supabase().auth.getSession();
    if (!data.session) return { error: "El enlace ha caducado. Pide otro desde «¿Olvidaste tu contraseña?»." };
    const { error } = await supabase().auth.updateUser({ password: v.datos.password });
    if (error) return { error: mensajeErrorAuth(error.code) };
  } catch {
    return { error: mensajeErrorAuth(undefined) };
  }
  window.location.assign("/miembros/");
  return { ok: true };
}

"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { mensajeErrorAuth, validarContrasenas, validarCorreo } from "@/lib/registro";

export type EstadoFormulario = { error?: string; ok?: boolean; email?: string };

/** Dirección de nuestra web para los enlaces de los correos (confirmar cuenta, cambiar contraseña). */
async function origen() {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const protocolo = h.get("x-forwarded-proto") ?? "https";
  return `${protocolo}://${h.get("host")}`;
}

export async function entrar(_previo: EstadoFormulario, f: FormData): Promise<EstadoFormulario> {
  const email = String(f.get("email") ?? "").trim().toLowerCase();
  const password = String(f.get("password") ?? "");
  if (!email || !password) return { error: "Escribe tu correo y tu contraseña." };

  try {
    const supabase = await crearClienteServidor();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: mensajeErrorAuth(error.code) };
  } catch {
    return { error: mensajeErrorAuth(undefined) };
  }
  redirect("/miembros");
}

export async function salir() {
  try {
    const supabase = await crearClienteServidor();
    await supabase.auth.signOut();
  } finally {
    redirect("/");
  }
}

export async function solicitarAcceso(_previo: EstadoFormulario, f: FormData): Promise<EstadoFormulario> {
  const email = String(f.get("email") ?? "").trim();
  const v = validarCorreo(f);
  if (!v.ok) return { error: v.error, email };

  let token: string | null = null;
  try {
    const supabase = await crearClienteServidor();
    const { data, error } = await supabase.rpc("solicitar_acceso", { p_email: v.datos.email });
    // Los mensajes de la base (P0001) ya vienen escritos para el usuario.
    if (error) return { error: error.code === "P0001" ? error.message : mensajeErrorAuth(undefined), email };
    token = data as string;
  } catch {
    return { error: mensajeErrorAuth(undefined), email };
  }
  redirect(`/solicitud/${token}`);
}

export async function completarSolicitud(_previo: EstadoFormulario, f: FormData): Promise<EstadoFormulario> {
  const campo = (c: string, max: number) => String(f.get(c) ?? "").trim().slice(0, max);
  try {
    const supabase = await crearClienteServidor();
    const { error } = await supabase.rpc("completar_solicitud", {
      p_token: campo("token", 36),
      p_tipo: campo("tipo", 20),
      p_sector: campo("sector", 60),
      p_nombre: campo("nombre", 120),
      p_telefono: campo("telefono", 30),
      p_mensaje: campo("mensaje", 1000),
    });
    if (error) return { error: error.code === "P0001" ? error.message : "No se ha podido guardar. Inténtalo de nuevo." };
  } catch {
    return { error: "No se ha podido guardar. Inténtalo de nuevo." };
  }
  return { ok: true };
}

export async function recuperarContrasena(_previo: EstadoFormulario, f: FormData): Promise<EstadoFormulario> {
  const v = validarCorreo(f);
  if (!v.ok) return { error: v.error, email: String(f.get("email") ?? "").trim() };

  try {
    const supabase = await crearClienteServidor();
    const { error } = await supabase.auth.resetPasswordForEmail(v.datos.email, {
      redirectTo: `${await origen()}/auth/confirmar?siguiente=/nueva-contrasena`,
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
    const supabase = await crearClienteServidor();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return { error: "El enlace ha caducado. Pide otro desde «¿Olvidaste tu contraseña?»." };
    const { error } = await supabase.auth.updateUser({ password: v.datos.password });
    if (error) return { error: mensajeErrorAuth(error.code) };
  } catch {
    return { error: mensajeErrorAuth(undefined) };
  }
  redirect("/miembros");
}

"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { mensajeErrorAuth, validarContrasenas, validarCorreo, validarRegistro } from "@/lib/registro";

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

export async function crearCuenta(_previo: EstadoFormulario, f: FormData): Promise<EstadoFormulario> {
  const email = String(f.get("email") ?? "").trim();
  const v = validarRegistro(f);
  if (!v.ok) return { error: v.error, email };

  try {
    const supabase = await crearClienteServidor();
    const { error } = await supabase.auth.signUp({
      email: v.datos.email,
      password: v.datos.password,
      options: { emailRedirectTo: `${await origen()}/auth/confirmar` },
    });
    if (error?.code === "over_email_send_rate_limit")
      return { error: "Ahora mismo no podemos enviar el correo de confirmación. Inténtalo más tarde.", email };
    if (error) return { error: mensajeErrorAuth(error.code), email };
  } catch {
    return { error: mensajeErrorAuth(undefined), email };
  }
  // Por seguridad Supabase responde igual si el correo ya tenía cuenta: el mensaje no lo desvela.
  return { ok: true, email: v.datos.email };
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

"use server";

import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { mensajeErrorEntrar, validarSolicitud } from "@/lib/solicitud";

export type EstadoFormulario = { error?: string; ok?: boolean };

export async function entrar(_previo: EstadoFormulario, f: FormData): Promise<EstadoFormulario> {
  const email = String(f.get("email") ?? "").trim().toLowerCase();
  const password = String(f.get("password") ?? "");
  if (!email || !password) return { error: "Escribe tu correo y tu contraseña." };

  try {
    const supabase = await crearClienteServidor();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: mensajeErrorEntrar(error.code) };
  } catch {
    return { error: mensajeErrorEntrar(undefined) };
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

export async function solicitarCuenta(_previo: EstadoFormulario, f: FormData): Promise<EstadoFormulario> {
  const v = validarSolicitud(f);
  if (!v.ok) return { error: v.error };

  try {
    const supabase = await crearClienteServidor();
    const { error } = await supabase.rpc("solicitar_cuenta", {
      p_nombre: v.datos.nombre,
      p_email: v.datos.email,
      p_empresa: v.datos.empresa,
      p_telefono: v.datos.telefono,
      p_mensaje: v.datos.mensaje,
    });
    // Los mensajes de la base (anti-spam) ya están escritos para el usuario.
    if (error) return { error: error.code === "P0001" ? error.message : "No se ha podido enviar. Inténtalo de nuevo." };
  } catch {
    return { error: "No se ha podido enviar. Inténtalo de nuevo en un momento." };
  }
  return { ok: true };
}

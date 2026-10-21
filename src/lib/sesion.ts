import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/servidor";

export type Cliente = { negocio_id: number; nombre: string; tipo: string; rol: string; productos: string[] };
/** Quién es en la web, según la base (`yo_autonomialab`). null = no tiene acceso (p. ej. cuenta de un negocio). */
export type Yo = { tipo: "plataforma" | "miembro"; nombre: string | null; email: string; cliente: Cliente | null };

/** Pregunta a la base quién es el usuario con sesión. */
export async function consultarYo(supabase: Awaited<ReturnType<typeof crearClienteServidor>>): Promise<Yo | null> {
  const { data, error } = await supabase.rpc("yo_autonomialab");
  if (error) throw new Error(error.message);
  return (data as Yo | null) ?? null;
}

/** Cliente de Supabase con la sesión del usuario y quién es; sin sesión o sin acceso a la web, a la portada. */
export const exigirSesion = cache(async () => {
  const supabase = await crearClienteServidor().catch(() => null);
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!supabase || !user) redirect("/");
  const yo = await consultarYo(supabase).catch(() => null);
  if (!yo) redirect("/");
  return { supabase, user, yo };
});

/** Igual que exigirSesion, pero solo para la cuenta de plataforma (Carlos). Cada función de la base lo vuelve a comprobar. */
export async function exigirPlataforma() {
  const sesion = await exigirSesion();
  if (sesion.yo.tipo !== "plataforma") redirect("/miembros");
  return sesion;
}

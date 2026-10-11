import "server-only";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/servidor";

/** Cliente de Supabase con la sesión del usuario; si no hay sesión, a la portada. */
export async function exigirSesion() {
  const supabase = await crearClienteServidor().catch(() => null);
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!supabase || !user) redirect("/");
  return { supabase, user };
}

/** Igual que exigirSesion, pero solo para Carlos (superadmin). La base lo vuelve a comprobar con RLS. */
export async function exigirSuperadmin() {
  const { supabase, user } = await exigirSesion();
  const { data } = await supabase.from("perfiles").select("es_superadmin").eq("id", user.id).maybeSingle();
  if (!data?.es_superadmin) redirect("/miembros");
  return { supabase, user };
}

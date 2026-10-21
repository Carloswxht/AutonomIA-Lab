import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Conexión con la base única `autonomialab-db`. La web es de páginas fijas (GitHub Pages): el móvil habla
 * directamente con Supabase con la clave publicable, que es pública por diseño. La seguridad la ponen las funciones
 * de la base (cada una comprueba quién llama). Nunca poner aquí la service_role.
 * Para volver a un servidor propio (Hetzner) delante de Supabase, ver docs/publicar.md.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://dorunbacwnkwdatfscri.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_PK12CcvGBEZsFT9lsLpSIA_IsP-v8iS";

let cliente: SupabaseClient | null = null;

/** Cliente con la sesión del usuario (guardada en este navegador). */
export function supabase(): SupabaseClient {
  cliente ??= createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: "autonomialab.sesion" },
  });
  return cliente;
}

/** Cliente sin sesión ni memoria: para mandar correos (acceso aprobado) sin tocar la sesión de quien lo manda. */
export function supabaseSinSesion(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: "autonomialab.envio" },
  });
}

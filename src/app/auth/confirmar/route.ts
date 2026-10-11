import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { rutaSegura } from "@/lib/registro";
import { crearClienteServidor } from "@/lib/supabase/servidor";

// Destino de los enlaces de los correos. Las plantillas de Supabase (Authentication → Emails) apuntan aquí con
// token_hash, así el enlace funciona aunque se abra en otro navegador:
//   Magic link (acceso aprobado):  {{ .SiteURL }}/auth/confirmar?token_hash={{ .TokenHash }}&type=magiclink
//   Reset password:                {{ .SiteURL }}/auth/confirmar?token_hash={{ .TokenHash }}&type=recovery
// También acepta ?code= (enlaces por defecto de Supabase, solo si se abren en el mismo navegador).
const TRAS_TIPO: Partial<Record<EmailOtpType, string>> = {
  magiclink: "/nueva-contrasena",
  recovery: "/nueva-contrasena",
};

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const tipo = searchParams.get("type") as EmailOtpType | null;
  const siguiente = rutaSegura(searchParams.get("siguiente") ?? (tipo ? TRAS_TIPO[tipo] : null));

  if (searchParams.get("error_code") || searchParams.get("error")) {
    return NextResponse.redirect(new URL("/confirmado?motivo=caducado", request.url));
  }

  try {
    const supabase = await crearClienteServidor();
    const { error } = tokenHash && tipo
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type: tipo })
      : code
        ? await supabase.auth.exchangeCodeForSession(code)
        : { error: new Error("Sin código") };
    if (!error) return NextResponse.redirect(new URL(siguiente, request.url));
  } catch {
    // Se explica abajo.
  }

  const aviso = siguiente === "/nueva-contrasena" ? "?motivo=contrasena" : "";
  return NextResponse.redirect(new URL(`/confirmado${aviso}`, request.url));
}

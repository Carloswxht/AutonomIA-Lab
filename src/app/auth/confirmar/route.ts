import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { rutaSegura } from "@/lib/registro";
import { crearClienteServidor } from "@/lib/supabase/servidor";

// Destino de los enlaces de los correos (confirmar cuenta, cambiar contraseña).
// Supabase ya ha marcado el correo como confirmado antes de llegar aquí; esto solo abre la sesión.
// Si no se puede (enlace abierto en otro navegador o caducado), se explica en /confirmado.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const siguiente = rutaSegura(searchParams.get("siguiente"));
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const tipo = searchParams.get("type") as EmailOtpType | null;
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

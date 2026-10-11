import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Refresca la sesión de Supabase en cada petición y la guarda en cookies de nuestro dominio.
export async function proxy(request: NextRequest) {
  const url = process.env.SUPABASE_URL;
  const clave = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !clave) return NextResponse.next({ request });

  let respuesta = NextResponse.next({ request });
  const supabase = createServerClient(url, clave, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(aGuardar, cabeceras) {
        aGuardar.forEach(({ name, value }) => request.cookies.set(name, value));
        respuesta = NextResponse.next({ request });
        aGuardar.forEach(({ name, value, options }) => respuesta.cookies.set(name, value, options));
        Object.entries(cabeceras ?? {}).forEach(([k, v]) => respuesta.headers.set(k, v));
      },
    },
  });

  try {
    await supabase.auth.getClaims();
  } catch {
    // Sin conexión con Supabase: la página decidirá qué mostrar.
  }
  return respuesta;
}

export const config = {
  // Solo donde hay sesión: miembros y acciones. La portada y lo estático no lo necesitan.
  matcher: ["/miembros/:path*", "/admin/:path*", "/app/:path*"],
};

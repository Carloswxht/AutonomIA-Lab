const texto = (f: FormData, campo: string) => String(f.get(campo) ?? "").trim();

export const MINIMO_CONTRASENA = 8;

export type ResultadoValidacion<T> = { ok: true; datos: T } | { ok: false; error: string };

/** Quita espacios y puntos del final: el dictado a veces añade «.» tras el correo (ver PLATAFORMA.md). */
export const limpiarCorreo = (valor: string) => valor.trim().replace(/[\s.]+$/, "").toLowerCase();

export function validarCorreo(f: FormData): ResultadoValidacion<{ email: string }> {
  const email = limpiarCorreo(texto(f, "email"));
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 254)
    return { ok: false, error: "Revisa el correo: no parece válido." };
  return { ok: true, datos: { email } };
}

/** Contraseña y su repetición (registro y nueva contraseña). */
export function validarContrasenas(f: FormData): ResultadoValidacion<{ password: string }> {
  const password = String(f.get("password") ?? "");
  const repetida = String(f.get("password2") ?? "");
  if (password.length < MINIMO_CONTRASENA)
    return { ok: false, error: `La contraseña tiene que tener al menos ${MINIMO_CONTRASENA} caracteres.` };
  if (password.length > 72) return { ok: false, error: "La contraseña es demasiado larga (máximo 72 caracteres)." };
  if (password !== repetida) return { ok: false, error: "Las contraseñas no coinciden." };
  return { ok: true, datos: { password } };
}

/** Traduce los errores de Supabase Auth a un mensaje claro. */
export function mensajeErrorAuth(codigo: string | undefined): string {
  switch (codigo) {
    case "invalid_credentials":
      return "Correo o contraseña incorrectos.";
    case "email_not_confirmed":
      return "Aún no has confirmado tu correo. Abre el enlace que te enviamos al crear la cuenta.";
    case "weak_password":
      return "Esa contraseña es demasiado fácil. Prueba con una más larga o con números y símbolos.";
    case "same_password":
      return "La nueva contraseña tiene que ser distinta de la anterior.";
    case "email_address_invalid":
      return "Revisa el correo: no parece válido.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Demasiados intentos. Espera unos minutos y vuelve a probar.";
    case "user_banned":
      return "Esta cuenta está desactivada. Escríbenos por WhatsApp si crees que es un error.";
    case "signup_disabled":
      return "Ahora mismo no se pueden crear cuentas. Escríbenos por WhatsApp.";
    default:
      return "Algo ha fallado. Inténtalo de nuevo en un momento.";
  }
}

/** Solo rutas internas ("/miembros"), nunca otra web ("//otra.com", "https://…"). */
export function rutaSegura(valor: string | null | undefined, porDefecto = "/miembros"): string {
  if (!valor || !valor.startsWith("/") || valor.startsWith("//") || valor.startsWith("/\\")) return porDefecto;
  return valor;
}

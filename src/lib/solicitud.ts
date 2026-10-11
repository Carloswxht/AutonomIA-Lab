export type DatosSolicitud = {
  nombre: string;
  email: string;
  empresa: string;
  telefono: string;
  mensaje: string;
};

export type ResultadoValidacion = { ok: true; datos: DatosSolicitud } | { ok: false; error: string };

const texto = (f: FormData, campo: string) => String(f.get(campo) ?? "").trim();

/** Valida el formulario de "Solicitar cuenta" (los mismos límites que la base de datos). */
export function validarSolicitud(f: FormData): ResultadoValidacion {
  const datos: DatosSolicitud = {
    nombre: texto(f, "nombre"),
    email: texto(f, "email").toLowerCase(),
    empresa: texto(f, "empresa"),
    telefono: texto(f, "telefono"),
    mensaje: texto(f, "mensaje"),
  };
  if (!datos.nombre) return { ok: false, error: "Escribe tu nombre." };
  if (datos.nombre.length > 120) return { ok: false, error: "El nombre es demasiado largo." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(datos.email) || datos.email.length > 254)
    return { ok: false, error: "Revisa el correo: no parece válido." };
  if (datos.empresa.length > 120) return { ok: false, error: "El nombre de la empresa es demasiado largo." };
  if (datos.telefono.length > 30) return { ok: false, error: "El teléfono es demasiado largo." };
  if (datos.mensaje.length > 1000) return { ok: false, error: "El mensaje es demasiado largo (máximo 1000 caracteres)." };
  return { ok: true, datos };
}

/** Traduce los errores de inicio de sesión de Supabase a un mensaje claro. */
export function mensajeErrorEntrar(codigo: string | undefined): string {
  switch (codigo) {
    case "invalid_credentials":
      return "Correo o contraseña incorrectos.";
    case "email_not_confirmed":
      return "Aún no has confirmado tu correo. Revisa tu bandeja de entrada.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Demasiados intentos. Espera unos minutos y vuelve a probar.";
    default:
      return "No hemos podido iniciar sesión. Inténtalo de nuevo en un momento.";
  }
}

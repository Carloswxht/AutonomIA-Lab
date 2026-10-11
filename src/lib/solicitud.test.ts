import { describe, expect, it } from "vitest";
import { mensajeErrorEntrar, validarSolicitud } from "./solicitud";

const formulario = (campos: Record<string, string>) => {
  const f = new FormData();
  Object.entries(campos).forEach(([k, v]) => f.set(k, v));
  return f;
};

describe("validarSolicitud", () => {
  it("acepta una solicitud correcta y normaliza el correo", () => {
    const r = validarSolicitud(formulario({ nombre: " Ana ", email: " Ana@Ejemplo.COM " }));
    expect(r).toEqual({
      ok: true,
      datos: { nombre: "Ana", email: "ana@ejemplo.com", empresa: "", telefono: "", mensaje: "" },
    });
  });

  it("pide el nombre", () => {
    expect(validarSolicitud(formulario({ email: "a@b.es" }))).toEqual({ ok: false, error: "Escribe tu nombre." });
  });

  it("rechaza un correo no válido", () => {
    const r = validarSolicitud(formulario({ nombre: "Ana", email: "no-es-correo" }));
    expect(r.ok).toBe(false);
  });

  it("rechaza un mensaje demasiado largo", () => {
    const r = validarSolicitud(formulario({ nombre: "Ana", email: "a@b.es", mensaje: "x".repeat(1001) }));
    expect(r.ok).toBe(false);
  });
});

describe("mensajeErrorEntrar", () => {
  it("explica credenciales incorrectas", () => {
    expect(mensajeErrorEntrar("invalid_credentials")).toBe("Correo o contraseña incorrectos.");
  });
  it("da un mensaje genérico ante errores desconocidos", () => {
    expect(mensajeErrorEntrar(undefined)).toMatch(/Inténtalo de nuevo/);
  });
});

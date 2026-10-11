import { describe, expect, it } from "vitest";
import { mensajeErrorAuth, rutaSegura, validarRegistro } from "./registro";

const formulario = (campos: Record<string, string>) => {
  const f = new FormData();
  Object.entries(campos).forEach(([k, v]) => f.set(k, v));
  return f;
};

describe("validarRegistro", () => {
  it("acepta correo y dos contraseñas iguales, y normaliza el correo", () => {
    expect(validarRegistro(formulario({ email: " Ana@Ejemplo.ES ", password: "unaclave8", password2: "unaclave8" }))).toEqual({
      ok: true,
      datos: { email: "ana@ejemplo.es", password: "unaclave8" },
    });
  });
  it("rechaza un correo no válido", () => {
    expect(validarRegistro(formulario({ email: "ana@", password: "unaclave8", password2: "unaclave8" })).ok).toBe(false);
  });
  it("pide al menos 8 caracteres", () => {
    const r = validarRegistro(formulario({ email: "a@b.es", password: "corta", password2: "corta" }));
    expect(r).toEqual({ ok: false, error: "La contraseña tiene que tener al menos 8 caracteres." });
  });
  it("avisa si no coinciden", () => {
    const r = validarRegistro(formulario({ email: "a@b.es", password: "unaclave8", password2: "otraclave8" }));
    expect(r).toEqual({ ok: false, error: "Las contraseñas no coinciden." });
  });
});

describe("mensajeErrorAuth", () => {
  it("explica credenciales incorrectas y correo sin confirmar", () => {
    expect(mensajeErrorAuth("invalid_credentials")).toBe("Correo o contraseña incorrectos.");
    expect(mensajeErrorAuth("email_not_confirmed")).toMatch(/confirmado/);
  });
  it("da un mensaje genérico ante errores desconocidos", () => {
    expect(mensajeErrorAuth(undefined)).toMatch(/Inténtalo de nuevo/);
  });
});

describe("rutaSegura", () => {
  it("deja pasar rutas internas", () => {
    expect(rutaSegura("/nueva-contrasena")).toBe("/nueva-contrasena");
  });
  it("bloquea otras webs", () => {
    expect(rutaSegura("//malo.com")).toBe("/miembros");
    expect(rutaSegura("https://malo.com")).toBe("/miembros");
    expect(rutaSegura("/\\malo.com")).toBe("/miembros");
    expect(rutaSegura(null)).toBe("/miembros");
  });
});

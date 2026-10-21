import { describe, expect, it } from "vitest";
import { mensajeErrorAuth, rutaSegura, validarContrasenas, validarCorreo } from "./registro";

const formulario = (campos: Record<string, string>) => {
  const f = new FormData();
  Object.entries(campos).forEach(([k, v]) => f.set(k, v));
  return f;
};

describe("validarCorreo", () => {
  it("acepta y normaliza un correo", () => {
    expect(validarCorreo(formulario({ email: " Ana@Ejemplo.ES " }))).toEqual({ ok: true, datos: { email: "ana@ejemplo.es" } });
  });
  it("quita el punto y los espacios que añade el dictado", () => {
    expect(validarCorreo(formulario({ email: "ana@gmail.com. " }))).toEqual({ ok: true, datos: { email: "ana@gmail.com" } });
  });
  it("rechaza un correo no válido", () => {
    expect(validarCorreo(formulario({ email: "ana@" })).ok).toBe(false);
  });
});

describe("validarContrasenas", () => {
  it("acepta dos contraseñas iguales de 8 o más", () => {
    expect(validarContrasenas(formulario({ password: "unaclave8", password2: "unaclave8" }))).toEqual({
      ok: true,
      datos: { password: "unaclave8" },
    });
  });
  it("pide al menos 8 caracteres", () => {
    expect(validarContrasenas(formulario({ password: "corta", password2: "corta" }))).toEqual({
      ok: false,
      error: "La contraseña tiene que tener al menos 8 caracteres.",
    });
  });
  it("avisa si no coinciden", () => {
    expect(validarContrasenas(formulario({ password: "unaclave8", password2: "otraclave8" }))).toEqual({
      ok: false,
      error: "Las contraseñas no coinciden.",
    });
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

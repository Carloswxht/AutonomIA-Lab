import { describe, expect, it } from "vitest";
import { puedeVer, SECCIONES, seccion } from "./membresia";

describe("membresía", () => {
  it("tiene 3 secciones gratis y 3 de pago, como el prototipo", () => {
    expect(SECCIONES.filter((s) => s.gratis).map((s) => s.clave)).toEqual(["aplicaciones", "ranking", "noticias"]);
    expect(SECCIONES.filter((s) => !s.gratis).map((s) => s.clave)).toEqual(["agentes", "plantillas", "universidad"]);
  });
  it("las gratis se ven siempre; las de pago solo con acceso total", () => {
    expect(puedeVer(seccion("ranking")!, false)).toBe(true);
    expect(puedeVer(seccion("universidad")!, false)).toBe(false);
    expect(puedeVer(seccion("universidad")!, true)).toBe(true);
  });
  it("una sección inventada no existe", () => {
    expect(seccion("nada")).toBeUndefined();
  });
});

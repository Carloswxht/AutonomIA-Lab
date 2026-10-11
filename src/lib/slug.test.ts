import { describe, expect, it } from "vitest";
import { colorValido, crearSlug } from "./slug";

describe("crearSlug", () => {
  it("quita tildes, eñes y símbolos", () => {
    expect(crearSlug("La Mar de Gambas · Cervecerías")).toBe("la-mar-de-gambas-cervecerias");
    expect(crearSlug("  Peña Ñandú, S.L. ")).toBe("pena-nandu-s-l");
  });
  it("devuelve vacío si no hay letras ni números", () => {
    expect(crearSlug("···")).toBe("");
  });
  it("no pasa de 60 caracteres ni acaba en guion", () => {
    const s = crearSlug("a".repeat(59) + " bcd");
    expect(s.length).toBeLessThanOrEqual(60);
    expect(s.endsWith("-")).toBe(false);
  });
});

describe("colorValido", () => {
  it("acepta #RRGGBB y lo pasa a mayúsculas", () => {
    expect(colorValido("#14295e")).toBe("#14295E");
  });
  it("vacío es null", () => {
    expect(colorValido("  ")).toBeNull();
  });
  it("rechaza otros formatos", () => {
    expect(() => colorValido("azul")).toThrow();
    expect(() => colorValido("#FFF")).toThrow();
  });
});

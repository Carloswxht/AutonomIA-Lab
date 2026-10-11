import { describe, expect, it } from "vitest";
import { colorValido } from "./color";

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

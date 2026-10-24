import { describe, expect, it } from "vitest";
import { GRUPOS, PERFILES, perfilDe } from "./servicios";

describe("servicios por perfil", () => {
  const titulos = GRUPOS.flatMap((g) => g.servicios.map((s) => s.titulo)).sort();
  it.each(PERFILES.map((p) => [p.clave, p]))("%s tiene los 9 servicios, una vez cada uno", (_c, p) => {
    expect(p.orden.map((o) => o.titulo).sort()).toEqual(titulos);
    for (const o of p.orden) expect(o.paraTi.length).toBeGreaterThan(10);
  });
  it("reconoce solo las claves válidas", () => {
    expect(perfilDe("pymes")?.boton).toBe("Pymes");
    expect(perfilDe("otra")).toBeNull();
    expect(perfilDe(null)).toBeNull();
  });
});

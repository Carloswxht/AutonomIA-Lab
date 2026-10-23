import { describe, expect, it } from "vitest";
import { color, contraste, correoDe, montarEnlace, paleta, remitente } from "./plantilla";

const BAR = { marca: "negocio", producto: "multibar", nombre: "La Mar de Gambas", persona: "Ana", fondo: "#FFFFFF", acento: "#D9722A" };

describe("correos con la imagen del negocio", () => {
  it("el enlace añade token_hash con ? o con &", () => {
    expect(montarEnlace("https://autonomialab.es/auth/confirmar/", "abc", "recovery")).toBe(
      "https://autonomialab.es/auth/confirmar/?token_hash=abc&type=recovery",
    );
    expect(montarEnlace("https://carta.autonomialab.es/panel/?bar=x#y", "a b", "recovery")).toBe(
      "https://carta.autonomialab.es/panel/?bar=x&token_hash=a%20b&type=recovery",
    );
  });

  it("solo acepta colores #RGB o #RRGGBB", () => {
    expect(color("#abc")).toBe("#AABBCC");
    expect(color("red")).toBeNull();
    expect(color("#12345g")).toBeNull();
  });

  it("el texto siempre se lee, aunque el negocio ponga colores que no contrastan", () => {
    const p = paleta({ marca: "negocio", fondo: "#FFFFFF", tarjeta: "#FFFFFF", texto: "#EEEEEE", acento: "#FFFF00" });
    expect(contraste(p.texto, p.tarjeta)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(p.encima, p.fondo)).toBeGreaterThanOrEqual(4.5);
    expect(p.boton).toBe("#111111");
  });

  it("la web de la empresa siempre lleva los colores de autonomIA Lab", () => {
    const p = paleta({ marca: "autonomialab", fondo: "#FFFFFF" });
    expect(p.fondo).toBe("#0A0B0D");
    expect(p.acento).toBe("#3B82F6");
  });

  it("cambiar contraseña de un bar sale con su nombre, sus colores y su logo", () => {
    const c = correoDe({ tipo: "recovery", enlace: "https://x.test/?token_hash=1&type=recovery" }, { ...BAR, logo: "https://x.test/logo.png" })!;
    expect(c.asunto).toBe("Cambia tu contraseña · La Mar de Gambas");
    expect(c.html).toContain('src="https://x.test/logo.png"');
    expect(c.html).toContain("#D9722A");
    expect(c.html).toContain("token_hash=1&amp;type=recovery");
    expect(c.html).not.toContain("wa.me");
    expect(c.texto).toContain("https://x.test/?token_hash=1&type=recovery");
  });

  it("escapa lo que viene de la base y no admite logos que no sean https", () => {
    const c = correoDe({ tipo: "recovery", enlace: "https://x.test/" }, { ...BAR, nombre: "<b>Bar</b>", logo: "javascript:alert(1)" })!;
    expect(c.html).not.toContain("<b>Bar</b>");
    expect(c.html).toContain("&lt;b&gt;Bar&lt;/b&gt;");
    expect(c.html).not.toContain("javascript:");
    expect(remitente({ nombre: 'Bar "malo" <x@y>\r\n' }, "avisos@autonomialab.com")).toBe('"Bar malo x@y" <avisos@autonomialab.com>');
  });

  it("acceso aprobado de la web y avisos que no se mandan", () => {
    const c = correoDe({ tipo: "magiclink", enlace: "https://autonomialab.es/auth/confirmar/?token_hash=1&type=magiclink" }, { marca: "autonomialab" })!;
    expect(c.asunto).toBe("Ya tienes acceso a autonomIA Lab");
    expect(c.html).toContain("Qué encontrarás dentro");
    expect(correoDe({ tipo: "mfa_factor_enrolled_notification" }, BAR)).toBeNull();
    expect(correoDe({ tipo: "reauthentication", codigo: "123456" }, BAR)!.html).toContain("123456");
  });
});

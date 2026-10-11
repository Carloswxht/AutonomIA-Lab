import { describe, expect, it } from "vitest";
import { enlaceWhatsApp } from "./contacto";

describe("enlaceWhatsApp", () => {
  it("apunta al número de autonomIA Lab y codifica el mensaje", () => {
    expect(enlaceWhatsApp("Hola, ¿me ayudáis?")).toBe(
      "https://wa.me/34605288673?text=Hola%2C%20%C2%BFme%20ayud%C3%A1is%3F",
    );
  });
});

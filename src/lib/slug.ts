/** Dirección corta de una empresa a partir de su nombre: "Bar El Recreo" → "bar-el-recreo". */
export function crearSlug(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/ñ/g, "n")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

/** Color en formato #RRGGBB, o null si viene vacío. Lanza si no es válido. */
export function colorValido(valor: string): string | null {
  const v = valor.trim();
  if (!v) return null;
  if (!/^#[0-9a-fA-F]{6}$/.test(v)) throw new Error("Los colores van en formato #RRGGBB, por ejemplo #14295E.");
  return v.toUpperCase();
}

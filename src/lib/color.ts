/** Color en formato #RRGGBB, o null si viene vacío. Lanza si no es válido. */
export function colorValido(valor: string): string | null {
  const v = valor.trim();
  if (!v) return null;
  if (!/^#[0-9a-fA-F]{6}$/.test(v)) throw new Error("Los colores van en formato #RRGGBB, por ejemplo #14295E.");
  return v.toUpperCase();
}

/**
 * Productos de autonomIA Lab (registro de productos de PLATAFORMA.md). Cada uno es una aplicación aparte, con su
 * dirección; la SaaS solo los enlaza. La clave es la de `comun.productos_contratados.producto` y `comun.negocios.tipo`.
 */
export type Producto = { clave: string; nombre: string; descripcion: string; url: string };

export const PRODUCTOS: Producto[] = [
  {
    clave: "multibar",
    nombre: "MultiBar",
    descripcion: "Carta digital por QR, pedidos desde la mesa y panel de barra.",
    url: "https://carta.autonomialab.es",
  },
  {
    clave: "gymbro",
    nombre: "Gymbro",
    descripcion: "Rutinas y registro de entrenos para gimnasios.",
    url: "https://gymbro.autonomialab.es",
  },
];

export const producto = (clave: string): Producto =>
  PRODUCTOS.find((p) => p.clave === clave) ?? { clave, nombre: clave, descripcion: "", url: "" };

/** Panel de plataforma de cada producto (solo para la cuenta de plataforma de Carlos). */
export const panelPlataforma = (clave: string) => {
  const url = producto(clave).url;
  return url ? `${url}/plataforma/` : "";
};

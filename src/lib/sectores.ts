/**
 * Sectores para el formulario de solicitud, de más a menos autónomos en España.
 *
 * Los 7 primeros están ordenados con datos oficiales: personas trabajadoras autónomas por sección de actividad,
 * enero de 2026 (Estadística de Autónomos, Ministerio de Trabajo y Economía Social, mites.gob.es/estadisticas/AUT):
 * Comercio 647.730 · Construcción 404.422 · Profesionales, científicas y técnicas 346.475 · Hostelería 320.732 ·
 * Agricultura, ganadería y pesca 263.601 · Transporte y almacenamiento 216.421 · Industria manufacturera 204.246.
 * El orden del resto es APROXIMADO (pendiente de comprobar en la misma estadística).
 */
export const SECTORES = [
  "Comercio y tiendas",
  "Construcción y reformas",
  "Servicios profesionales (asesoría, abogacía, arquitectura, marketing…)",
  "Hostelería (bares, restaurantes, alojamiento)",
  "Agricultura, ganadería y pesca",
  "Transporte y logística",
  "Industria y fabricación",
  "Servicios personales (peluquería, estética, reparaciones…)",
  "Sanidad y servicios sociales",
  "Servicios a empresas (limpieza, seguridad, alquiler, viajes…)",
  "Educación y formación",
  "Arte, ocio y deporte",
  "Tecnología, informática y comunicación",
  "Inmobiliaria",
  "Finanzas y seguros",
  "Energía, agua y residuos",
  "Otro",
] as const;

export const TIPOS = [
  { valor: "autonomo", etiqueta: "Autónomo" },
  { valor: "pyme", etiqueta: "Pyme" },
  { valor: "empresa", etiqueta: "Empresa grande" },
  { valor: "otro", etiqueta: "Otro" },
] as const;

export const etiquetaTipo = (valor: string | null) => TIPOS.find((t) => t.valor === valor)?.etiqueta ?? null;

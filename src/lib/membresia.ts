/**
 * Secciones del panel de miembros (de prototipos/miembros.html).
 * Gratis: cualquiera con acceso aprobado. De pago: solo clientes (quien tiene alguna aplicación contratada).
 * Los planes y precios NO están definidos: "Subir plan" lleva a hablar por WhatsApp.
 */
export type Seccion = {
  clave: string;
  titulo: string;
  descripcion: string;
  gratis: boolean;
  /** Trazos SVG (viewBox 24x24) del icono. */
  icono: string[];
};

export const SECCIONES: Seccion[] = [
  {
    clave: "aplicaciones",
    titulo: "Aplicaciones útiles",
    descripcion: "Un problema del día a día y la aplicación real que lo resuelve.",
    gratis: true,
    icono: ["M9 18h6", "M10 22h4", "M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0018 8 6 6 0 006 8c0 1 .23 2.23 1.5 3.5.76.76 1.21 1.5 1.41 2.5"],
  },
  {
    clave: "ranking",
    titulo: "Ranking",
    descripcion: "Las mejores herramientas de IA, según fuentes profesionales.",
    gratis: true,
    icono: ["M18 20V10", "M12 20V4", "M6 20v-6"],
  },
  {
    clave: "noticias",
    titulo: "Blog de noticias",
    descripcion: "Últimas noticias de IA, explicadas para tu negocio.",
    gratis: true,
    icono: ["M4 11a9 9 0 019 9", "M4 4a16 16 0 0116 16", "M5 19h.01"],
  },
  {
    clave: "agentes",
    titulo: "Agentes",
    descripcion: "Plantillas de agentes de IA listos para tu negocio.",
    gratis: false,
    icono: ["M4 4h16v16H4z", "M9 9h6v6H9z", "M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3"],
  },
  {
    clave: "plantillas",
    titulo: "Plantillas descargables",
    descripcion: "Prompts y plantillas listas para copiar y usar.",
    gratis: false,
    icono: ["M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4", "M7 10l5 5 5-5", "M12 15V3"],
  },
  {
    clave: "universidad",
    titulo: "Universidad",
    descripcion: "Cursos de IA: n8n, ChatGPT, Claude Code y más.",
    gratis: false,
    icono: [
      "M12 7v14",
      "M3 18a1 1 0 01-1-1V4a1 1 0 011-1h5a4 4 0 014 4 4 4 0 014-4h5a1 1 0 011 1v13a1 1 0 01-1 1h-6a3 3 0 00-3 3 3 3 0 00-3-3z",
    ],
  },
];

export const seccion = (clave: string) => SECCIONES.find((s) => s.clave === clave);

/** ¿Puede abrir esta sección? Gratis para todos; de pago solo con acceso total (cliente o superadmin). */
export const puedeVer = (s: Seccion, accesoTotal: boolean) => s.gratis || accesoTotal;

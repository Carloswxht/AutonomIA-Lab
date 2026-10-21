/**
 * Contenido de la página «Nuestros servicios» (/servicios/). Sale de docs/servicios.md (lista decidida por Carlos el
 * 21 oct). Sin precios (no están decididos) ni casos o cifras inventados.
 */
export type Servicio = { titulo: string; resumen: string; ejemplos: string[] };
export type Grupo = { clave: string; titulo: string; intro: string; servicios: Servicio[] };

export const GRUPOS: Grupo[] = [
  {
    clave: "ia",
    titulo: "Inteligencia artificial",
    intro: "Para que tu negocio responda, piense y trabaje aunque tú no estés.",
    servicios: [
      {
        titulo: "Agentes de IA",
        resumen: "Entienden lo que les piden y deciden qué hacer en cada caso. Conversan, buscan y redactan como lo haría una persona de tu equipo.",
        ejemplos: ["Atender a tus clientes por WhatsApp o en tu web", "Responder dudas con la información real de tu negocio", "Preparar borradores de correos y presupuestos"],
      },
      {
        titulo: "Automatizaciones",
        resumen: "Reglas fijas que hacen siempre los mismos pasos cuando pasa algo. Sin olvidos y sin que tengas que estar pendiente.",
        ejemplos: ["Avisos y recordatorios a tus clientes", "Pasar datos de un sitio a otro sin copiarlos a mano", "Informes que te llegan solos cada semana"],
      },
      {
        titulo: "Diagnóstico de IA",
        resumen: "Revisamos contigo cómo trabajas hoy y te decimos, claro y sin rodeos, qué se puede automatizar y qué no merece la pena.",
        ejemplos: ["Una llamada o una visita a tu negocio", "Lista de tareas que te quitan más tiempo", "Propuesta ordenada por lo que antes se nota"],
      },
      {
        titulo: "Formación en IA",
        resumen: "Para que tú y tu equipo uséis la IA en el día a día con seguridad y sacándole partido de verdad.",
        ejemplos: ["Sesiones prácticas con vuestras propias tareas", "Qué herramientas usar y cuáles no", "Buenas prácticas con los datos de tus clientes"],
      },
    ],
  },
  {
    clave: "medida",
    titulo: "Hecho a medida",
    intro: "Programado para tu negocio, tal como funciona. Nada de plantillas.",
    servicios: [
      {
        titulo: "Aplicaciones web empresariales a medida",
        resumen: "Una aplicación con tu marca que funciona en el móvil y en el ordenador, pensada para cómo trabaja tu equipo.",
        ejemplos: ["Cada persona entra con su cuenta y su papel", "Funciona en iPhone y en Android, sin instalar nada", "Crece contigo: se añaden funciones cuando las necesitas"],
      },
      {
        titulo: "CRM a medida",
        resumen: "Tus clientes, contactos y ventas en un solo sitio, ordenados como tú los entiendes y no como dice un programa genérico.",
        ejemplos: ["Ficha de cada cliente con todo su historial", "Seguimiento de presupuestos y oportunidades", "Recordatorios para no dejar a nadie sin respuesta"],
      },
      {
        titulo: "Páginas web profesionales",
        resumen: "La carta de presentación de tu negocio: rápida, clara en el móvil y pensada para que te escriban.",
        ejemplos: ["Diseño con tu marca", "Contacto directo por WhatsApp", "La hacemos, la alojamos y la mantenemos nosotros"],
      },
    ],
  },
  {
    clave: "cuidado",
    titulo: "Siempre al día",
    intro: "No te dejamos solo cuando todo está funcionando.",
    servicios: [
      {
        titulo: "Alojamiento y mantenimiento",
        resumen: "Nos ocupamos de que todo lo que hacemos para ti siga funcionando, seguro y al día, con una cuota mensual.",
        ejemplos: ["Tus datos guardados en Europa (Fráncfort)", "Arreglos y ajustes cuando los necesitas", "Una persona que te responde"],
      },
      {
        titulo: "Ficha de Google y reseñas",
        resumen: "Que tu negocio aparezca bien cuando te buscan en Google y en Maps, y que tus clientes te dejen su opinión.",
        ejemplos: ["Ficha completa y cuidada", "Fotos, horarios y datos siempre correctos", "Ayuda para conseguir y responder reseñas"],
      },
    ],
  },
];

export type ProductoServicio = { nombre: string; para: string; resumen: string; url?: string };

/** Productos propios: una aplicación por sector, que cada negocio recibe con su marca. */
export const PRODUCTOS_EN_MARCHA: ProductoServicio[] = [
  { nombre: "MultiBar", para: "Bares y restaurantes", resumen: "Carta digital por QR, pedidos desde la mesa y panel de barra.", url: "https://carta.autonomialab.es" },
  { nombre: "Gymbro", para: "Gimnasios", resumen: "Rutinas y registro de entrenos para los socios, con panel para el dueño.", url: "https://gymbro.autonomialab.es" },
];

export const PRODUCTOS_EN_CAMINO: ProductoServicio[] = [
  { nombre: "Reservas y citas", para: "Peluquerías, clínicas, talleres", resumen: "Citas online con recordatorios para que nadie falte." },
  { nombre: "Panel de datos", para: "Dueños de negocio", resumen: "Ventas, horas punta y clientes que vuelven, en una pantalla." },
  { nombre: "Control de horario", para: "Empresas con personal", resumen: "Registro de la jornada de tu equipo desde el móvil." },
  { nombre: "Bitácora de seguridad", para: "Empresas de seguridad", resumen: "Rondas, incidencias y relevos de los vigilantes." },
  { nombre: "Gestión de pisos", para: "Propietarios de varios pisos", resumen: "Avisos de inquilinos, mantenimientos con fotos y supervisión del dueño." },
];

export const PASOS = [
  { titulo: "Diagnóstico", texto: "Hablamos de tu negocio y vemos qué te quita más tiempo." },
  { titulo: "Propuesta", texto: "Te decimos qué haríamos, en qué orden y qué no merece la pena." },
  { titulo: "Lo construimos", texto: "Con tu marca, probado en tu móvil antes de dártelo." },
  { titulo: "Lo mantenemos", texto: "Seguimos ahí para ajustes, dudas y mejoras." },
];

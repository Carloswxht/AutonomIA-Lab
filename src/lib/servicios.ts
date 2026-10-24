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

/**
 * La misma página contada a cada perfil (Carlos, 24 oct; textos de docs/servicios-por-perfil.md). Mismos servicios,
 * otro orden, una línea «para ti» en cada uno y otra entrada y otro cierre. Se elige en la portada o arriba de
 * /servicios/ (?para=autonomos|pymes|empresas) y el móvil lo recuerda.
 */
export type Perfil = {
  clave: "autonomos" | "pymes" | "empresas";
  boton: string;
  titulo: string;
  entrada: string;
  /** Títulos de los servicios en el orden de este perfil, con su línea «para ti». */
  orden: { titulo: string; paraTi: string }[];
  cierre: { titulo: string; texto: string; boton: string; mensaje: string };
};

export const PERFILES: Perfil[] = [
  {
    clave: "autonomos",
    boton: "Autónomos",
    titulo: "Haces de todo. Que lo repetitivo se haga solo.",
    entrada:
      "Atiendes, presupuestas, facturas con tu programa, contestas WhatsApp a deshoras… Te quitamos de encima lo que se repite para que dediques tu tiempo a tu oficio y a tus clientes.",
    orden: [
      { titulo: "Diagnóstico de IA", paraTi: "Una charla para ver qué tareas te comen más horas y por dónde empezar sin gastar de más." },
      { titulo: "Automatizaciones", paraTi: "Recordatorios de citas, avisos y presupuestos que salen solos, sin tener que acordarte." },
      { titulo: "Agentes de IA", paraTi: "Alguien que contesta a tus clientes por WhatsApp mientras estás trabajando." },
      { titulo: "Ficha de Google y reseñas", paraTi: "Que te encuentren cuando buscan tu oficio en tu zona." },
      { titulo: "Páginas web profesionales", paraTi: "Una web sencilla para que te conozcan y te escriban." },
      { titulo: "Formación en IA", paraTi: "Aprender a usar la IA en tus propias tareas, a tu ritmo." },
      { titulo: "CRM a medida", paraTi: "Tus clientes y presupuestos en un solo sitio, en el móvil." },
      { titulo: "Aplicaciones web empresariales a medida", paraTi: "Cuando tu forma de trabajar no cabe en ningún programa." },
      { titulo: "Alojamiento y mantenimiento", paraTi: "Olvidarte de la parte técnica: nos ocupamos nosotros." },
    ],
    cierre: {
      titulo: "Empieza por lo pequeño.",
      texto: "Cuéntanos tu día a día por WhatsApp y te decimos qué te ahorraría más tiempo.",
      boton: "Hablar por WhatsApp",
      mensaje: "Hola, soy autónomo/a y quiero ver qué me puede ahorrar tiempo.",
    },
  },
  {
    clave: "pymes",
    boton: "Pymes",
    titulo: "Tu equipo, tus clientes y tus datos, en orden.",
    entrada:
      "Cuando el negocio crece aparecen las hojas de cálculo sueltas, los avisos que se pierden y las tareas que dependen de una sola persona. Ponemos orden con herramientas hechas para cómo trabajáis vosotros.",
    orden: [
      { titulo: "CRM a medida", paraTi: "Todos los clientes, presupuestos y seguimientos en un sitio que ve todo el equipo." },
      { titulo: "Automatizaciones", paraTi: "Que los datos pasen de un sitio a otro sin copiarlos a mano y que los informes lleguen solos." },
      { titulo: "Aplicaciones web empresariales a medida", paraTi: "Cada persona con su cuenta y su papel, en el móvil o el ordenador." },
      { titulo: "Agentes de IA", paraTi: "Atención a clientes a cualquier hora, con la información real del negocio." },
      { titulo: "Diagnóstico de IA", paraTi: "Revisamos cómo trabajáis y proponemos un orden: primero lo que antes se nota." },
      { titulo: "Formación en IA", paraTi: "Sesiones prácticas para el equipo, con vuestras propias tareas." },
      { titulo: "Páginas web profesionales", paraTi: "Una web clara que trae contactos." },
      { titulo: "Ficha de Google y reseñas", paraTi: "La ficha al día y las reseñas respondidas." },
      { titulo: "Alojamiento y mantenimiento", paraTi: "Todo funcionando y al día, con una persona que os responde." },
    ],
    cierre: {
      titulo: "Hagamos un diagnóstico.",
      texto: "Una llamada o una visita para ver qué os quita más tiempo y qué no merece la pena.",
      boton: "Pedir diagnóstico por WhatsApp",
      mensaje: "Hola, tengo una pyme y quiero un diagnóstico de IA.",
    },
  },
  {
    clave: "empresas",
    boton: "Empresas",
    titulo: "IA y aplicaciones a medida, integradas en cómo ya trabajáis.",
    entrada:
      "Proyectos por fases, con un responsable claro, los datos en Europa y mantenimiento continuo. Sin cambiar de golpe lo que hoy funciona.",
    orden: [
      { titulo: "Diagnóstico de IA", paraTi: "Un análisis de procesos y una propuesta por fases, con lo que conviene hacer y lo que no." },
      { titulo: "Aplicaciones web empresariales a medida", paraTi: "Herramientas propias con vuestra marca, cuentas por persona y permisos por papel." },
      { titulo: "Agentes de IA", paraTi: "Asistentes que conocen vuestros procedimientos y atienden a clientes o al equipo." },
      { titulo: "Automatizaciones", paraTi: "Conectar los programas que ya usáis para que la información no se copie a mano." },
      { titulo: "CRM a medida", paraTi: "Un CRM que se adapta a vuestro proceso comercial, no al revés." },
      { titulo: "Formación en IA", paraTi: "Formación por equipos y buenas prácticas con los datos." },
      { titulo: "Alojamiento y mantenimiento", paraTi: "Datos guardados en Europa (Fráncfort) y mantenimiento continuo." },
      { titulo: "Páginas web profesionales", paraTi: "Webs y páginas de producto rápidas y cuidadas." },
      { titulo: "Ficha de Google y reseñas", paraTi: "La ficha de cada sede al día." },
    ],
    cierre: {
      titulo: "Cuéntanos el proyecto.",
      texto: "Os preparamos una propuesta por fases.",
      boton: "Contactar por WhatsApp",
      mensaje: "Hola, escribo de una empresa y queremos contaros un proyecto.",
    },
  },
];

export const perfilDe = (clave: string | null | undefined) => PERFILES.find((p) => p.clave === clave) ?? null;

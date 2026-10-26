// Correos de las cuentas (Supabase Auth → Send Email Hook) con la imagen de cada negocio.
// Sin dependencias: la usa la Edge Function (index.ts) y la prueban los tests de la web (plantilla.test.ts).
// HTML «a la antigua» (tablas y estilos en línea), como supabase/plantillas/_base.py: es lo que respetan Gmail,
// Outlook y Apple Mail. Si el lector bloquea las imágenes, el nombre del negocio se ve igual (texto alternativo).

// Lo que devuelve public.marca_correo(auth_id) (ver datos/cambios/2026-10-23-marca-correo.sql).
export type Marca = {
  marca?: string; // "autonomialab" para la web de la empresa y la cuenta de plataforma
  producto?: string; // tipo del negocio: multibar, gymbro…
  nombre?: string; // nombre del negocio
  persona?: string; // nombre de quien recibe
  logo?: string; // dirección https de la imagen
  fondo?: string;
  tarjeta?: string;
  texto?: string;
  acento?: string;
  responder_a?: string;
  slug?: string; // dirección corta del negocio
  miembro_web?: boolean; // la cuenta también es miembro de la web de autonomIA Lab
  entrar?: string; // opcional, del producto: página https donde entran sus cuentas
};

export type Datos = {
  tipo: string; // email_action_type de Supabase
  enlace?: string; // ya montado con token_hash
  codigo?: string; // código de 6 cifras (reautenticación)
  aviso?: string; // párrafo extra (texto sin HTML)
};

export type Correo = { asunto: string; html: string; texto: string };

const AUTONOMIA = { nombre: "autonomIA Lab", fondo: "#0A0B0D", tarjeta: "#121317", texto: "#F3F4F6", acento: "#3B82F6" };
const PRODUCTOS: Record<string, string> = { multibar: "MultiBar", gymbro: "Gymbro" };

const TITULO = "'Space Grotesk','Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const CUERPO = "'Work Sans','Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "'IBM Plex Mono','Roboto Mono','SF Mono',Menlo,Consolas,monospace";

export function esc(t: unknown): string {
  return String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

// Solo colores #RGB o #RRGGBB: lo demás se ignora (los ajustes los escribe el panel de cada producto).
export function color(c: unknown): string | null {
  if (typeof c !== "string") return null;
  const t = c.trim();
  if (/^#[0-9a-f]{6}$/i.test(t)) return t.toUpperCase();
  if (/^#[0-9a-f]{3}$/i.test(t)) return ("#" + [...t.slice(1)].map((x) => x + x).join("")).toUpperCase();
  return null;
}

function rgb(c: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)) as [number, number, number];
}

function mezclar(a: string, b: string, t: number): string {
  const x = rgb(a), y = rgb(b);
  return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("").toUpperCase();
}

function luz(c: string): number {
  const [r, g, b] = rgb(c).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contraste(a: string, b: string): number {
  const [x, y] = [luz(a), luz(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

// Colores completos a partir de los que tenga el negocio. Si el texto no se lee sobre el fondo, se corrige.
export function paleta(m: Marca) {
  const propia = m.marca !== "autonomialab";
  const fondo = (propia && color(m.fondo)) || AUTONOMIA.fondo;
  const oscuro = luz(fondo) < 0.4;
  let tarjeta = (propia && color(m.tarjeta)) || (propia ? mezclar(fondo, oscuro ? "#FFFFFF" : "#000000", 0.05) : AUTONOMIA.tarjeta);
  let texto = (propia && color(m.texto)) || (oscuro ? "#F3F4F6" : "#1F2430");
  if (contraste(texto, tarjeta) < 4.5) texto = luz(tarjeta) < 0.4 ? "#F3F4F6" : "#1F2430";
  if (contraste(texto, tarjeta) < 4.5) tarjeta = luz(texto) < 0.4 ? "#FFFFFF" : "#121317";
  const acento = (propia && color(m.acento)) || AUTONOMIA.acento;
  // Botón con letra blanca siempre que se lea (texto grande y en negrita: basta 3:1).
  const boton = contraste("#FFFFFF", acento) >= 3 ? "#FFFFFF" : "#111111";
  // El enlace y la etiqueta usan el acento si se lee sobre la tarjeta; si no, el texto.
  const vivo = contraste(acento, tarjeta) >= 3 ? acento : texto;
  // Lo que va directamente sobre el fondo (nombre del negocio arriba y pie).
  const encima = contraste(texto, fondo) >= 4.5 ? texto : oscuro ? "#F3F4F6" : "#1F2430";
  return {
    fondo,
    tarjeta,
    texto,
    acento,
    boton,
    vivo,
    tenue: mezclar(texto, tarjeta, 0.35),
    encima,
    apagado: mezclar(encima, fondo, 0.4),
    borde: mezclar(tarjeta, texto, 0.14),
    suave: mezclar(tarjeta, vivo, 0.12),
  };
}

function nombreDe(m: Marca): string {
  return m.marca === "autonomialab" ? AUTONOMIA.nombre : (m.nombre || "").trim() || AUTONOMIA.nombre;
}

type Contenido = {
  asunto: string;
  etiqueta: string;
  titulo: string;
  parrafos: string[]; // HTML ya escapado
  boton?: string;
  nota: string;
  extra?: string;
};

function contenido(d: Datos, m: Marca): Contenido | null {
  const nombre = esc(nombreDe(m));
  const empresa = m.marca === "autonomialab";
  const hola = m.persona?.trim() ? `Hola, ${esc(m.persona.trim())}. ` : "";
  const unaVez = "Por seguridad, el enlace solo sirve una vez y caduca al poco tiempo.";
  switch (d.tipo) {
    case "recovery":
      return {
        asunto: `Cambia tu contraseña · ${nombreDe(m)}`,
        etiqueta: "Seguridad de tu cuenta",
        titulo: "Cambia tu contraseña",
        parrafos: [
          `${hola}Hemos recibido una petición para cambiar la contraseña de tu cuenta de ${nombre}.`,
          "Pulsa el botón y elige una nueva. Tu contraseña actual seguirá funcionando hasta que la cambies.",
        ],
        boton: "Poner nueva contraseña",
        nota: `${unaVez} Si no lo has pedido tú, ignora este correo: nadie puede entrar sin él.`,
      };
    case "magiclink":
      // En la web de la empresa, el enlace de entrada solo se manda al aprobar una solicitud de acceso.
      return empresa
        ? {
            asunto: "Ya tienes acceso a autonomIA Lab",
            etiqueta: "Acceso aprobado",
            titulo: "Ya tienes acceso a autonomIA Lab",
            parrafos: [
              `${hola}Hemos revisado tu solicitud y tu cuenta ya está lista.`,
              "Solo falta un paso: <b>crea tu contraseña</b> y entra.",
            ],
            boton: "Crear mi contraseña",
            nota: `${unaVez} Si no has pedido acceso, ignora este correo.`,
            extra: "dentro",
          }
        : {
            asunto: `Tu enlace para entrar · ${nombreDe(m)}`,
            etiqueta: "Entrar",
            titulo: `Entra en ${nombre}`,
            parrafos: [`${hola}Pulsa el botón para entrar en tu cuenta de ${nombre}.`],
            boton: "Entrar",
            nota: `${unaVez} Si no lo has pedido tú, ignora este correo.`,
          };
    case "invite":
      return {
        asunto: `Ya tienes cuenta en ${nombreDe(m)}`,
        etiqueta: "Bienvenida",
        titulo: `Ya tienes cuenta en ${nombre}`,
        parrafos: [`${hola}Tu cuenta de ${nombre} ya está lista.`, "Solo falta un paso: <b>crea tu contraseña</b> y entra."],
        boton: "Crear mi contraseña",
        nota: `${unaVez} Si no esperabas este correo, ignóralo.`,
      };
    case "signup":
    case "email":
      return {
        asunto: `Confirma tu correo · ${nombreDe(m)}`,
        etiqueta: "Confirma tu correo",
        titulo: "Confirma tu correo",
        parrafos: [`${hola}Pulsa el botón para confirmar que este correo es tuyo y terminar de crear tu cuenta de ${nombre}.`],
        boton: "Confirmar mi correo",
        nota: `${unaVez} Si no has creado ninguna cuenta, ignora este correo.`,
      };
    case "email_change":
      return {
        asunto: `Confirma el cambio de correo · ${nombreDe(m)}`,
        etiqueta: "Seguridad de tu cuenta",
        titulo: "Confirma el cambio de correo",
        parrafos: [`${hola}Se ha pedido cambiar el correo de tu cuenta de ${nombre}. Pulsa el botón para confirmarlo.`],
        boton: "Confirmar el cambio",
        nota: `${unaVez} Si no lo has pedido tú, ignora este correo y tu correo seguirá igual.`,
      };
    case "reauthentication":
      return {
        asunto: `${d.codigo ?? ""} es tu código · ${nombreDe(m)}`.trim(),
        etiqueta: "Seguridad de tu cuenta",
        titulo: "Tu código de confirmación",
        parrafos: [`${hola}Escribe este código en ${nombre} para confirmar que eres tú:`],
        nota: "El código caduca al poco tiempo. Si no lo has pedido tú, ignora este correo.",
        extra: "codigo",
      };
    case "password_changed_notification":
      return {
        asunto: `Tu contraseña ha cambiado · ${nombreDe(m)}`,
        etiqueta: "Seguridad de tu cuenta",
        titulo: "Tu contraseña ha cambiado",
        parrafos: [`${hola}La contraseña de tu cuenta de ${nombre} se acaba de cambiar.`],
        nota: "Si no has sido tú, pide una contraseña nueva cuanto antes desde «¿Olvidaste tu contraseña?».",
      };
    case "email_changed_notification":
      return {
        asunto: `El correo de tu cuenta ha cambiado · ${nombreDe(m)}`,
        etiqueta: "Seguridad de tu cuenta",
        titulo: "El correo de tu cuenta ha cambiado",
        parrafos: [`${hola}El correo de tu cuenta de ${nombre} se acaba de cambiar.`],
        nota: "Si no has sido tú, avisa cuanto antes a quien te dio la cuenta.",
      };
    default:
      return null; // Otros avisos de Supabase: no se mandan.
  }
}

function cabecera(m: Marca, p: ReturnType<typeof paleta>): string {
  const logo = typeof m.logo === "string" && /^https:\/\/[^\s"'<>]+$/.test(m.logo) ? m.logo : null;
  if (m.marca !== "autonomialab" && logo)
    return `<img src="${esc(logo)}" alt="${esc(nombreDe(m))}" height="44" style="display:block;height:44px;width:auto;max-width:220px;border:0;outline:none;font-family:${TITULO};font-size:20px;font-weight:600;color:${p.encima};">`;
  if (m.marca !== "autonomialab")
    return `<span style="font-family:${TITULO};font-size:22px;font-weight:600;color:${p.encima};">${esc(nombreDe(m))}</span>`;
  return `<span style="font-family:${MONO};font-size:15px;font-weight:600;color:${p.apagado};">[</span><span style="font-family:${MONO};font-size:15px;font-weight:600;color:${p.vivo};">autonomIA Lab</span><span style="display:inline-block;width:7px;height:15px;margin-left:5px;vertical-align:-2px;background:${p.vivo};"></span><span style="font-family:${MONO};font-size:15px;font-weight:600;color:${p.apagado};">]</span>`;
}

function ventaja(p: ReturnType<typeof paleta>, titulo: string, texto: string): string {
  return `
            <tr><td bgcolor="${p.suave}" style="padding:12px 16px;border:1px solid ${p.borde};border-radius:12px;background:${p.suave};font-family:${CUERPO};font-size:15px;line-height:1.5;color:${p.texto};">
              <span style="color:${p.vivo};">&rarr;</span>&nbsp; <b style="font-weight:600;">${titulo}</b><span style="color:${p.tenue};"> · ${texto}</span>
            </td></tr>
            <tr><td height="8" style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>`;
}

function extra(c: Contenido, d: Datos, p: ReturnType<typeof paleta>): string {
  if (c.extra === "codigo")
    return `<p style="margin:8px 0 22px;font-family:${MONO};font-size:34px;font-weight:600;letter-spacing:0.2em;color:${p.texto};">${esc(d.codigo)}</p>`;
  if (c.extra === "dentro")
    return `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0;">
            <tr><td style="padding:0 0 8px;font-family:${MONO};font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${p.vivo};">Qué encontrarás dentro</td></tr>
            <tr><td style="padding:0 0 14px;font-family:${TITULO};font-size:18px;line-height:1.4;font-weight:600;color:${p.texto};">Aplicaciones web empresariales pensadas para autónomos, pymes y empresas en España:</td></tr>
            ${ventaja(p, "Ahorra tiempo", "las tareas que hoy haces a mano, hechas solas.")}
            ${ventaja(p, "Ahorra dinero", "menos papeleo, menos errores y menos herramientas sueltas.")}
            ${ventaja(p, "Decide con datos", "toda la información de tu negocio ordenada en un panel, para decidir mejor y más rápido.")}
            ${ventaja(p, "Atiende mejor", "que tus clientes nunca tengan que esperar.")}
            <tr><td style="padding:4px 0 0;font-family:${CUERPO};font-size:15px;line-height:1.5;color:${p.texto};">Y ejemplos reales que puedes probar desde el móvil.</td></tr>
          </table>`;
  return "";
}

function pie(m: Marca, p: ReturnType<typeof paleta>): string {
  if (m.marca === "autonomialab")
    return `¿Dudas? Escríbenos por WhatsApp: <a href="https://wa.me/34605288673" target="_blank" style="color:${p.tenue};text-decoration:none;">+34 605 288 673</a><br>
      autonomIA Lab · Paneles web con IA para autónomos, pymes y empresas en España`;
  const producto = m.producto && PRODUCTOS[m.producto] ? ` · ${PRODUCTOS[m.producto]}` : "";
  return `${esc(nombreDe(m))}${producto}<br>Correo enviado por autonomIA Lab, que gestiona esta aplicación para ${esc(nombreDe(m))}.`;
}

function aTexto(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

// Devuelve null si ese tipo de aviso no se manda.
export function correoDe(d: Datos, m: Marca): Correo | null {
  const c = contenido(d, m);
  if (!c) return null;
  const p = paleta(m);
  const enlace = c.boton && d.enlace ? esc(d.enlace) : null;
  const todos = d.aviso ? [...c.parrafos, `<b>${esc(d.aviso)}</b>`] : c.parrafos;
  const parrafos = todos
    .map((t) => `<p style="margin:0 0 14px;font-family:${CUERPO};font-size:16px;line-height:1.6;color:${p.tenue};">${t.replace(/<b>/g, `<b style="color:${p.texto};font-weight:600;">`)}</p>`)
    .join("");
  const boton = enlace
    ? `
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 12px;">
            <tr><td bgcolor="${p.acento}" style="border-radius:12px;background:${p.acento};">
              <a href="${enlace}" target="_blank" style="display:inline-block;padding:16px 30px;font-family:${CUERPO};font-size:16px;font-weight:600;color:${p.boton};text-decoration:none;border-radius:12px;">${c.boton} &rarr;</a>
            </td></tr>
          </table>`
    : "";
  const copiar = enlace
    ? `
          <p style="margin:26px 0 0;padding-top:20px;border-top:1px solid ${p.borde};font-family:${CUERPO};font-size:12px;line-height:1.6;color:${p.tenue};">
            ¿El botón no funciona? Copia este enlace en tu navegador:<br>
            <a href="${enlace}" target="_blank" style="color:${p.tenue};word-break:break-all;">${enlace}</a>
          </p>`
    : "";
  const preheader = aTexto(c.parrafos[0]);
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="${luz(p.fondo) < 0.4 ? "dark light" : "light"}">
<title>${esc(c.titulo)}</title>
<style>
  @media (max-width: 620px) { .caja { padding: 28px 22px !important; } .titulo { font-size: 26px !important; } }
</style>
</head>
<body style="margin:0;padding:0;background:${p.fondo};" bgcolor="${p.fondo}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${p.fondo};">${esc(preheader)}&#8203;&#847;&#8203;&#847;&#8203;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${p.fondo}" style="background:${p.fondo};">
<tr><td align="center" style="padding:32px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
    <tr><td style="padding:0 6px 22px;">${cabecera(m, p)}</td></tr>
    <tr><td bgcolor="${p.tarjeta}" style="background:${p.tarjeta};border:1px solid ${p.borde};border-radius:18px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td height="4" bgcolor="${p.acento}" style="height:4px;line-height:4px;font-size:0;background:${p.acento};border-radius:18px 18px 0 0;">&nbsp;</td></tr>
        <tr><td class="caja" style="padding:40px 40px 36px;">
          <p style="margin:0 0 18px;"><span style="display:inline-block;padding:5px 10px;border:1px solid ${p.borde};border-radius:6px;background:${p.suave};font-family:${MONO};font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${p.vivo};">&middot; ${esc(c.etiqueta)}</span></p>
          <h1 class="titulo" style="margin:0 0 18px;font-family:${TITULO};font-size:30px;line-height:1.15;font-weight:600;color:${p.texto};">${c.titulo}</h1>
          ${parrafos}${extra(c, d, p)}${boton}
          <p style="margin:0 0 4px;font-family:${CUERPO};font-size:13px;line-height:1.5;color:${p.tenue};">${esc(c.nota)}</p>${copiar}
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:24px 8px 0;font-family:${CUERPO};font-size:12px;line-height:1.7;color:${p.apagado};text-align:center;">
      ${pie(m, p)}
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>
`;
  const texto = [
    nombreDe(m),
    "",
    aTexto(c.titulo),
    "",
    ...c.parrafos.map(aTexto),
    ...(d.aviso ? ["", d.aviso] : []),
    ...(c.extra === "codigo" ? ["", String(d.codigo ?? "")] : []),
    ...(enlace ? ["", `${c.boton}: ${d.enlace}`] : []),
    "",
    c.nota,
  ].join("\n");
  return { asunto: c.asunto, html, texto };
}

// Enlace del botón: la página que pidió el correo (redirect_to, que Supabase ya comprobó con la lista de
// «Redirect URLs»; si no la admite, pone la Site URL) con el token_hash para que esa página llame a verifyOtp.
export function montarEnlace(destino: string, tokenHash: string, tipo: string): string {
  const base = destino.trim() || "https://autonomialab.es/auth/confirmar/";
  const [sinAncla] = base.split("#");
  const sep = sinAncla.includes("?") ? "&" : "?";
  return `${sinAncla}${sep}token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(tipo)}`;
}

// Nombre del remitente sin caracteres que rompan la cabecera del correo.
export function remitente(m: Marca, direccion: string): string {
  const nombre = nombreDe(m).replace(/["<>\r\n\\]/g, "").slice(0, 60).trim() || AUTONOMIA.nombre;
  return `"${nombre}" <${direccion}>`;
}

// Páginas donde entran las cuentas de cada producto (con ?token_hash=… al final). Un producto puede dar la suya
// en marca_correo_<tipo> con la clave «entrar».
const ENTRAR: Record<string, (slug: string) => string> = {
  multibar: (slug) => `https://carta.autonomialab.es/panel/?bar=${slug}`,
  gymbro: (slug) => `https://gymbro.autonomialab.es/?g=${slug}`,
};

// Si una cuenta de un negocio (que no es miembro de la web) pide el correo desde autonomialab.es, el botón la lleva
// a la página de su producto: en la web de autonomIA Lab no podría entrar. Ej.: el dueño de un bar que escribe su
// correo en «¿Olvidaste tu contraseña?» de autonomialab.es.
export function destinoCorreo(destino: string, m: Marca): { destino: string; aviso?: string } {
  if (m.marca !== "negocio" || m.miembro_web) return { destino };
  let host = "";
  try {
    host = new URL(destino).hostname;
  } catch {
    return { destino };
  }
  if (host !== "autonomialab.es" && host !== "www.autonomialab.es") return { destino };
  const propia = typeof m.entrar === "string" && /^https:\/\/[a-z0-9-]+\.autonomialab\.es\/[^\s"'<>]*$/.test(m.entrar) ? m.entrar : null;
  const slug = typeof m.slug === "string" && /^[a-z0-9][a-z0-9-]{1,39}$/.test(m.slug) ? m.slug : null;
  const pagina = propia ?? (slug && m.producto && ENTRAR[m.producto] ? ENTRAR[m.producto](slug) : null);
  if (!pagina) return { destino };
  return {
    destino: pagina,
    aviso: `Esta cuenta es de ${nombreDe(m)}: el botón te lleva a su página para entrar, no a la web de autonomIA Lab.`,
  };
}

// Genera un único HTML autocontenido con las pantallas ya compiladas (`npm run build`),
// para enseñárselas a Carlos como enlace sin servidor. Uso: node scripts/vista-previa.mjs <salida.html>
// Cada ruta es una vista por hash (#inicio, #solicitar). Sin JS de Next: solo HTML + CSS + un poco de JS propio.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const RAIZ = process.cwd();
const RUTAS = [
  { vista: "inicio", archivo: "index.html", ruta: "/" },
  { vista: "solicitar", archivo: "solicitar.html", ruta: "/solicitar" },
];
const salida = process.argv[2] ?? "vista-previa.html";

const leer = (p) => readFileSync(join(RAIZ, p));
const css = new Set();
const vistas = [];

for (const { vista, archivo } of RUTAS) {
  const html = leer(join(".next/server/app", archivo)).toString();
  for (const [, href] of html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)) css.add(href);
  let cuerpo = html.slice(html.indexOf("<body>") + 6, html.lastIndexOf("</body>"));
  cuerpo = cuerpo.replace(/<script[\s\S]*?<\/script>/g, "");
  for (const r of RUTAS) {
    cuerpo = cuerpo.replaceAll(`href="${r.ruta}"`, `href="#${r.vista}"`);
  }
  vistas.push(`<div data-vista="${vista}"${vista === "inicio" ? "" : " hidden"}>${cuerpo}</div>`);
}

const media = (url) => {
  const ruta = url.replace(/^\.\.\/media\//, ".next/static/media/");
  return `data:font/woff2;base64,${leer(ruta).toString("base64")}`;
};

let estilos = [...css].map((href) => leer(href.replace(/^\/_next\//, ".next/")).toString()).join("\n");
// Solo woff2 (todos los navegadores actuales); fuera los .woff de respaldo para no duplicar peso.
estilos = estilos.replace(/,\s*url\([^)]+\.woff\)\s*format\(["']woff["']\)/g, "");
estilos = estilos.replace(/url\((\.\.\/media\/[^)]+\.woff2)\)/g, (_, u) => `url(${media(u)})`);

const titulo = "Vista previa autonomIA Lab";
const pagina = `<title>${titulo}</title>
<style>
:root { color-scheme: dark; }
${estilos}
</style>
${vistas.join("\n")}
<script>
(() => {
  const vistas = [...document.querySelectorAll("[data-vista]")];
  const mostrar = () => {
    const actual = location.hash.slice(1) || "inicio";
    const existe = vistas.some((v) => v.dataset.vista === actual);
    vistas.forEach((v) => (v.hidden = v.dataset.vista !== (existe ? actual : "inicio")));
    window.scrollTo(0, 0);
  };
  addEventListener("hashchange", mostrar);
  mostrar();
  // Simula el aviso del formulario de acceso (el login real llega en el paso 3).
  document.querySelectorAll("form").forEach((f) =>
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      if (f.querySelector("[role=status]")) return;
      const p = document.createElement("p");
      p.setAttribute("role", "status");
      p.textContent = "El acceso de miembros estará disponible muy pronto.";
      p.style.cssText = "font-size:.8rem;color:var(--text-dim)";
      f.append(p);
    }),
  );
})();
</script>
`;

writeFileSync(salida, pagina);
console.log(`${salida}: ${(pagina.length / 1024).toFixed(0)} KB`);

// Sirve la web ya construida (`out/`) como lo hará GitHub Pages: /ruta/ → /ruta/index.html, 404.html si no existe.
// Uso: node scripts/servir.mjs [puerto]
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const raiz = join(process.cwd(), "out");
const puerto = Number(process.argv[2] ?? process.env.PORT ?? 3100);
const TIPOS = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".woff": "font/woff", ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://x");
  const ruta = decodeURIComponent(url.pathname);
  let archivo = normalize(join(raiz, ruta));
  if (!archivo.startsWith(raiz)) return res.writeHead(403).end();
  if (existsSync(archivo) && statSync(archivo).isDirectory()) {
    if (!ruta.endsWith("/")) return res.writeHead(301, { Location: `${url.pathname}/${url.search}` }).end();
    archivo = join(archivo, "index.html");
  }
  if (!existsSync(archivo)) {
    res.writeHead(404, { "Content-Type": TIPOS[".html"] });
    return createReadStream(join(raiz, "404.html")).pipe(res);
  }
  res.writeHead(200, { "Content-Type": TIPOS[extname(archivo)] ?? "application/octet-stream" });
  createReadStream(archivo).pipe(res);
}).listen(puerto, () => console.log(`Sirviendo out/ en http://localhost:${puerto}`));

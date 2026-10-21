import type { NextConfig } from "next";

// Web de páginas fijas para GitHub Pages (carpeta `out/`). Sin servidor: no hay redirecciones ni cabeceras propias
// (/registro lleva a /solicitar desde la propia página). Para volver a un servidor (Hetzner), ver docs/publicar.md.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
};

export default nextConfig;

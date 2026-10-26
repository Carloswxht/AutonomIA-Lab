import type { Metadata, Viewport } from "next";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/work-sans/400.css";
import "@fontsource/work-sans/600.css";
import "@fontsource/ibm-plex-mono/600.css";
import { Pie } from "@/components/Pie";
import "./globals.css";

// Las fuentes van dentro de la app (no se cargan desde Google) por RGPD.

export const metadata: Metadata = {
  metadataBase: new URL("https://autonomialab.es"),
  title: "autonomIA Lab — Esto puede hacer la IA por tu negocio",
  description:
    "Que tus clientes no tengan que esperar. Que te ahorres tiempo y dinero. Que tus tareas se hagan solas. Habla con un asesor y te decimos cómo.",
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "autonomIA Lab",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0A0B0D",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>
        {children}
        <Pie />
      </body>
    </html>
  );
}

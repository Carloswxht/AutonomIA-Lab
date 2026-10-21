import { notFound } from "next/navigation";
import { seccion, SECCIONES } from "@/lib/membresia";
import { Seccion } from "./Seccion";

// Páginas fijas: una por sección.
export function generateStaticParams() {
  return SECCIONES.map((s) => ({ seccion: s.clave }));
}
export const dynamicParams = false;

export default async function PaginaSeccion({ params }: PageProps<"/miembros/[seccion]">) {
  const { seccion: clave } = await params;
  if (!seccion(clave)) notFound();
  return <Seccion clave={clave} />;
}

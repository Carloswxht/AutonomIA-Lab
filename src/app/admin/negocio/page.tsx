import type { Metadata } from "next";
import { FichaNegocio } from "./FichaNegocio";

export const metadata: Metadata = { title: "Negocio — autonomIA Lab", robots: { index: false } };

// Dirección: /admin/negocio/?id=N (página fija: el número va en la dirección).
export default function PaginaNegocio() {
  return <FichaNegocio />;
}

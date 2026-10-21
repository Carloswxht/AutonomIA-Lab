import type { Metadata } from "next";
import { Confirmar } from "./Confirmar";

export const metadata: Metadata = { title: "Comprobando el enlace — autonomIA Lab", robots: { index: false } };

export default function PaginaConfirmar() {
  return <Confirmar />;
}

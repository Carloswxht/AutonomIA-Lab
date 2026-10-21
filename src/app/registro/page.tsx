import type { Metadata } from "next";
import { IrA } from "@/components/IrA";

export const metadata: Metadata = { title: "Solicitar acceso — autonomIA Lab", robots: { index: false } };

// Dirección antigua: ahora se pide acceso en /solicitar/.
export default function Registro() {
  return <IrA destino="/solicitar/" />;
}

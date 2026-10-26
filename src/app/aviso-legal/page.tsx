import type { Metadata } from "next";
import { PantallaCuenta } from "@/components/PantallaCuenta";

export const metadata: Metadata = { title: "Aviso legal — autonomIA Lab" };

// Texto pendiente: lo da Carlos (revisado por un asesor).
export default function AvisoLegal() {
  return <PantallaCuenta titulo="Aviso legal" intro="Estamos preparando este texto." />;
}

import type { Metadata } from "next";
import { PantallaCuenta } from "@/components/PantallaCuenta";

export const metadata: Metadata = { title: "Política de privacidad — autonomIA Lab" };

// Texto pendiente: lo da Carlos (revisado por un asesor).
export default function Privacidad() {
  return <PantallaCuenta titulo="Política de privacidad" intro="Estamos preparando este texto." />;
}

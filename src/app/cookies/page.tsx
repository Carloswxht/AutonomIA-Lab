import type { Metadata } from "next";
import { PantallaCuenta } from "@/components/PantallaCuenta";

export const metadata: Metadata = { title: "Política de cookies — autonomIA Lab" };

// Texto pendiente: lo da Carlos (revisado por un asesor).
export default function Cookies() {
  return <PantallaCuenta titulo="Política de cookies" intro="Estamos preparando este texto." />;
}

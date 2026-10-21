import type { Metadata } from "next";
import { Aviso } from "./Aviso";

export const metadata: Metadata = { title: "Correo confirmado — autonomIA Lab" };

export default function Confirmado() {
  return <Aviso />;
}

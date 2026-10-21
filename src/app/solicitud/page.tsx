import type { Metadata } from "next";
import { PantallaCuenta } from "@/components/PantallaCuenta";
import { FormularioNegocio } from "./FormularioNegocio";

export const metadata: Metadata = { title: "Solicitud recibida — autonomIA Lab", robots: { index: false } };

// Dirección: /solicitud/?t=CÓDIGO (la da «Solicitar acceso»).
export default function Solicitud() {
  return (
    <PantallaCuenta
      titulo="Solicitud recibida"
      intro="Tu acceso está pendiente de aprobación. Te escribiremos en breve al correo que nos has dado."
    >
      <FormularioNegocio />
    </PantallaCuenta>
  );
}

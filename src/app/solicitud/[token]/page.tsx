import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PantallaCuenta } from "@/components/PantallaCuenta";
import { FormularioNegocio } from "./FormularioNegocio";

export const metadata: Metadata = { title: "Solicitud recibida — autonomIA Lab", robots: { index: false } };

export default async function Solicitud({ params }: PageProps<"/solicitud/[token]">) {
  const { token } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(token)) notFound();

  return (
    <PantallaCuenta
      titulo="Solicitud recibida"
      intro="Tu acceso está pendiente de aprobación. Te escribiremos en breve al correo que nos has dado."
    >
      <FormularioNegocio token={token} />
    </PantallaCuenta>
  );
}

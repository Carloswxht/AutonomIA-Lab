import type { Metadata } from "next";
import { FormularioCuenta } from "@/components/FormularioCuenta";
import { PantallaCuenta } from "@/components/PantallaCuenta";

export const metadata: Metadata = { title: "Recuperar contraseña — autonomIA Lab" };

export default function Recuperar() {
  return (
    <PantallaCuenta titulo="¿Olvidaste tu contraseña?" intro="Escribe tu correo y te enviamos un enlace para poner una nueva.">
      <FormularioCuenta
        accion="recuperar"
        campos={["email"]}
        boton="Enviar enlace"
        enviando="Enviando…"
        hecho="Si {email} tiene cuenta, te llegará un correo con el enlace. Ábrelo en este mismo móvil."
      />
    </PantallaCuenta>
  );
}

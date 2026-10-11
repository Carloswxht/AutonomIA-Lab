import type { Metadata } from "next";
import { FormularioCuenta } from "@/components/FormularioCuenta";
import { PantallaCuenta } from "@/components/PantallaCuenta";
import { cambiarContrasena } from "../acciones";

export const metadata: Metadata = { title: "Nueva contraseña — autonomIA Lab" };

export default function NuevaContrasena() {
  return (
    <PantallaCuenta titulo="Nueva contraseña">
      <FormularioCuenta
        accion={cambiarContrasena}
        campos={["password", "password2"]}
        boton="Guardar contraseña"
        enviando="Guardando…"
        nota="Mínimo 8 caracteres."
      />
    </PantallaCuenta>
  );
}

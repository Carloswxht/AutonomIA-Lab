import type { Metadata } from "next";
import Link from "next/link";
import { FormularioCuenta } from "@/components/FormularioCuenta";
import { PantallaCuenta } from "@/components/PantallaCuenta";
import styles from "@/components/Cuenta.module.css";
import { crearCuenta } from "../acciones";

export const metadata: Metadata = { title: "Crear cuenta — autonomIA Lab" };

export default function Registro() {
  return (
    <PantallaCuenta titulo="Crear cuenta" intro="Gratis. Accedes a las aplicaciones útiles, el ranking y el blog.">
      <FormularioCuenta
        accion={crearCuenta}
        campos={["email", "password", "password2"]}
        boton="Crear cuenta"
        enviando="Creando…"
        nota="Mínimo 8 caracteres."
        hecho="Te hemos enviado un correo a {email}. Ábrelo y pulsa el enlace para confirmar tu cuenta. Si no lo ves, mira en spam."
      />
      <p className={styles.alternativa}>
        ¿Ya tienes cuenta? <Link href="/">Entrar</Link>
      </p>
    </PantallaCuenta>
  );
}

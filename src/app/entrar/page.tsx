import type { Metadata } from "next";
import Link from "next/link";
import { PantallaCuenta } from "@/components/PantallaCuenta";
import styles from "@/components/Cuenta.module.css";
import { FormularioEntrar } from "./FormularioEntrar";

export const metadata: Metadata = { title: "Acceso miembros — autonomIA Lab", robots: { index: false } };

// Antes estaba arriba de la portada; desde el 26 oct se llega con «Acceso miembros» del pie.
export default function Entrar() {
  return (
    <PantallaCuenta titulo="Acceso miembros" intro="Entra con tu correo y tu contraseña.">
      <FormularioEntrar />
      <p className={styles.alternativa}>
        ¿Aún no eres miembro? <Link href="/solicitar">Solicitar acceso</Link>
      </p>
      <p className={styles.alternativa}>
        <Link href="/recuperar">¿Olvidaste tu contraseña?</Link>
      </p>
    </PantallaCuenta>
  );
}

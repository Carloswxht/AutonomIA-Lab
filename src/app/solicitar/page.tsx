import type { Metadata } from "next";
import Link from "next/link";
import { FormularioCuenta } from "@/components/FormularioCuenta";
import { PantallaCuenta } from "@/components/PantallaCuenta";
import styles from "@/components/Cuenta.module.css";
import { solicitarAcceso } from "../acciones";

export const metadata: Metadata = { title: "Solicitar acceso — autonomIA Lab" };

export default function Solicitar() {
  return (
    <PantallaCuenta titulo="Solicitar acceso" intro="Déjanos tu correo. Revisamos cada solicitud y te avisamos cuando tu acceso esté listo.">
      <FormularioCuenta accion={solicitarAcceso} campos={["email"]} boton="Solicitar acceso" enviando="Enviando…" />
      <p className={styles.alternativa}>
        ¿Ya tienes acceso? <Link href="/">Entrar</Link>
      </p>
    </PantallaCuenta>
  );
}

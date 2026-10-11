import type { Metadata } from "next";
import Link from "next/link";
import { PantallaCuenta } from "@/components/PantallaCuenta";
import styles from "@/components/Cuenta.module.css";

export const metadata: Metadata = { title: "Correo confirmado — autonomIA Lab" };

export default async function Confirmado({ searchParams }: PageProps<"/confirmado">) {
  const { motivo } = await searchParams;
  if (motivo === "contrasena") {
    return (
      <PantallaCuenta titulo="El enlace no sirve">
        <p className={styles.intro}>
          Ha caducado o lo has abierto en otro navegador. Pide uno nuevo y ábrelo en este mismo móvil.
        </p>
        <Link href="/recuperar" className={styles.boton}>
          Pedir otro enlace
        </Link>
      </PantallaCuenta>
    );
  }
  if (motivo === "caducado") {
    return (
      <PantallaCuenta titulo="El enlace ha caducado">
        <p className={styles.intro}>
          Prueba a entrar con tu correo y tu contraseña. Si te dice que el correo no está confirmado, vuelve a crear la
          cuenta con el mismo correo y te llegará un enlace nuevo.
        </p>
        <Link href="/" className={styles.boton}>
          Entrar
        </Link>
      </PantallaCuenta>
    );
  }
  return (
    <PantallaCuenta titulo="Correo confirmado">
      <p className={styles.intro}>Ya puedes entrar con tu correo y tu contraseña.</p>
      <Link href="/" className={styles.boton}>
        Entrar
      </Link>
    </PantallaCuenta>
  );
}

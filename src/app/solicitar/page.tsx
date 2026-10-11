import type { Metadata } from "next";
import Link from "next/link";
import { Marca } from "@/components/Marca";
import { enlaceWhatsApp } from "@/lib/contacto";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Solicitar cuenta — autonomIA Lab",
};

// El formulario de solicitud (guardado en la base y aprobado por Carlos) llega en el paso 3.
export default function Solicitar() {
  return (
    <main className={styles.caja}>
      <Link href="/" aria-label="Volver a la portada">
        <Marca />
      </Link>
      <h1>Solicitar cuenta</h1>
      <p>
        Las cuentas se revisan una a una. Mientras preparamos el formulario, escríbenos y te damos acceso.
      </p>
      <a
        className={styles.boton}
        href={enlaceWhatsApp("Hola, quiero solicitar una cuenta en autonomIA Lab.")}
        target="_blank"
        rel="noopener noreferrer"
      >
        Solicitar por WhatsApp
      </a>
      <Link href="/" className={styles.volver}>
        ← Volver
      </Link>
    </main>
  );
}

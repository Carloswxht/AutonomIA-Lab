import type { Metadata } from "next";
import Link from "next/link";
import { Marca } from "@/components/Marca";
import { enlaceWhatsApp } from "@/lib/contacto";
import { FormularioSolicitud } from "./FormularioSolicitud";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Solicitar cuenta — autonomIA Lab",
};

export default function Solicitar() {
  return (
    <main className={styles.caja}>
      <Link href="/" aria-label="Volver a la portada">
        <Marca />
      </Link>
      <h1>Solicitar cuenta</h1>
      <p className={styles.intro}>Revisamos cada solicitud a mano y te contestamos por correo.</p>

      <FormularioSolicitud />

      <p className={styles.alternativa}>
        ¿Prefieres hablar?{" "}
        <a
          href={enlaceWhatsApp("Hola, quiero solicitar una cuenta en autonomIA Lab.")}
          target="_blank"
          rel="noopener noreferrer"
        >
          Escríbenos por WhatsApp
        </a>
      </p>
      <Link href="/" className={styles.volver}>
        ← Volver
      </Link>
    </main>
  );
}

import Link from "next/link";
import { Marca } from "@/components/Marca";
import { enlaceWhatsApp } from "@/lib/contacto";
import { FormularioEntrar } from "./FormularioEntrar";
import styles from "./page.module.css";

const MENSAJES = [
  "Que tus clientes nunca tengan que esperar.",
  "Que te ahorres tiempo y dinero.",
  "Que tus tareas se hagan solas, sin esperar a que tengas tiempo.",
];

export default function Portada() {
  return (
    <>
      <nav className={styles.arriba}>
        <div className={styles.wrap}>
          <Marca />
          <div className={styles.acceso}>
            <FormularioEntrar />
            <Link href="/solicitar" className={styles.solicitar}>
              ¿No tienes cuenta? <span>Solicitar acceso</span>
            </Link>
            <Link href="/recuperar" className={styles.olvido}>
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>
      </nav>

      <main className={styles.hero}>
        <div className={styles.halo} aria-hidden="true" />
        <div className={`${styles.wrap} ${styles.heroDentro}`}>
          <h1>Esto es lo que puede hacer la inteligencia artificial por tu negocio.</h1>

          <ul className={styles.mensajes}>
            {MENSAJES.map((m) => (
              <li key={m}>
                <span aria-hidden="true">→</span> {m}
              </li>
            ))}
          </ul>

          <a
            className={styles.asesor}
            href={enlaceWhatsApp("Hola, me gustaría hablar con un asesor de autonomIA Lab.")}
            target="_blank"
            rel="noopener noreferrer"
          >
            Habla con un asesor
          </a>
          <Link href="/servicios/" className={styles.verServicios}>
            Ver nuestros servicios <span aria-hidden="true">→</span>
          </Link>
        </div>
      </main>

      <footer className={styles.pie}>
        <p>autonomIA Lab — Paneles web con IA para autónomos, pymes y empresas en España.</p>
      </footer>
    </>
  );
}

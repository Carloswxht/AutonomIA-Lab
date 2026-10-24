import Link from "next/link";
import { Marca } from "@/components/Marca";
import { enlaceWhatsApp } from "@/lib/contacto";
import { PERFILES } from "@/lib/servicios";
import { FormularioEntrar } from "./FormularioEntrar";
import { ReenviarEnlace } from "./ReenviarEnlace";
import styles from "./page.module.css";

function IconoWhatsApp() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.whatsapp}>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7a2.8 2.8 0 0 0 1.9-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.2-.2-.4-.3Z" />
    </svg>
  );
}

export default function Portada() {
  return (
    <>
      <ReenviarEnlace />
      <nav className={styles.arriba}>
        <div className={styles.wrap}>
          <Marca />
          <p className={styles.miembros}>Miembros</p>
          <div className={styles.acceso}>
            <FormularioEntrar />
            <Link href="/solicitar" className={styles.solicitar}>
              ¿Aún no eres miembro? <span>Solicitar acceso</span>
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
          <h1>Nuestros servicios</h1>
          <p className={styles.lema}>Inteligencia artificial y aplicaciones a medida</p>

          <ul className={styles.perfiles}>
            {/* Enlace normal (no <Link>): la página de servicios lee ?para= al cargarse. */}
            {PERFILES.map((p) => (
              <li key={p.clave}>
                <a href={`/servicios/?para=${p.clave}`} className={styles.perfil}>
                  <span className={styles.perfilTexto}>
                    <strong>{p.boton}</strong>
                    <span>{p.detalle}</span>
                  </span>
                  <span className={styles.flecha} aria-hidden="true">
                    →
                  </span>
                </a>
              </li>
            ))}
          </ul>

          <a
            className={styles.asesor}
            href={enlaceWhatsApp("Hola, me gustaría hablar con un asesor de autonomIA Lab.")}
            target="_blank"
            rel="noopener noreferrer"
          >
            <IconoWhatsApp />
            Habla con un asesor
          </a>
        </div>
      </main>

      <footer className={styles.pie}>
        <p>autonomIA Lab — Inteligencia artificial y aplicaciones a medida para autónomos, pymes y empresas en España.</p>
      </footer>
    </>
  );
}

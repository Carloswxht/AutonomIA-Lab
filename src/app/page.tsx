import Link from "next/link";
import { Marca } from "@/components/Marca";
import { enlaceWhatsApp } from "@/lib/contacto";
import { PERFILES } from "@/lib/servicios";
import { FormularioEntrar } from "./FormularioEntrar";
import { ReenviarEnlace } from "./ReenviarEnlace";
import styles from "./page.module.css";

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

          <p className={styles.paraQuien}>¿Para quién es?</p>
          <div className={styles.perfiles}>
            {/* Enlace normal (no <Link>): la página de servicios lee ?para= al cargarse. */}
            {PERFILES.map((p) => (
              <a key={p.clave} href={`/servicios/?para=${p.clave}`} className={styles.perfil}>
                {p.boton}
              </a>
            ))}
          </div>

          <a
            className={styles.asesor}
            href={enlaceWhatsApp("Hola, me gustaría hablar con un asesor de autonomIA Lab.")}
            target="_blank"
            rel="noopener noreferrer"
          >
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

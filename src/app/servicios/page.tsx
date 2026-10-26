import type { Metadata } from "next";
import Link from "next/link";
import { Marca } from "@/components/Marca";
import { enlaceWhatsApp } from "@/lib/contacto";
import { Apps, Garantia } from "@/components/Apps";
import { PASOS } from "@/lib/servicios";
import { PorPerfil } from "./PorPerfil";
import styles from "./servicios.module.css";

export const metadata: Metadata = {
  title: "Nuestros servicios — autonomIA Lab",
  description:
    "Agentes de IA, automatizaciones, aplicaciones web y CRM a medida, páginas web profesionales y mantenimiento para autónomos, pymes y empresas en España.",
};

const DIAGNOSTICO = enlaceWhatsApp("Hola, quiero un diagnóstico de IA para mi negocio.");

const numero = (n: number) => String(n).padStart(2, "0");

export default function Servicios() {
  return (
    <div className={styles.pagina}>
      <header className={styles.cabecera}>
        <Link href="/" aria-label="Ir a la portada">
          <Marca />
        </Link>
        <a href={DIAGNOSTICO} target="_blank" rel="noopener noreferrer" className={styles.hablemos}>
          Hablemos
        </a>
      </header>

      <main>
        <PorPerfil
          comunes={
            <>
              <section className={styles.diferencia} aria-labelledby="t-diferencia">
                <h2 id="t-diferencia">¿Agente o automatización?</h2>
                <p className={styles.nota}>No son lo mismo. Te recomendamos uno, otro o los dos, según la tarea.</p>
                <div className={styles.comparar}>
                  <div>
                    <p className={styles.etiqueta}>Agente de IA</p>
                    <p className={styles.frase}>Entiende y decide.</p>
                    <p>Cada conversación es distinta y el agente elige qué responder o qué hacer.</p>
                    <p className={styles.ejemplo}>«¿Tenéis hueco el sábado para dos personas?»</p>
                  </div>
                  <div>
                    <p className={styles.etiqueta}>Automatización</p>
                    <p className={styles.frase}>Siempre los mismos pasos.</p>
                    <p>Cuando pasa algo, hace lo que se le ha dicho. Sin pensar y sin olvidarse.</p>
                    <p className={styles.ejemplo}>«Si entra un pedido, avisa al encargado y apúntalo.»</p>
                  </div>
                </div>
              </section>

              <div className={styles.grupo}>
                <Apps />
                <Garantia />
              </div>

              <section className={styles.grupo} aria-labelledby="t-pasos">
                <div className={styles.grupoCabeza}>
                  <h2 id="t-pasos">Cómo trabajamos</h2>
                  <p>Sabes en cada momento qué estamos haciendo.</p>
                </div>
                <ol className={styles.pasos}>
                  {PASOS.map((p, i) => (
                    <li key={p.titulo}>
                      <span className={styles.numero}>{numero(i + 1)}</span>
                      <div>
                        <h3>{p.titulo}</h3>
                        <p>{p.texto}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            </>
          }
        />
      </main>

    </div>
  );
}

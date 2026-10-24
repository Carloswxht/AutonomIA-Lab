"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { enlaceWhatsApp } from "@/lib/contacto";
import { GRUPOS, PERFILES, perfilDe, type Perfil } from "@/lib/servicios";
import styles from "./servicios.module.css";

// Perfil elegido (autónomos, pymes, empresas): sale de ?para= o, si no, de lo que el móvil recuerda.
// Sin perfil, la página se ve como siempre (por grupos). Cambiarlo no recarga la página.
const CLAVE = "servicios.perfil";
const avisos = new Set<() => void>();

function leer(): string | null {
  const url = new URLSearchParams(window.location.search).get("para");
  if (perfilDe(url)) return url;
  try {
    return perfilDe(localStorage.getItem(CLAVE)) ? localStorage.getItem(CLAVE) : null;
  } catch {
    return null;
  }
}

function elegir(clave: string | null) {
  try {
    if (clave) localStorage.setItem(CLAVE, clave);
    else localStorage.removeItem(CLAVE);
  } catch {
    // Sin almacenamiento (modo privado): solo vale para esta visita.
  }
  window.history.replaceState(null, "", clave ? `?para=${clave}` : window.location.pathname);
  avisos.forEach((a) => a());
}

function usePerfil(): Perfil | null {
  const clave = useSyncExternalStore(
    (aviso) => {
      avisos.add(aviso);
      return () => avisos.delete(aviso);
    },
    leer,
    () => null, // al construir la página fija se ve la versión para todos
  );
  return perfilDe(clave);
}

const DIAGNOSTICO = enlaceWhatsApp("Hola, quiero un diagnóstico de IA para mi negocio.");
const SERVICIOS = new Map(GRUPOS.flatMap((g) => g.servicios.map((s) => [s.titulo, s] as const)));
const INICIO = GRUPOS.map((_, i) => GRUPOS.slice(0, i).reduce((t, g) => t + g.servicios.length, 0));
const numero = (n: number) => String(n).padStart(2, "0");

function Check() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3.5 8.5l3 3 6-7" />
    </svg>
  );
}

function Selector({ perfil }: { perfil: Perfil | null }) {
  return (
    <div className={styles.perfiles}>
      <p className={styles.paraQuien}>¿Para quién es?</p>
      <div className={styles.perfilesBotones} role="group" aria-label="¿Para quién es?">
        {PERFILES.map((p) => (
          <button
            key={p.clave}
            type="button"
            aria-pressed={perfil?.clave === p.clave}
            className={styles.perfil}
            onClick={() => elegir(perfil?.clave === p.clave ? null : p.clave)}
          >
            {p.boton}
          </button>
        ))}
      </div>
      {perfil && (
        <button type="button" className={styles.verTodo} onClick={() => elegir(null)}>
          Ver la página para todos
        </button>
      )}
    </div>
  );
}

export function PorPerfil({ comunes }: { comunes: ReactNode }) {
  const perfil = usePerfil();

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.halo} aria-hidden="true" />
        <p className={styles.eyebrow}>Nuestros servicios{perfil ? ` · ${perfil.boton}` : ""}</p>
        {perfil ? (
          <>
            <h1>{perfil.titulo}</h1>
            <p className={styles.entrada}>{perfil.entrada}</p>
          </>
        ) : (
          <>
            <h1>
              La IA trabajando <span>en tu negocio</span>, no en una presentación.
            </h1>
            <p className={styles.entrada}>
              Agentes, automatizaciones y aplicaciones hechas a medida para autónomos, pymes y empresas en España. Te
              decimos qué merece la pena, lo construimos y lo mantenemos.
            </p>
          </>
        )}
        <Selector perfil={perfil} />
        <div className={styles.botones}>
          <a href={DIAGNOSTICO} target="_blank" rel="noopener noreferrer" className={styles.principal}>
            Pedir un diagnóstico
          </a>
          <a href="#servicios" className={styles.secundario}>
            Ver servicios
          </a>
        </div>
      </section>

      <div id="servicios" className={styles.contenido}>
        {perfil ? (
          <section className={styles.grupo} aria-labelledby="g-perfil">
            <div className={styles.grupoCabeza}>
              <h2 id="g-perfil">Lo que más te sirve, primero</h2>
              <p>Los mismos servicios para todos, ordenados para {perfil.boton.toLowerCase()}.</p>
            </div>
            <ul className={styles.rejilla}>
              {perfil.orden.map((o, i) => {
                const s = SERVICIOS.get(o.titulo)!;
                return (
                  <li key={o.titulo} className={styles.servicio}>
                    <span className={styles.numero}>{numero(i + 1)}</span>
                    <h3>{s.titulo}</h3>
                    <p className={styles.paraTi}>
                      <span>Para ti</span> {o.paraTi}
                    </p>
                    <p>{s.resumen}</p>
                    <ul className={styles.ejemplos}>
                      {s.ejemplos.map((e) => (
                        <li key={e}>
                          <Check />
                          {e}
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : (
          GRUPOS.map((g, gi) => (
            <section key={g.clave} className={styles.grupo} aria-labelledby={`g-${g.clave}`}>
              <div className={styles.grupoCabeza}>
                <h2 id={`g-${g.clave}`}>{g.titulo}</h2>
                <p>{g.intro}</p>
              </div>
              <ul className={styles.rejilla}>
                {g.servicios.map((s, si) => (
                  <li key={s.titulo} className={styles.servicio}>
                    <span className={styles.numero}>{numero(INICIO[gi] + si + 1)}</span>
                    <h3>{s.titulo}</h3>
                    <p>{s.resumen}</p>
                    <ul className={styles.ejemplos}>
                      {s.ejemplos.map((e) => (
                        <li key={e}>
                          <Check />
                          {e}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}

        {comunes}

        <section className={styles.final}>
          <h2>{perfil ? perfil.cierre.titulo : "¿Por dónde empezamos?"}</h2>
          <p>{perfil ? perfil.cierre.texto : "Cuéntanos qué te quita más tiempo y te decimos, sin compromiso, qué haríamos."}</p>
          <a
            href={perfil ? enlaceWhatsApp(perfil.cierre.mensaje) : DIAGNOSTICO}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.principal}
          >
            {perfil ? perfil.cierre.boton : "Escríbenos por WhatsApp"}
          </a>
        </section>
      </div>
    </>
  );
}

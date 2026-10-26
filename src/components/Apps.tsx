import { GARANTIA, PRODUCTOS_EN_MARCHA } from "@/lib/servicios";
import styles from "./Apps.module.css";

/** «Pruébalas ahora»: MultiBar y Gymbro con su precio y su demo. Va en la portada y en /servicios/. */
export function Apps({ id = "apps" }: { id?: string }) {
  return (
    <section id={id} className={styles.bloque} aria-labelledby={`${id}-titulo`}>
      <h2 id={`${id}-titulo`}>Pruébalas ahora</h2>
      <ul className={styles.rejilla}>
        {PRODUCTOS_EN_MARCHA.map((p) => (
          <li key={p.nombre} className={styles.app}>
            <span className={styles.badge}>Pruébala</span>
            <h3>{p.nombre}</h3>
            <p className={styles.para}>{p.para}</p>
            <p>{p.resumen}</p>
            {p.precio && <p className={styles.precio}>{p.precio}</p>}
            <a href={p.url} target="_blank" rel="noopener noreferrer" className={styles.demo} aria-label={`Ver la demo de ${p.nombre}`}>
              Ver la demo →
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** «Sin letra pequeña»: lo que prometemos a cualquier cliente. */
export function Garantia() {
  return (
    <section className={styles.garantia} aria-labelledby="garantia-titulo">
      <h2 id="garantia-titulo">Sin letra pequeña</h2>
      <ul>
        {GARANTIA.map((g) => (
          <li key={g}>
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3.5 8.5l3 3 6-7" />
            </svg>
            {g}
          </li>
        ))}
      </ul>
    </section>
  );
}

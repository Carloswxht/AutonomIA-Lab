import Link from "next/link";
import { Marca } from "./Marca";
import styles from "./Pie.module.css";

export const CORREO = "hola@autonomialab.es";

/** Pie de todas las páginas: textos legales, correo y el acceso de miembros (antes arriba de la portada). */
export function Pie() {
  return (
    <footer className={styles.pie}>
      <Marca />
      <nav aria-label="Legal" className={styles.legal}>
        <Link href="/aviso-legal">Aviso legal</Link>
        <Link href="/privacidad">Política de privacidad</Link>
        <Link href="/cookies">Política de cookies</Link>
      </nav>
      <a href={`mailto:${CORREO}`} className={styles.correo}>
        {CORREO}
      </a>
      <Link href="/entrar" className={styles.miembros}>
        Acceso miembros
      </Link>
    </footer>
  );
}

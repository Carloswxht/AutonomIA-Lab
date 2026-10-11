import Link from "next/link";
import type { ReactNode } from "react";
import { Marca } from "./Marca";
import styles from "./Cuenta.module.css";

/** Marco común de las pantallas de cuenta (crear cuenta, recuperar, nueva contraseña…). */
export function PantallaCuenta({ titulo, intro, children }: { titulo: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <main className={styles.caja}>
      <Link href="/" aria-label="Volver a la portada">
        <Marca />
      </Link>
      <h1>{titulo}</h1>
      {intro && <p className={styles.intro}>{intro}</p>}
      {children}
      <Link href="/" className={styles.volver}>
        ← Volver
      </Link>
    </main>
  );
}

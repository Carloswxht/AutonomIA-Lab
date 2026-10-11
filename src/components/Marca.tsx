import styles from "./Marca.module.css";

/** Marca en pantalla: [autonomIA Lab] con cursor parpadeante. */
export function Marca() {
  return (
    <span className={styles.marca} aria-label="autonomIA Lab">
      autonomIA Lab
      <span className={styles.cursor} aria-hidden="true" />
    </span>
  );
}

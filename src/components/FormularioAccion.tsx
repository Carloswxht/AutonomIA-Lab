"use client";

import { useActionState, type ReactNode } from "react";
import type { EstadoFormulario } from "@/app/acciones";
import styles from "./FormularioAccion.module.css";

type Props = {
  accion: (previo: EstadoFormulario, f: FormData) => Promise<EstadoFormulario>;
  boton: string;
  enviando?: string;
  hecho?: string;
  variante?: "principal" | "secundario" | "peligro";
  className?: string;
  /** Se llama cuando la acción sale bien (p. ej. para volver a leer la lista). */
  alTerminar?: () => void;
  children?: ReactNode;
};

/** Formulario que llama a una acción y muestra su error o su confirmación. */
export function FormularioAccion({ accion, boton, enviando, hecho, variante = "principal", className, alTerminar, children }: Props) {
  const [estado, ejecutar, pendiente] = useActionState(async (previo: EstadoFormulario, f: FormData) => {
    const r = await accion(previo, f);
    if (r.ok) alTerminar?.();
    return r;
  }, {});
  return (
    <form action={ejecutar} className={className}>
      {children}
      <button type="submit" disabled={pendiente} className={`${styles.boton} ${styles[variante]}`}>
        {pendiente ? (enviando ?? "Guardando…") : boton}
      </button>
      {estado.error && (
        <p role="alert" className={styles.error}>
          {estado.error}
        </p>
      )}
      {estado.ok && hecho && (
        <p role="status" className={styles.hecho}>
          {hecho}
        </p>
      )}
    </form>
  );
}

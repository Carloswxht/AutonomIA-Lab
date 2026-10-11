"use client";

import { useActionState } from "react";
import type { EstadoFormulario } from "@/app/acciones";
import styles from "./Cuenta.module.css";

type Campo = "email" | "password" | "password2";

const CAMPOS: Record<Campo, { etiqueta: string; tipo: string; autocompletar: string }> = {
  email: { etiqueta: "Correo", tipo: "email", autocompletar: "email" },
  password: { etiqueta: "Contraseña", tipo: "password", autocompletar: "new-password" },
  password2: { etiqueta: "Repite la contraseña", tipo: "password", autocompletar: "new-password" },
};

type Props = {
  accion: (previo: EstadoFormulario, f: FormData) => Promise<EstadoFormulario>;
  campos: Campo[];
  boton: string;
  enviando: string;
  /** Texto que sustituye al formulario cuando la acción sale bien ({email} se cambia por el correo). */
  hecho?: string;
  nota?: string;
};

export function FormularioCuenta({ accion, campos, boton, enviando, hecho, nota }: Props) {
  const [estado, ejecutar, pendiente] = useActionState(accion, {});

  if (estado.ok && hecho) {
    return (
      <p role="status" className={styles.hecho}>
        {hecho.replace("{email}", estado.email ?? "tu correo")}
      </p>
    );
  }

  return (
    <form className={styles.formulario} action={ejecutar}>
      {campos.map((c) => (
        <div key={c} className={styles.campo}>
          <label htmlFor={c}>{CAMPOS[c].etiqueta}</label>
          <input
            id={c}
            name={c}
            type={CAMPOS[c].tipo}
            autoComplete={CAMPOS[c].autocompletar}
            maxLength={c === "email" ? 254 : 72}
            // Tras un error se conserva el correo; las contraseñas se vuelven a escribir.
            defaultValue={c === "email" ? estado.email : undefined}
            required
          />
        </div>
      ))}
      {nota && <p className={styles.nota}>{nota}</p>}
      <button type="submit" disabled={pendiente}>
        {pendiente ? enviando : boton}
      </button>
      {estado.error && (
        <p role="alert" className={styles.error}>
          {estado.error}
        </p>
      )}
    </form>
  );
}

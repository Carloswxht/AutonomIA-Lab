"use client";

import { useActionState } from "react";
import { entrar, type EstadoFormulario } from "./acciones";
import styles from "./page.module.css";

export function FormularioEntrar() {
  const [estado, accion, enviando] = useActionState<EstadoFormulario, FormData>(entrar, {});

  return (
    <form className={styles.formulario} action={accion}>
      <label className={styles.oculto} htmlFor="email">
        Correo
      </label>
      <input id="email" name="email" type="text" inputMode="email" autoCapitalize="none" spellCheck={false} placeholder="Correo" autoComplete="username" required />
      <label className={styles.oculto} htmlFor="password">
        Contraseña
      </label>
      <input
        id="password"
        name="password"
        type="password"
        placeholder="Contraseña"
        autoComplete="current-password"
        required
      />
      <button type="submit" disabled={enviando}>
        {enviando ? "Entrando…" : "Entrar"}
      </button>
      {estado.error && (
        <p role="alert" className={styles.aviso}>
          {estado.error}
        </p>
      )}
    </form>
  );
}

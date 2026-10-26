"use client";

import { useActionState } from "react";
import styles from "@/components/Cuenta.module.css";
import { entrar, type EstadoFormulario } from "../acciones";

export function FormularioEntrar() {
  const [estado, accion, enviando] = useActionState<EstadoFormulario, FormData>(entrar, {});

  return (
    <form className={styles.formulario} action={accion}>
      <label htmlFor="email">Correo</label>
      <input id="email" name="email" type="text" inputMode="email" autoCapitalize="none" spellCheck={false} placeholder="Correo" autoComplete="username" required />
      <label htmlFor="password">Contraseña</label>
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
        <p role="alert" className={styles.error}>
          {estado.error}
        </p>
      )}
    </form>
  );
}

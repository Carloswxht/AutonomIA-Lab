"use client";

import { useState } from "react";
import styles from "./page.module.css";

// El login real (Supabase Auth a través de nuestro servidor) llega en el paso 3.
export function FormularioEntrar() {
  const [aviso, setAviso] = useState(false);

  return (
    <form
      className={styles.formulario}
      onSubmit={(e) => {
        e.preventDefault();
        setAviso(true);
      }}
    >
      <label className={styles.oculto} htmlFor="email">
        Correo
      </label>
      <input id="email" name="email" type="email" placeholder="Correo" autoComplete="username" required />
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
      <button type="submit">Entrar</button>
      {aviso && (
        <p role="status" className={styles.aviso}>
          El acceso de miembros estará disponible muy pronto.
        </p>
      )}
    </form>
  );
}

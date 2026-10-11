"use client";

import { useActionState } from "react";
import { solicitarCuenta, type EstadoFormulario } from "../acciones";
import styles from "./page.module.css";

export function FormularioSolicitud() {
  const [estado, accion, enviando] = useActionState<EstadoFormulario, FormData>(solicitarCuenta, {});

  if (estado.ok) {
    return (
      <p role="status" className={styles.hecho}>
        Solicitud enviada. La revisamos y te escribimos al correo que nos has dado.
      </p>
    );
  }

  return (
    <form className={styles.formulario} action={accion}>
      <label htmlFor="nombre">Nombre</label>
      <input id="nombre" name="nombre" autoComplete="name" maxLength={120} required />

      <label htmlFor="email">Correo</label>
      <input id="email" name="email" type="email" autoComplete="email" maxLength={254} required />

      <label htmlFor="empresa">
        Empresa <span>(opcional)</span>
      </label>
      <input id="empresa" name="empresa" autoComplete="organization" maxLength={120} />

      <label htmlFor="telefono">
        Teléfono <span>(opcional)</span>
      </label>
      <input id="telefono" name="telefono" type="tel" autoComplete="tel" maxLength={30} />

      <label htmlFor="mensaje">
        ¿A qué se dedica tu negocio? <span>(opcional)</span>
      </label>
      <textarea id="mensaje" name="mensaje" rows={3} maxLength={1000} />

      <button type="submit" disabled={enviando}>
        {enviando ? "Enviando…" : "Enviar solicitud"}
      </button>
      {estado.error && (
        <p role="alert" className={styles.error}>
          {estado.error}
        </p>
      )}
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { completarSolicitud, type EstadoFormulario } from "@/app/acciones";
import styles from "@/components/Cuenta.module.css";
import { SECTORES, TIPOS } from "@/lib/sectores";

/** Datos opcionales del negocio, después de pedir acceso. */
export function FormularioNegocio({ token }: { token: string }) {
  const [estado, ejecutar, pendiente] = useActionState<EstadoFormulario, FormData>(completarSolicitud, {});

  if (estado.ok) {
    return (
      <p role="status" className={styles.hecho}>
        Gracias. Con esto podremos preparar mejor tu acceso.
      </p>
    );
  }

  return (
    <form className={`${styles.formulario} ${styles.negocio}`} action={ejecutar}>
      <h2>Cuéntanos sobre tu negocio</h2>
      <p className={styles.nota}>Opcional. Nos ayuda a enseñarte lo que más te sirve.</p>
      <input type="hidden" name="token" value={token} />

      <fieldset className={styles.opciones}>
        <legend>Eres</legend>
        {TIPOS.map((t) => (
          <label key={t.valor}>
            <input type="radio" name="tipo" value={t.valor} />
            <span>{t.etiqueta}</span>
          </label>
        ))}
      </fieldset>

      <div className={styles.campo}>
        <label htmlFor="sector">Sector</label>
        <select id="sector" name="sector" defaultValue="">
          <option value="">Elige tu sector</option>
          {SECTORES.map((s) => (
            <option key={s} value={s.split(" (")[0]}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.campo}>
        <label htmlFor="nombre">Tu nombre</label>
        <input id="nombre" name="nombre" autoComplete="name" maxLength={120} />
      </div>

      <div className={styles.campo}>
        <label htmlFor="telefono">WhatsApp</label>
        <input id="telefono" name="telefono" type="tel" autoComplete="tel" maxLength={30} placeholder="Para escribirte cuando esté listo" />
      </div>

      <div className={styles.campo}>
        <label htmlFor="mensaje">¿Qué te gustaría mejorar en tu negocio?</label>
        <textarea id="mensaje" name="mensaje" rows={3} maxLength={1000} />
      </div>

      <button type="submit" disabled={pendiente}>
        {pendiente ? "Enviando…" : "Enviar"}
      </button>
      {estado.error && (
        <p role="alert" className={styles.error}>
          {estado.error}
        </p>
      )}
    </form>
  );
}

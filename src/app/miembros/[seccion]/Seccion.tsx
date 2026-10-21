"use client";

import Link from "next/link";
import { useEffect } from "react";
import { puedeVer, seccion } from "@/lib/membresia";
import { resumenMiembro } from "@/lib/miembro";
import { useYo } from "@/lib/sesion";
import styles from "../miembros.module.css";

// Las secciones aún no tienen contenido: se irán llenando en los próximos pasos.
export function Seccion({ clave }: { clave: string }) {
  const s = seccion(clave)!;
  const { accesoTotal } = resumenMiembro(useYo());
  const permitida = puedeVer(s, accesoTotal);

  useEffect(() => {
    if (!permitida) window.location.replace("/miembros/");
  }, [permitida]);
  if (!permitida) return null;

  return (
    <main className={styles.contenido}>
      <Link href="/miembros/" className={styles.volver}>
        ← Tu espacio
      </Link>
      <section className={styles.bienvenida}>
        <p className={styles.eyebrow}>Próximamente</p>
        <h1>{s.titulo}</h1>
        <p className={styles.correo}>{s.descripcion}</p>
      </section>
      <p className={styles.nota}>Estamos preparando esta sección. Te avisaremos cuando esté lista.</p>
    </main>
  );
}

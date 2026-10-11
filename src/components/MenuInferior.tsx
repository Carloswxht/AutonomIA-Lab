"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { salir } from "@/app/acciones";
import { enlaceWhatsApp } from "@/lib/contacto";
import styles from "./MenuInferior.module.css";

/** Barra inferior con menú hamburguesa (patrón de prototipos/miembros.html). */
export function MenuInferior({ superadmin }: { superadmin: boolean }) {
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    const cerrar = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    addEventListener("keydown", cerrar);
    return () => removeEventListener("keydown", cerrar);
  }, [abierto]);

  return (
    <>
      <div className={`${styles.velo} ${abierto ? styles.abierto : ""}`} onClick={() => setAbierto(false)} aria-hidden="true" />
      <div id="menu-miembros" className={`${styles.menu} ${abierto ? styles.abierto : ""}`} hidden={!abierto}>
        <p className={styles.eyebrow}>Menú</p>
        <Link href="/miembros" className={styles.item} onClick={() => setAbierto(false)}>
          <span className={styles.t}>Inicio</span>
          <span className={styles.d}>Tu panel de miembros</span>
        </Link>
        {superadmin && (
          <Link href="/admin" className={styles.item} onClick={() => setAbierto(false)}>
            <span className={styles.t}>Administración</span>
            <span className={styles.d}>Solicitudes, clientes y usuarios</span>
          </Link>
        )}
        <a
          href={enlaceWhatsApp("Hola, soy miembro de autonomIA Lab y me gustaría hablar con un asesor.")}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.item}
        >
          <span className={styles.t}>Hablar con un asesor</span>
          <span className={styles.d}>Por WhatsApp</span>
        </a>
        <form action={salir}>
          <button type="submit" className={styles.item}>
            <span className={styles.t}>Salir</span>
            <span className={styles.d}>Cerrar sesión en este dispositivo</span>
          </button>
        </form>
      </div>
      <nav className={styles.barra} aria-label="Menú principal">
        <button
          type="button"
          className={`${styles.hamburguesa} ${abierto ? styles.abierto : ""}`}
          aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={abierto}
          aria-controls="menu-miembros"
          onClick={() => setAbierto((a) => !a)}
        >
          <span />
          <span />
          <span />
        </button>
      </nav>
    </>
  );
}

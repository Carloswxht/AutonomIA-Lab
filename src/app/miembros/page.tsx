"use client";

import Link from "next/link";
import { enlaceWhatsApp } from "@/lib/contacto";
import { puedeVer, SECCIONES, type Seccion } from "@/lib/membresia";
import { resumenMiembro } from "@/lib/miembro";
import { panelPlataforma, PRODUCTOS, type Producto } from "@/lib/productos";
import { useYo } from "@/lib/sesion";
import styles from "./miembros.module.css";

function Icono({ trazos }: { trazos: string[] }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {trazos.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

function Tarjeta({ s, abierta }: { s: Seccion; abierta: boolean }) {
  const contenido = (
    <>
      <span className={styles.icono}>
        <Icono trazos={s.icono} />
      </span>
      <span className={styles.texto}>
        <h3>{s.titulo}</h3>
        <span>{s.descripcion}</span>
      </span>
      <span className={styles.badge}>{abierta ? "Activo" : "Subir plan"}</span>
    </>
  );
  return abierta ? (
    <Link href={`/miembros/${s.clave}/`} className={`${styles.tarjeta} ${styles.disponible}`}>
      {contenido}
    </Link>
  ) : (
    <a
      href={enlaceWhatsApp(`Hola, me interesa el acceso completo a autonomIA Lab (${s.titulo}).`)}
      target="_blank"
      rel="noopener noreferrer"
      className={`${styles.tarjeta} ${styles.premium}`}
    >
      {contenido}
    </a>
  );
}

function TarjetaApp({ p, url, detalle }: { p: Producto; url: string; detalle: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={`${styles.tarjeta} ${styles.app}`}>
      <span className={styles.texto}>
        <h3>{p.nombre}</h3>
        <span>{detalle}</span>
      </span>
      <span className={`${styles.badge} ${styles.abrir}`}>Abrir</span>
    </a>
  );
}

export default function Miembros() {
  const { nombre, email, superadmin, negocio, aplicaciones, accesoTotal } = resumenMiembro(useYo());
  const saludo = nombre ? `Hola, ${nombre.split(" ")[0]}` : "Hola";

  return (
    <main className={styles.contenido}>
      <section className={styles.bienvenida}>
        <p className={styles.eyebrow}>{accesoTotal ? "Acceso completo" : "Cuenta gratuita"}</p>
        <h1>{saludo}</h1>
        <p className={styles.correo}>{email}</p>
      </section>

      {superadmin && (
        <section aria-labelledby="t-apps">
          <h2 id="t-apps" className={styles.titulo}>
            Paneles de plataforma
          </h2>
          <ul className={styles.lista}>
            {PRODUCTOS.map((p) => (
              <li key={p.clave}>
                <TarjetaApp p={p} url={panelPlataforma(p.clave)} detalle={`Negocios, aspecto y opciones de ${p.nombre}`} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {negocio && (
        <section aria-labelledby="t-apps">
          <h2 id="t-apps" className={styles.titulo}>
            Tus aplicaciones · {negocio}
          </h2>
          {aplicaciones.length === 0 ? (
            <p className={styles.nota}>Tu aplicación se está preparando. Te avisaremos cuando esté lista.</p>
          ) : (
            <ul className={styles.lista}>
              {aplicaciones.map((p) => (
                <li key={p.clave}>
                  <TarjetaApp p={p} url={p.url} detalle={p.descripcion} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section aria-labelledby="t-contenido">
        <h2 id="t-contenido" className={styles.titulo}>
          Tu espacio
        </h2>
        <ul className={styles.lista}>
          <li>
            <Link href="/servicios/" className={`${styles.tarjeta} ${styles.disponible} ${styles.destacada}`}>
              <span className={styles.icono}>
                <Icono trazos={["M12 2l2.4 5.6L20 8.3l-4.2 3.9 1.2 5.8L12 15l-5 3 1.2-5.8L4 8.3l5.6-.7z"]} />
              </span>
              <span className={styles.texto}>
                <h3>Nuestros servicios</h3>
                <span>Agentes de IA, automatizaciones, aplicaciones y CRM a medida.</span>
              </span>
              <span className={`${styles.badge} ${styles.abrir}`}>Ver</span>
            </Link>
          </li>
          {SECCIONES.map((s) => (
            <li key={s.clave}>
              <Tarjeta s={s} abierta={puedeVer(s, accesoTotal)} />
            </li>
          ))}
        </ul>
        {!accesoTotal && (
          <p className={styles.nota}>
            Las secciones con «Subir plan» se incluyen al contratar una aplicación para tu negocio. Tócalas y te lo
            contamos por WhatsApp.
          </p>
        )}
      </section>
    </main>
  );
}

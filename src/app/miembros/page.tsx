import Link from "next/link";
import { enlaceWhatsApp } from "@/lib/contacto";
import { puedeVer, SECCIONES, type Seccion } from "@/lib/membresia";
import { datosMiembro } from "@/lib/miembro";
import styles from "./miembros.module.css";

const NOMBRE_MODULO: Record<string, string> = { hosteleria: "Hostelería" };

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
    <Link href={`/miembros/${s.clave}`} className={`${styles.tarjeta} ${styles.disponible}`}>
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

export default async function Miembros() {
  const { nombre, user, espacios, accesoTotal } = await datosMiembro();
  const saludo = nombre ? `Hola, ${nombre.split(" ")[0]}` : "Hola";

  return (
    <main className={styles.contenido}>
      <section className={styles.bienvenida}>
        <p className={styles.eyebrow}>{accesoTotal ? "Acceso completo" : "Cuenta gratuita"}</p>
        <h1>{saludo}</h1>
        <p className={styles.correo}>{user.email}</p>
      </section>

      {espacios.length > 0 && (
        <section aria-labelledby="t-apps">
          <h2 id="t-apps" className={styles.titulo}>
            Tus aplicaciones
          </h2>
          <ul className={styles.lista}>
            {espacios.map((e) => (
              <li key={e.id} className={`${styles.tarjeta} ${styles.app}`}>
                <span className={styles.texto}>
                  <h3>{e.nombre}</h3>
                  <span>
                    {e.modulos.length ? e.modulos.map((m) => NOMBRE_MODULO[m] ?? m).join(" · ") : "Sin módulos activos todavía"}
                  </span>
                </span>
                <span className={`${styles.badge} ${styles.preparacion}`}>En preparación</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="t-contenido">
        <h2 id="t-contenido" className={styles.titulo}>
          Tu espacio
        </h2>
        <ul className={styles.lista}>
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

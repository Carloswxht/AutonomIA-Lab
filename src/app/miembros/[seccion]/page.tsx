import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { puedeVer, seccion } from "@/lib/membresia";
import { datosMiembro } from "@/lib/miembro";
import styles from "../miembros.module.css";

// Las secciones aún no tienen contenido: se irán llenando en los próximos pasos.
export default async function Seccion({ params }: PageProps<"/miembros/[seccion]">) {
  const { seccion: clave } = await params;
  const s = seccion(clave);
  if (!s) notFound();
  const { accesoTotal } = await datosMiembro();
  if (!puedeVer(s, accesoTotal)) redirect("/miembros");

  return (
    <main className={styles.contenido}>
      <Link href="/miembros" className={styles.volver}>
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

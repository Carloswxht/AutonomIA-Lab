import type { Metadata } from "next";
import Link from "next/link";
import { Marca } from "@/components/Marca";
import { ConSesion } from "@/lib/sesion";
import { Salir } from "./Salir";
import styles from "./admin.module.css";

export const metadata: Metadata = {
  title: "Administración — autonomIA Lab",
  robots: { index: false },
};

export default function LayoutAdmin({ children }: LayoutProps<"/admin">) {
  return (
    <div className={styles.pagina}>
      <header className={styles.cabecera}>
        <Link href="/admin/">
          <Marca />
        </Link>
        <span className={styles.eyebrow}>Administración</span>
      </header>
      <ConSesion requiere="plataforma">
        {children}
        <nav className={styles.pie} aria-label="Navegación">
          <Link href="/admin/">Panel</Link>
          <Link href="/miembros/">Mi cuenta</Link>
          <Salir />
        </nav>
      </ConSesion>
    </div>
  );
}

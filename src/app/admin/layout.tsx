import type { Metadata } from "next";
import Link from "next/link";
import { Marca } from "@/components/Marca";
import { exigirSuperadmin } from "@/lib/sesion";
import { salir } from "../acciones";
import styles from "./admin.module.css";

export const metadata: Metadata = {
  title: "Administración — autonomIA Lab",
  robots: { index: false },
};

export default async function LayoutAdmin({ children }: LayoutProps<"/admin">) {
  await exigirSuperadmin();
  return (
    <div className={styles.pagina}>
      <header className={styles.cabecera}>
        <Link href="/admin">
          <Marca />
        </Link>
        <span className={styles.eyebrow}>Administración</span>
      </header>
      {children}
      <nav className={styles.pie} aria-label="Navegación">
        <Link href="/admin">Panel</Link>
        <Link href="/miembros">Mi cuenta</Link>
        <form action={salir}>
          <button type="submit">Salir</button>
        </form>
      </nav>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Marca } from "@/components/Marca";
import { MenuInferior } from "@/components/MenuInferior";
import { ConSesion } from "@/lib/sesion";
import styles from "./miembros.module.css";

export const metadata: Metadata = { title: "Panel de miembros — autonomIA Lab", robots: { index: false } };

export default function LayoutMiembros({ children }: LayoutProps<"/miembros">) {
  return (
    <div className={styles.pagina}>
      <header className={styles.cabecera}>
        <Link href="/miembros/" aria-label="Inicio del panel">
          <Marca />
        </Link>
        <p className={styles.sub}>
          Panel de <span>miembros</span>
        </p>
      </header>
      <ConSesion>
        {children}
        <MenuInferior />
      </ConSesion>
    </div>
  );
}

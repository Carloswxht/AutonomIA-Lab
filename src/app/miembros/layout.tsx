import type { Metadata } from "next";
import Link from "next/link";
import { Marca } from "@/components/Marca";
import { MenuInferior } from "@/components/MenuInferior";
import { datosMiembro } from "@/lib/miembro";
import styles from "./miembros.module.css";

export const metadata: Metadata = { title: "Panel de miembros — autonomIA Lab", robots: { index: false } };

export default async function LayoutMiembros({ children }: LayoutProps<"/miembros">) {
  const { superadmin } = await datosMiembro();
  return (
    <div className={styles.pagina}>
      <header className={styles.cabecera}>
        <Link href="/miembros" aria-label="Inicio del panel">
          <Marca />
        </Link>
        <p className={styles.sub}>
          Panel de <span>miembros</span>
        </p>
      </header>
      {children}
      <MenuInferior superadmin={superadmin} />
    </div>
  );
}

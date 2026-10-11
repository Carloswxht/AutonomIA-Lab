import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Marca } from "@/components/Marca";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { salir } from "../acciones";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Panel de miembros — autonomIA Lab",
};

type Membresia = {
  rol: string;
  organizaciones: { nombre: string; nombre_app: string | null } | null;
};

// Panel provisional del paso 3 (comprobar el login). Las tarjetas de miembros llegan en el paso 5.
export default async function Miembros() {
  const supabase = await crearClienteServidor().catch(() => null);
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!supabase || !user) redirect("/");

  const [{ data: perfil }, { data: membresias }] = await Promise.all([
    supabase.from("perfiles").select("nombre, es_superadmin").eq("id", user.id).maybeSingle(),
    supabase.from("miembros").select("rol, organizaciones(nombre, nombre_app)").eq("usuario_id", user.id),
  ]);
  const empresas = (membresias ?? []) as unknown as Membresia[];

  return (
    <main className={styles.caja}>
      <Marca />
      <h1>Hola{perfil?.nombre ? `, ${perfil.nombre}` : ""}</h1>
      <p className={styles.dato}>{user.email}</p>
      {perfil?.es_superadmin && <p className={styles.insignia}>Administrador de autonomIA Lab</p>}

      <section className={styles.bloque} aria-labelledby="t-empresas">
        <h2 id="t-empresas">Tus empresas</h2>
        {empresas.length === 0 ? (
          <p className={styles.vacio}>Todavía no perteneces a ninguna empresa.</p>
        ) : (
          <ul>
            {empresas.map((m, i) => (
              <li key={i}>
                <span>{m.organizaciones?.nombre_app ?? m.organizaciones?.nombre}</span>
                <span className={styles.rol}>{m.rol === "admin" ? "Administrador" : "Empleado"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form action={salir}>
        <button type="submit" className={styles.salir}>
          Salir
        </button>
      </form>
    </main>
  );
}

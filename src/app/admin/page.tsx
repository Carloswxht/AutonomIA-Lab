import Link from "next/link";
import { FormularioAccion } from "@/components/FormularioAccion";
import { exigirSuperadmin } from "@/lib/sesion";
import { nuevoCliente } from "./acciones";
import styles from "./admin.module.css";

const fecha = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", timeZone: "Europe/Madrid" });

type Usuario = { id: string; email: string; creado_en: string; confirmado: boolean; empresas: number };

export default async function Admin() {
  const { supabase } = await exigirSuperadmin();
  const [{ data: usuarios }, { data: clientes }] = await Promise.all([
    supabase.rpc("admin_usuarios"),
    supabase
      .from("organizaciones")
      .select("id, nombre, nombre_app, estado, organizacion_modulos(modulo, activo), miembros(count)")
      .order("creado_en", { ascending: false }),
  ]);
  const registrados = (usuarios ?? []) as Usuario[];
  const lista = clientes ?? [];
  const activos = lista.filter((e) => e.estado === "activa");

  return (
    <main className={styles.contenido}>
      <div className={styles.kpis}>
        <div className={styles.kpi}>
          <span>Usuarios</span>
          <strong>{registrados.length}</strong>
        </div>
        <div className={styles.kpi}>
          <span>Clientes activos</span>
          <strong className={activos.length ? styles.azul : undefined}>{activos.length}</strong>
        </div>
      </div>

      <section aria-labelledby="t-clientes">
        <h2 id="t-clientes" className={styles.titulo}>
          Clientes
        </h2>
        <FormularioAccion accion={nuevoCliente} boton="Dar de alta" enviando="Creando…" className={`${styles.formulario} ${styles.nueva}`}>
          <label htmlFor="cliente-email">Nuevo cliente: su correo</label>
          <input id="cliente-email" name="email" type="email" required maxLength={254} placeholder="El correo con el que se registró" />
          <label htmlFor="cliente-nombre">
            Nombre del negocio <span className={styles.opcional}>(opcional, lo puedes poner después)</span>
          </label>
          <input id="cliente-nombre" name="nombre" maxLength={120} />
        </FormularioAccion>

        {lista.length > 0 && (
          <ul className={`${styles.lista} ${styles.separado}`}>
            {lista.map((e) => {
              const modulos = (e.organizacion_modulos ?? []).filter((m) => m.activo).length;
              const personas = (e.miembros as unknown as { count: number }[])?.[0]?.count ?? 0;
              return (
                <li key={e.id}>
                  <Link href={`/admin/empresas/${e.id}`} className={`${styles.tarjeta} ${styles.enlace}`}>
                    <div className={styles.filaTitulo}>
                      <h3>{e.nombre_app || e.nombre}</h3>
                      <span className={`${styles.badge} ${e.estado === "activa" ? styles.badgeVerde : styles.badgeGris}`}>
                        {e.estado === "activa" ? "Activo" : "Suspendido"}
                      </span>
                    </div>
                    <p className={styles.fecha}>
                      {modulos} {modulos === 1 ? "módulo" : "módulos"} · {personas} {personas === 1 ? "persona" : "personas"}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="t-usuarios">
        <h2 id="t-usuarios" className={styles.titulo}>
          Usuarios registrados
        </h2>
        {registrados.length === 0 ? (
          <p className={styles.vacio}>Nadie se ha registrado todavía.</p>
        ) : (
          <ul className={styles.lista}>
            {registrados.map((u) => (
              <li key={u.id} className={`${styles.tarjeta} ${styles.persona}`}>
                <div>
                  <p className={styles.mono}>{u.email}</p>
                  <p className={styles.fecha}>{fecha.format(new Date(u.creado_en))}</p>
                </div>
                <span
                  className={`${styles.badge} ${
                    u.empresas > 0 ? styles.badgeAzul : u.confirmado ? styles.badgeVerde : styles.badgeGris
                  }`}
                >
                  {u.empresas > 0 ? "Cliente" : u.confirmado ? "Gratis" : "Sin confirmar"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

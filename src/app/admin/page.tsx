import Link from "next/link";
import { FormularioAccion } from "@/components/FormularioAccion";
import { exigirSuperadmin } from "@/lib/sesion";
import { aprobarSolicitud, crearEmpresa, rechazarSolicitud } from "./acciones";
import styles from "./admin.module.css";

const fecha = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" });

export default async function Admin() {
  const { supabase } = await exigirSuperadmin();
  const [{ data: solicitudes }, { data: empresas }] = await Promise.all([
    supabase
      .from("solicitudes_cuenta")
      .select("id, nombre, email, empresa, telefono, mensaje, creado_en")
      .eq("estado", "pendiente")
      .order("creado_en", { ascending: false }),
    supabase
      .from("organizaciones")
      .select("id, nombre, slug, estado, organizacion_modulos(modulo, activo), miembros(count)")
      .order("creado_en", { ascending: false }),
  ]);
  const pendientes = solicitudes ?? [];
  const lista = empresas ?? [];
  const activas = lista.filter((e) => e.estado === "activa").length;

  return (
    <main className={styles.contenido}>
      <div className={styles.kpis}>
        <div className={styles.kpi}>
          <span>Solicitudes</span>
          <strong className={pendientes.length ? styles.azul : undefined}>{pendientes.length}</strong>
        </div>
        <div className={styles.kpi}>
          <span>Empresas activas</span>
          <strong>{activas}</strong>
        </div>
      </div>

      <section aria-labelledby="t-solicitudes">
        <h2 id="t-solicitudes" className={styles.titulo}>
          Solicitudes pendientes
        </h2>
        {pendientes.length === 0 ? (
          <p className={styles.vacio}>No hay solicitudes nuevas. Cuando alguien rellene «Solicitar cuenta», aparecerá aquí.</p>
        ) : (
          <ul className={styles.lista}>
            {pendientes.map((s) => (
              <li key={s.id} className={styles.tarjeta}>
                <div className={styles.filaTitulo}>
                  <h3>{s.nombre}</h3>
                  <span className={`${styles.badge} ${styles.badgeAzul}`}>Nueva</span>
                </div>
                <p className={styles.mono}>{s.email}</p>
                {s.telefono && <p className={styles.mono}>{s.telefono}</p>}
                {s.mensaje && <p className={styles.mensaje}>{s.mensaje}</p>}
                <p className={styles.fecha}>{fecha.format(new Date(s.creado_en))}</p>

                <FormularioAccion accion={aprobarSolicitud} boton="Aprobar y crear empresa" enviando="Creando…" className={styles.formulario}>
                  <input type="hidden" name="solicitud" value={s.id} />
                  <label htmlFor={`empresa-${s.id}`}>Nombre de la empresa</label>
                  <input id={`empresa-${s.id}`} name="empresa" defaultValue={s.empresa ?? s.nombre} maxLength={120} required />
                </FormularioAccion>
                <FormularioAccion accion={rechazarSolicitud} boton="Rechazar" enviando="Rechazando…" variante="peligro" hecho="Rechazada." className={styles.formularioLinea}>
                  <input type="hidden" name="solicitud" value={s.id} />
                </FormularioAccion>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="t-empresas">
        <h2 id="t-empresas" className={styles.titulo}>
          Empresas
        </h2>
        {lista.length === 0 ? (
          <p className={styles.vacio}>Todavía no hay empresas.</p>
        ) : (
          <ul className={styles.lista}>
            {lista.map((e) => {
              const modulos = (e.organizacion_modulos ?? []).filter((m) => m.activo).length;
              const personas = (e.miembros as unknown as { count: number }[])?.[0]?.count ?? 0;
              return (
                <li key={e.id}>
                  <Link href={`/admin/empresas/${e.id}`} className={`${styles.tarjeta} ${styles.enlace}`}>
                    <div className={styles.filaTitulo}>
                      <h3>{e.nombre}</h3>
                      <span className={`${styles.badge} ${e.estado === "activa" ? styles.badgeVerde : styles.badgeGris}`}>
                        {e.estado === "activa" ? "Activa" : "Suspendida"}
                      </span>
                    </div>
                    <p className={styles.mono}>/{e.slug}</p>
                    <p className={styles.fecha}>
                      {modulos} {modulos === 1 ? "módulo" : "módulos"} · {personas} {personas === 1 ? "persona" : "personas"}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <FormularioAccion accion={crearEmpresa} boton="Crear empresa" enviando="Creando…" variante="secundario" className={`${styles.formulario} ${styles.nueva}`}>
          <label htmlFor="nueva-empresa">Nueva empresa sin solicitud</label>
          <input id="nueva-empresa" name="nombre" placeholder="Nombre de la empresa" maxLength={120} required />
        </FormularioAccion>
      </section>
    </main>
  );
}

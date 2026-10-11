import Link from "next/link";
import { FormularioAccion } from "@/components/FormularioAccion";
import { exigirSuperadmin } from "@/lib/sesion";
import { etiquetaTipo } from "@/lib/sectores";
import { aprobarAcceso, nuevoCliente, rechazarAcceso } from "./acciones";
import styles from "./admin.module.css";

const fecha = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", timeZone: "Europe/Madrid" });
const fechaHora = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Madrid",
});
const enlaceWhatsApp = (telefono: string) => {
  const cifras = telefono.replace(/\D/g, "");
  return `https://wa.me/${cifras.length === 9 ? `34${cifras}` : cifras}`;
};

type Usuario = { id: string; email: string; creado_en: string; confirmado: boolean; empresas: number };

export default async function Admin() {
  const { supabase } = await exigirSuperadmin();
  const [{ data: solicitudes }, { data: usuarios }, { data: clientes }] = await Promise.all([
    supabase
      .from("solicitudes_acceso")
      .select("id, email, tipo, sector, nombre, telefono, mensaje, creado_en")
      .eq("estado", "pendiente")
      .order("creado_en", { ascending: false }),
    supabase.rpc("admin_usuarios"),
    supabase
      .from("organizaciones")
      .select("id, nombre, nombre_app, estado, organizacion_modulos(modulo, activo), miembros(count)")
      .order("creado_en", { ascending: false }),
  ]);
  const pendientes = solicitudes ?? [];
  const registrados = (usuarios ?? []) as Usuario[];
  const lista = clientes ?? [];
  const activos = lista.filter((e) => e.estado === "activa");

  return (
    <main className={styles.contenido}>
      <div className={styles.kpis}>
        <div className={styles.kpi}>
          <span>Solicitudes</span>
          <strong className={pendientes.length ? styles.azul : undefined}>{pendientes.length}</strong>
        </div>
        <div className={styles.kpi}>
          <span>Clientes activos</span>
          <strong className={activos.length ? styles.azul : undefined}>{activos.length}</strong>
        </div>
      </div>

      <section aria-labelledby="t-solicitudes">
        <h2 id="t-solicitudes" className={styles.titulo}>
          Solicitudes de acceso
        </h2>
        {pendientes.length === 0 ? (
          <p className={styles.vacio}>No hay solicitudes nuevas.</p>
        ) : (
          <ul className={styles.lista}>
            {pendientes.map((s) => {
              const detalles = [etiquetaTipo(s.tipo), s.sector].filter(Boolean).join(" · ");
              return (
                <li key={s.id} className={styles.tarjeta}>
                  <div className={styles.filaTitulo}>
                    <h3>{s.nombre ?? s.email}</h3>
                    <span className={`${styles.badge} ${styles.badgeAzul}`}>Pendiente</span>
                  </div>
                  {s.nombre && <p className={styles.mono}>{s.email}</p>}
                  {detalles && <p className={styles.mensaje}>{detalles}</p>}
                  {s.telefono && (
                    <a className={styles.whatsapp} href={enlaceWhatsApp(s.telefono)} target="_blank" rel="noopener noreferrer">
                      WhatsApp {s.telefono}
                    </a>
                  )}
                  {s.mensaje && <p className={styles.mensaje}>«{s.mensaje}»</p>}
                  <p className={styles.fecha}>{fechaHora.format(new Date(s.creado_en))}</p>
                  <div className={styles.acciones}>
                    <FormularioAccion accion={aprobarAcceso} boton="Aprobar" enviando="Aprobando…" hecho="Aprobada.">
                      <input type="hidden" name="solicitud" value={s.id} />
                    </FormularioAccion>
                    <FormularioAccion accion={rechazarAcceso} boton="Rechazar" enviando="Rechazando…" variante="peligro" hecho="Rechazada.">
                      <input type="hidden" name="solicitud" value={s.id} />
                    </FormularioAccion>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="t-clientes">
        <h2 id="t-clientes" className={styles.titulo}>
          Clientes
        </h2>
        <FormularioAccion accion={nuevoCliente} boton="Dar de alta" enviando="Creando…" className={`${styles.formulario} ${styles.nueva}`}>
          <label htmlFor="cliente-email">Nuevo cliente: su correo</label>
          <input id="cliente-email" name="email" type="email" required maxLength={254} placeholder="El correo con el que tiene acceso" />
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
          Usuarios con acceso ({registrados.length})
        </h2>
        {registrados.length === 0 ? (
          <p className={styles.vacio}>Nadie tiene acceso todavía.</p>
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
                    u.empresas > 0 ? styles.badgeAzul : styles.badgeVerde
                  }`}
                >
                  {u.empresas > 0 ? "Cliente" : "Gratis"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

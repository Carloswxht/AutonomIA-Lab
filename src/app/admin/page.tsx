"use client";

import Link from "next/link";
import { FormularioAccion } from "@/components/FormularioAccion";
import { panelPlataforma, producto, PRODUCTOS } from "@/lib/productos";
import { supabase } from "@/lib/supabase/cliente";
import { useDatos } from "@/lib/useDatos";
import { etiquetaTipo } from "@/lib/sectores";
import { aprobarAcceso, rechazarAcceso } from "./acciones";
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

type Solicitud = {
  id: string;
  email: string;
  tipo: string | null;
  sector: string | null;
  nombre: string | null;
  telefono: string | null;
  mensaje: string | null;
  creado_en: string;
};
type Miembro = { auth_id: string; email: string; nombre: string | null; creado_en: string; ha_entrado: boolean; negocio: string | null };
type Dueno = { auth_id: string; email: string; nombre: string | null; negocio: string; ha_entrado: boolean };
type Negocio = { id: number; nombre: string; slug: string; tipo: string; activo: boolean; productos: string[]; personas: number };

const leer = () =>
  Promise.all([
    supabase().rpc("admin_solicitudes_autonomialab"),
    supabase().rpc("admin_miembros_autonomialab"),
    supabase().rpc("admin_clientes_autonomialab"),
    supabase().rpc("admin_duenos_web_autonomialab"),
  ]);

export default function Admin() {
  const [datos, recargar] = useDatos(leer);
  if (!datos) return <p className="cargando">Cargando…</p>;
  const [{ data: solicitudes }, { data: miembros }, { data: negocios }, { data: duenos }] = datos;
  const pendientes = (solicitudes ?? []) as Solicitud[];
  const registrados = (miembros ?? []) as Miembro[];
  const duenosWeb = (duenos ?? []) as Dueno[];
  const lista = (negocios ?? []) as Negocio[];
  const activos = lista.filter((n) => n.activo);

  return (
    <main className={styles.contenido}>
      <div className={styles.kpis}>
        <div className={styles.kpi}>
          <span>Solicitudes</span>
          <strong className={pendientes.length ? styles.azul : undefined}>{pendientes.length}</strong>
        </div>
        <div className={styles.kpi}>
          <span>Negocios activos</span>
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
                    <FormularioAccion accion={aprobarAcceso} boton="Aprobar" enviando="Aprobando…" hecho="Aprobada." alTerminar={recargar}>
                      <input type="hidden" name="solicitud" value={s.id} />
                    </FormularioAccion>
                    <FormularioAccion accion={rechazarAcceso} boton="Rechazar" enviando="Rechazando…" variante="peligro" hecho="Rechazada." alTerminar={recargar}>
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
          Negocios (clientes)
        </h2>
        <p className={styles.nota}>
          Los negocios se dan de alta en el panel de plataforma de cada producto:{" "}
          {PRODUCTOS.map((p, i) => (
            <span key={p.clave}>
              {i > 0 && " · "}
              <a href={panelPlataforma(p.clave)} target="_blank" rel="noopener noreferrer">
                {p.nombre}
              </a>
            </span>
          ))}
          . Aquí das acceso a la web a sus dueños.
        </p>

        {lista.length === 0 ? (
          <p className={styles.vacio}>Todavía no hay negocios.</p>
        ) : (
          <ul className={`${styles.lista} ${styles.separado}`}>
            {lista.map((n) => (
              <li key={n.id}>
                <Link href={`/admin/negocio/?id=${n.id}`} className={`${styles.tarjeta} ${styles.enlace}`}>
                  <div className={styles.filaTitulo}>
                    <h3>{n.nombre}</h3>
                    <span className={`${styles.badge} ${n.activo ? styles.badgeVerde : styles.badgeGris}`}>
                      {n.activo ? "Activo" : "De baja"}
                    </span>
                  </div>
                  <p className={styles.fecha}>
                    {n.productos.length ? n.productos.map((c) => producto(c).nombre).join(" · ") : "Sin productos"} ·{" "}
                    {n.personas} {n.personas === 1 ? "persona en la web" : "personas en la web"}
                  </p>
                </Link>
              </li>
            ))}
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
              <li key={u.auth_id} className={`${styles.tarjeta} ${styles.persona}`}>
                <div>
                  <p className={styles.mono}>{u.email}</p>
                  <p className={styles.fecha}>
                    {fecha.format(new Date(u.creado_en))}
                    {u.negocio ? ` · ${u.negocio}` : ""}
                    {u.ha_entrado ? "" : " · aún no ha entrado"}
                  </p>
                </div>
                <span className={`${styles.badge} ${u.negocio ? styles.badgeAzul : styles.badgeVerde}`}>
                  {u.negocio ? "Cliente" : "Gratis"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="t-duenos">
        <h2 id="t-duenos" className={styles.titulo}>
          Dueños con acceso automático ({duenosWeb.length})
        </h2>
        {duenosWeb.length === 0 ? (
          <p className={styles.vacio}>Ningún dueño entra todavía con la cuenta de su negocio.</p>
        ) : (
          <ul className={styles.lista}>
            {duenosWeb.map((d) => (
              <li key={d.auth_id} className={`${styles.tarjeta} ${styles.persona}`}>
                <div>
                  <p className={styles.mono}>{d.email}</p>
                  <p className={styles.fecha}>
                    {d.negocio}
                    {d.ha_entrado ? "" : " · aún no ha entrado"}
                  </p>
                </div>
                <span className={`${styles.badge} ${styles.badgeAzul}`}>Dueño</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

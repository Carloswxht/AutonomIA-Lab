"use client";

import Link from "next/link";
import { FormularioAccion } from "@/components/FormularioAccion";
import { panelPlataforma, producto } from "@/lib/productos";
import { useParametro } from "@/lib/sesion";
import { supabase } from "@/lib/supabase/cliente";
import { useDatos } from "@/lib/useDatos";
import { accesoDueno, anadirPersona, quitarPersona } from "../acciones";
import styles from "../admin.module.css";

type Ficha = {
  id: number;
  nombre: string;
  slug: string;
  tipo: string;
  activo: boolean;
  alta: string;
  titular: string | null;
  nif: string | null;
  correo_legal: string | null;
  telefono_legal: string | null;
  cuentas_app: number;
  productos: { producto: string; activo: boolean; desde: string }[];
  personas: { auth_id: string; email: string; nombre: string | null; rol: string }[];
  acceso_automatico: boolean;
  producto_dice_duenos: boolean;
  duenos: { auth_id: string; email: string; nombre: string | null; quitado: boolean }[];
};

const fecha = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Madrid" });

/** Ficha de un negocio (cliente). Sus datos, aspecto y personal se cambian en el panel de plataforma de su producto. */
export function FichaNegocio() {
  const id = useParametro("id");
  const valido = !!id && /^[1-9][0-9]{0,8}$/.test(id);
  const [ficha, recargar] = useDatos(
    async () =>
      valido ? ((await supabase().rpc("admin_cliente_autonomialab", { p_negocio: Number(id) })).data as Ficha | null) : null,
    [id],
  );

  if (id === undefined || (valido && ficha === undefined)) return <p className="cargando">Cargando…</p>;
  const n = ficha ?? null;
  if (!n)
    return (
      <main className={styles.contenido}>
        <Link href="/admin/" className={styles.volver}>
          ← Negocios
        </Link>
        <p className={styles.vacio}>Ese negocio no existe.</p>
      </main>
    );

  const datos = [
    ["Titular", n.titular],
    ["NIF/CIF", n.nif],
    ["Correo legal", n.correo_legal],
    ["Teléfono", n.telefono_legal],
  ].filter((d): d is [string, string] => Boolean(d[1]));

  return (
    <main className={styles.contenido}>
      <Link href="/admin/" className={styles.volver}>
        ← Negocios
      </Link>
      <h1 className={styles.h1}>{n.nombre}</h1>
      <p className={styles.mono}>
        /{n.slug} · {n.activo ? "activo" : "de baja"} · alta {fecha.format(new Date(n.alta))}
      </p>

      <section aria-labelledby="t-productos">
        <h2 id="t-productos" className={styles.titulo}>
          Productos
        </h2>
        {n.productos.length === 0 ? (
          <p className={styles.vacio}>No tiene productos contratados.</p>
        ) : (
          <ul className={styles.lista}>
            {n.productos.map((p) => {
              const info = producto(p.producto);
              return (
                <li key={p.producto} className={styles.tarjeta}>
                  <div className={styles.filaTitulo}>
                    <h3>{info.nombre}</h3>
                    <span className={`${styles.badge} ${p.activo ? styles.badgeVerde : styles.badgeGris}`}>
                      {p.activo ? "Activo" : "Apagado"}
                    </span>
                  </div>
                  {info.descripcion && <p className={styles.mensaje}>{info.descripcion}</p>}
                  <p className={styles.fecha}>
                    Desde {fecha.format(new Date(p.desde))} · {n.cuentas_app}{" "}
                    {n.cuentas_app === 1 ? "cuenta en la app" : "cuentas en la app"}
                  </p>
                  {panelPlataforma(p.producto) && (
                    <a className={styles.whatsapp} href={panelPlataforma(p.producto)} target="_blank" rel="noopener noreferrer">
                      Abrir su panel de plataforma
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {datos.length > 0 && (
        <section aria-labelledby="t-datos">
          <h2 id="t-datos" className={styles.titulo}>
            Datos legales
          </h2>
          <ul className={styles.lista}>
            {datos.map(([etiqueta, valor]) => (
              <li key={etiqueta} className={`${styles.tarjeta} ${styles.persona}`}>
                <p className={styles.fecha}>{etiqueta}</p>
                <p className={styles.mono}>{valor}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="t-duenos">
        <h2 id="t-duenos" className={styles.titulo}>
          Dueños: entran solos en la web
        </h2>
        <p className={styles.nota}>
          Las cuentas de administrador de la app de este negocio entran en autonomialab.es con su mismo correo y contraseña
          mientras el negocio esté activo y tenga un producto contratado.
        </p>
        {!n.producto_dice_duenos ? (
          <p className={styles.vacio}>Su producto aún no dice quién es el dueño: de momento nadie entra solo.</p>
        ) : n.duenos.length === 0 ? (
          <p className={styles.vacio}>La app de este negocio no tiene ninguna cuenta de administrador.</p>
        ) : (
          <ul className={styles.lista}>
            {n.duenos.map((d) => {
              const entra = n.acceso_automatico && !d.quitado;
              return (
                <li key={d.auth_id} className={styles.tarjeta}>
                  <div className={styles.filaTitulo}>
                    <h3>{d.nombre ?? d.email}</h3>
                    <span className={`${styles.badge} ${entra ? styles.badgeVerde : styles.badgeGris}`}>
                      {d.quitado ? "Acceso quitado" : entra ? "Entra" : "No entra"}
                    </span>
                  </div>
                  {d.nombre && <p className={styles.mono}>{d.email}</p>}
                  {!n.acceso_automatico && <p className={styles.fecha}>El negocio está de baja o sin producto activo.</p>}
                  <FormularioAccion
                    accion={accesoDueno}
                    boton={d.quitado ? "Devolver acceso" : "Quitar acceso"}
                    enviando={d.quitado ? "Devolviendo…" : "Quitando…"}
                    variante={d.quitado ? "secundario" : "peligro"}
                    className={styles.formularioLinea}
                    alTerminar={recargar}
                  >
                    <input type="hidden" name="negocio" value={n.id} />
                    <input type="hidden" name="persona" value={d.auth_id} />
                    <input type="hidden" name="quitar" value={d.quitado ? "0" : "1"} />
                  </FormularioAccion>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="t-personas">
        <h2 id="t-personas" className={styles.titulo}>
          Otras personas con acceso a la web
        </h2>
        {n.personas.length === 0 ? (
          <p className={styles.vacio}>Nadie de este negocio tiene acceso a la web todavía.</p>
        ) : (
          <ul className={styles.lista}>
            {n.personas.map((p) => (
              <li key={p.auth_id} className={styles.tarjeta}>
                <div className={styles.filaTitulo}>
                  <h3>{p.nombre ?? p.email}</h3>
                  <span className={`${styles.badge} ${p.rol === "admin" ? styles.badgeAzul : styles.badgeGris}`}>
                    {p.rol === "admin" ? "Dueño" : "Empleado"}
                  </span>
                </div>
                {p.nombre && <p className={styles.mono}>{p.email}</p>}
                <FormularioAccion
                  accion={quitarPersona}
                  boton="Quitar acceso"
                  enviando="Quitando…"
                  variante="peligro"
                  className={styles.formularioLinea}
                  alTerminar={recargar}
                >
                  <input type="hidden" name="negocio" value={n.id} />
                  <input type="hidden" name="persona" value={p.auth_id} />
                </FormularioAccion>
              </li>
            ))}
          </ul>
        )}
        <FormularioAccion accion={anadirPersona} boton="Dar acceso" hecho="Hecho." variante="secundario" className={`${styles.formulario} ${styles.nueva}`} alTerminar={recargar}>
          <input type="hidden" name="negocio" value={n.id} />
          <label htmlFor="email-persona">Correo</label>
          <input id="email-persona" name="email" type="text" inputMode="email" autoCapitalize="none" spellCheck={false} required maxLength={254} />
          <label htmlFor="rol-persona">Papel</label>
          <select id="rol-persona" name="rol" defaultValue="admin">
            <option value="admin">Dueño del negocio</option>
            <option value="empleado">Empleado</option>
          </select>
          <p className={styles.nota}>
            Para alguien con otro correo (no el de la app), con acceso a la web ya aprobado. Con esto ve «Tus aplicaciones» y
            tiene acceso completo.
            Las cuentas de la app (barra, socios…) se dan en el panel de plataforma del producto.
          </p>
        </FormularioAccion>
      </section>
    </main>
  );
}

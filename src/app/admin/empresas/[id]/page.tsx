import Link from "next/link";
import { notFound } from "next/navigation";
import { FormularioAccion } from "@/components/FormularioAccion";
import { exigirSuperadmin } from "@/lib/sesion";
import { anadirMiembro, cambiarModulo, guardarMarca } from "../../acciones";
import styles from "../../admin.module.css";

export default async function Empresa({ params }: PageProps<"/admin/empresas/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const { supabase } = await exigirSuperadmin();
  const [{ data: empresa }, { data: catalogo }, { data: activos }, { data: miembros }] = await Promise.all([
    supabase.from("organizaciones").select("*").eq("id", id).maybeSingle(),
    supabase.from("modulos").select("clave, nombre, descripcion").order("nombre"),
    supabase.from("organizacion_modulos").select("modulo, activo").eq("organizacion_id", id),
    supabase.rpc("admin_miembros", { p_org: id }),
  ]);
  if (!empresa) notFound();
  const activo = (clave: string) => (activos ?? []).some((m) => m.modulo === clave && m.activo);
  const primario = empresa.color_primario ?? "#3B82F6";
  const acento = empresa.color_acento ?? "#F3F4F6";

  return (
    <main className={styles.contenido}>
      <Link href="/admin" className={styles.volver}>
        ← Empresas
      </Link>
      <h1 className={styles.h1}>{empresa.nombre}</h1>
      <p className={styles.mono}>/{empresa.slug}</p>

      <section aria-labelledby="t-marca">
        <h2 id="t-marca" className={styles.titulo}>
          Marca
        </h2>
        <div className={styles.muestra} style={{ background: primario, color: acento }} aria-label="Muestra de la marca">
          {empresa.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={empresa.logo_url} alt="" width={36} height={36} />
          )}
          <strong>{empresa.nombre_app || empresa.nombre}</strong>
        </div>
        <FormularioAccion accion={guardarMarca} boton="Guardar marca" hecho="Guardado." className={styles.formulario}>
          <input type="hidden" name="empresa" value={empresa.id} />
          <label htmlFor="nombre">Nombre de la empresa</label>
          <input id="nombre" name="nombre" defaultValue={empresa.nombre} maxLength={120} required />
          <label htmlFor="nombre_app">Nombre de su app</label>
          <input id="nombre_app" name="nombre_app" defaultValue={empresa.nombre_app ?? ""} maxLength={60} placeholder={empresa.nombre} />
          <div className={styles.colores}>
            <div>
              <label htmlFor="color_primario">Color principal</label>
              <input id="color_primario" name="color_primario" type="color" defaultValue={primario} />
            </div>
            <div>
              <label htmlFor="color_acento">Color de acento</label>
              <input id="color_acento" name="color_acento" type="color" defaultValue={acento} />
            </div>
          </div>
          <label htmlFor="logo_url">Logo (dirección de la imagen)</label>
          <input id="logo_url" name="logo_url" type="url" defaultValue={empresa.logo_url ?? ""} placeholder="https://…" maxLength={500} />
          <label htmlFor="estado">Estado</label>
          <select id="estado" name="estado" defaultValue={empresa.estado}>
            <option value="activa">Activa</option>
            <option value="suspendida">Suspendida (sus usuarios dejan de verla)</option>
          </select>
        </FormularioAccion>
      </section>

      <section aria-labelledby="t-modulos">
        <h2 id="t-modulos" className={styles.titulo}>
          Módulos
        </h2>
        <ul className={styles.lista}>
          {(catalogo ?? []).map((m) => {
            const on = activo(m.clave);
            return (
              <li key={m.clave} className={styles.tarjeta}>
                <div className={styles.filaTitulo}>
                  <h3>{m.nombre}</h3>
                  <span className={`${styles.badge} ${on ? styles.badgeVerde : styles.badgeGris}`}>{on ? "Activo" : "Apagado"}</span>
                </div>
                {m.descripcion && <p className={styles.mensaje}>{m.descripcion}</p>}
                <FormularioAccion
                  accion={cambiarModulo}
                  boton={on ? "Apagar" : "Activar"}
                  variante={on ? "secundario" : "principal"}
                  className={styles.formularioLinea}
                >
                  <input type="hidden" name="empresa" value={empresa.id} />
                  <input type="hidden" name="modulo" value={m.clave} />
                  <input type="hidden" name="activo" value={on ? "no" : "si"} />
                </FormularioAccion>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="t-miembros">
        <h2 id="t-miembros" className={styles.titulo}>
          Personas
        </h2>
        {(miembros ?? []).length === 0 ? (
          <p className={styles.vacio}>Nadie tiene acceso todavía.</p>
        ) : (
          <ul className={styles.lista}>
            {(miembros ?? []).map((p: { usuario_id: string; email: string; nombre: string | null; rol: string }) => (
              <li key={p.usuario_id} className={`${styles.tarjeta} ${styles.persona}`}>
                <div>
                  <h3>{p.nombre ?? p.email}</h3>
                  {p.nombre && <p className={styles.mono}>{p.email}</p>}
                </div>
                <span className={`${styles.badge} ${p.rol === "admin" ? styles.badgeAzul : styles.badgeGris}`}>
                  {p.rol === "admin" ? "Admin" : "Empleado"}
                </span>
              </li>
            ))}
          </ul>
        )}
        <FormularioAccion accion={anadirMiembro} boton="Añadir persona" hecho="Añadida." variante="secundario" className={`${styles.formulario} ${styles.nueva}`}>
          <input type="hidden" name="empresa" value={empresa.id} />
          <label htmlFor="email-miembro">Correo</label>
          <input id="email-miembro" name="email" type="email" required maxLength={254} />
          <label htmlFor="rol-miembro">Papel</label>
          <select id="rol-miembro" name="rol" defaultValue="empleado">
            <option value="empleado">Empleado</option>
            <option value="admin">Administrador de la empresa</option>
          </select>
          <p className={styles.nota}>
            La persona tiene que tener ya usuario. Por ahora se crea en Supabase → Authentication → Users → Add user.
          </p>
        </FormularioAccion>
      </section>
    </main>
  );
}

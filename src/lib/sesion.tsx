"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { supabase } from "@/lib/supabase/cliente";

export type Cliente = { negocio_id: number; nombre: string; tipo: string; rol: string; productos: string[] };
/** Quién es en la web, según la base (`yo_autonomialab`). null = no tiene acceso (p. ej. cuenta de un negocio). */
export type Yo = { tipo: "plataforma" | "miembro"; nombre: string | null; email: string; cliente: Cliente | null };

/** Pregunta a la base quién es el usuario con sesión (null si no hay sesión o no es de la web). */
export async function consultarYo(): Promise<Yo | null> {
  const { data: sesion } = await supabase().auth.getSession();
  if (!sesion.session) return null;
  const { data, error } = await supabase().rpc("yo_autonomialab");
  if (error) throw new Error(error.message);
  return (data as Yo | null) ?? null;
}

const ContextoYo = createContext<Yo | null>(null);

/**
 * Deja ver lo de dentro solo con sesión (y, si se pide, solo a la cuenta de plataforma). Sin acceso, a la portada.
 * Es solo para la pantalla: cada función de la base vuelve a comprobar quién llama.
 */
export function ConSesion({ requiere = "miembro", children }: { requiere?: "miembro" | "plataforma"; children: ReactNode }) {
  const [yo, setYo] = useState<Yo | null>(null);

  useEffect(() => {
    let vivo = true;
    consultarYo()
      .catch(() => null)
      .then((r) => {
        if (!vivo) return;
        if (!r) return window.location.replace("/");
        if (requiere === "plataforma" && r.tipo !== "plataforma") return window.location.replace("/miembros/");
        setYo(r);
      });
    return () => {
      vivo = false;
    };
  }, [requiere]);

  if (!yo) return <p className="cargando">Cargando…</p>;
  return <ContextoYo.Provider value={yo}>{children}</ContextoYo.Provider>;
}

/** Quién es (solo dentro de <ConSesion>). */
export function useYo(): Yo {
  const yo = useContext(ContextoYo);
  if (!yo) throw new Error("useYo fuera de <ConSesion>");
  return yo;
}

/** Lee un parámetro de la dirección (?t=…) después de cargar la página (las páginas son fijas). */
export function useParametro(nombre: string): string | null | undefined {
  return useSyncExternalStore(
    sinCambios,
    () => new URLSearchParams(window.location.search).get(nombre),
    () => undefined, // al construir la página fija aún no hay dirección
  );
}
const sinCambios = () => () => {};

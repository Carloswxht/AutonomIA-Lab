"use client";

import { useEffect } from "react";

/** Lleva a otra página de la web (sustituye a las redirecciones del servidor). */
export function IrA({ destino }: { destino: string }) {
  useEffect(() => {
    window.location.replace(destino);
  }, [destino]);
  return null;
}

"use client";

import { useCallback, useEffect, useState } from "react";

/** Lee datos al abrir la página y cuando se pide `recargar()` (p. ej. tras guardar). `undefined` mientras carga. */
export function useDatos<T>(leer: () => Promise<T>, claves: unknown[] = []): [T | undefined, () => void] {
  const [datos, setDatos] = useState<T>();
  const [vuelta, setVuelta] = useState(0);
  useEffect(() => {
    let vivo = true;
    leer().then((d) => vivo && setDatos(d));
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vuelta, ...claves]);
  return [datos, useCallback(() => setVuelta((v) => v + 1), [])];
}

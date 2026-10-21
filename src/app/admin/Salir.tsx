"use client";

import { salir } from "../acciones";

export function Salir() {
  return (
    <form action={salir}>
      <button type="submit">Salir</button>
    </form>
  );
}

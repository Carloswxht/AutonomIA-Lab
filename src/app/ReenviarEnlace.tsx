"use client";

import { useEffect } from "react";

// Si un enlace de correo llega a la portada (Supabase pone la Site URL cuando no admite el redirectTo),
// se pasa tal cual a /auth/confirmar/, que es quien lo comprueba.
export function ReenviarEnlace() {
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("token_hash"))
      window.location.replace(`/auth/confirmar/${window.location.search}`);
  }, []);
  return null;
}

"use client";

import type { EmailOtpType } from "@supabase/supabase-js";
import { useEffect } from "react";
import { PantallaCuenta } from "@/components/PantallaCuenta";
import { rutaSegura } from "@/lib/registro";
import { supabase } from "@/lib/supabase/cliente";

// Destino de los enlaces de los correos. Las plantillas de Supabase (Authentication → Emails) apuntan aquí con
// token_hash, así el enlace funciona aunque se abra en otro navegador:
//   Magic link (acceso aprobado):  {{ .SiteURL }}/auth/confirmar/?token_hash={{ .TokenHash }}&type=magiclink
//   Reset password:                {{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery
// (RedirectTo es la página de cada producto; si Supabase no la admite, pone la Site URL y la portada reenvía aquí).
// También acepta ?code= (enlaces por defecto de Supabase, solo si se abren en el mismo navegador).
const TRAS_TIPO: Partial<Record<EmailOtpType, string>> = {
  magiclink: "/nueva-contrasena/",
  recovery: "/nueva-contrasena/",
};

export function Confirmar() {
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const code = p.get("code");
    const tokenHash = p.get("token_hash");
    const tipo = p.get("type") as EmailOtpType | null;
    const siguiente = rutaSegura(p.get("siguiente") ?? (tipo ? TRAS_TIPO[tipo] : null), "/miembros/");

    if (p.get("error_code") || p.get("error")) {
      window.location.replace("/confirmado/?motivo=caducado");
      return;
    }

    (async () => {
      try {
        const { error } =
          tokenHash && tipo
            ? await supabase().auth.verifyOtp({ token_hash: tokenHash, type: tipo })
            : code
              ? await supabase().auth.exchangeCodeForSession(code)
              : { error: new Error("Sin código") };
        if (!error) return window.location.replace(siguiente);
      } catch {
        // Se explica abajo.
      }
      const aviso = siguiente.startsWith("/nueva-contrasena") ? "?motivo=contrasena" : "";
      window.location.replace(`/confirmado/${aviso}`);
    })();
  }, []);

  return (
    <PantallaCuenta titulo="Un momento…">
      <p>Comprobando el enlace.</p>
    </PantallaCuenta>
  );
}

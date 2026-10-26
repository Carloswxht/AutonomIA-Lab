// =====================================================================
// autonomIA Lab · Edge Function «enviar-correo» (Supabase Auth → Send Email Hook)
// ---------------------------------------------------------------------
// Supabase la llama en lugar de mandar sus correos (cambiar contraseña, acceso aprobado, confirmar correo…).
// Aquí se pregunta a la base de qué negocio es la persona (public.marca_correo) y el correo sale con su nombre,
// su logo y sus colores, desde avisos@autonomialab.com y con el nombre del negocio como remitente. El botón lleva
// a la página que pidió el correo (redirect_to) con token_hash: esa página llama a verifyOtp.
// Si la base no responde, el correo sale igual con la imagen de autonomIA Lab: nunca se queda sin mandar.
//
// Secretos (Supabase → Edge Functions → Secrets; nunca en el repositorio):
//   SEND_EMAIL_HOOK_SECRET  el que da Supabase al crear el hook («v1,whsec_…»; lo pone Carlos)
//   RESEND_API_KEY          clave de Resend (ya está: la usan MultiBar y Gymbro)
//   CORREO_REMITENTE        opcional; por defecto avisos@autonomialab.com
// SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY los pone Supabase solo.
// Desplegar con verify_jwt = false: quien llama es Supabase Auth, y se comprueba con la firma del hook.
// Código en el repositorio AutonomIA-Lab: supabase/functions/enviar-correo/.
// =====================================================================

import { Webhook } from "npm:standardwebhooks@1.0.0";
import { correoDe, destinoCorreo, type Marca, montarEnlace, remitente } from "./plantilla.ts";

type Usuario = { id: string; email: string; new_email?: string };
type DatosCorreo = {
  token: string;
  token_hash: string;
  redirect_to: string;
  email_action_type: string;
  site_url: string;
  token_new: string;
  token_hash_new: string;
};

function json(status: number, cuerpo: unknown) {
  return new Response(JSON.stringify(cuerpo), { status, headers: { "Content-Type": "application/json" } });
}

async function marcaDe(authId: string): Promise<Marca> {
  const url = Deno.env.get("SUPABASE_URL");
  const clave = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !clave) return { marca: "autonomialab" };
  try {
    const r = await fetch(url + "/rest/v1/rpc/marca_correo", {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: clave, Authorization: "Bearer " + clave },
      body: JSON.stringify({ p_auth_id: authId }),
      signal: AbortSignal.timeout(4000),
    });
    if (!r.ok) throw new Error(`marca_correo ${r.status} ${await r.text()}`);
    const m = await r.json();
    return m && typeof m === "object" ? (m as Marca) : { marca: "autonomialab" };
  } catch (e) {
    console.error("marca_correo", e);
    return { marca: "autonomialab" };
  }
}

async function mandar(para: string, m: Marca, tipo: string, enlace?: string, codigo?: string, aviso?: string) {
  const correo = correoDe({ tipo, enlace, codigo, aviso }, m);
  if (!correo) return;
  const direccion = Deno.env.get("CORREO_REMITENTE") || "avisos@autonomialab.com";
  const responder = typeof m.responder_a === "string" && /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(m.responder_a) ? [m.responder_a] : undefined;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + Deno.env.get("RESEND_API_KEY") },
    body: JSON.stringify({
      from: remitente(m, direccion),
      to: [para],
      subject: correo.asunto,
      html: correo.html,
      text: correo.texto,
      ...(responder ? { reply_to: responder } : {}),
    }),
  });
  if (!r.ok) throw new Error(`Resend ${r.status} ${await r.text()}`);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json(405, { error: { http_code: 405, message: "Solo POST" } });
  const secreto = Deno.env.get("SEND_EMAIL_HOOK_SECRET");
  if (!secreto || !Deno.env.get("RESEND_API_KEY")) {
    console.error("Faltan los secretos SEND_EMAIL_HOOK_SECRET o RESEND_API_KEY");
    return json(500, { error: { http_code: 500, message: "Correo sin configurar" } });
  }

  let user: Usuario, email_data: DatosCorreo;
  try {
    const cuerpo = await req.text();
    ({ user, email_data } = new Webhook(secreto.replace("v1,whsec_", "")).verify(cuerpo, Object.fromEntries(req.headers)) as {
      user: Usuario;
      email_data: DatosCorreo;
    });
  } catch {
    return json(401, { error: { http_code: 401, message: "Firma no válida" } });
  }

  try {
    const tipo = email_data.email_action_type;
    const m = await marcaDe(user.id);
    const { destino, aviso } = destinoCorreo(email_data.redirect_to || email_data.site_url, m);
    if (tipo === "email_change") {
      // Ojo, Supabase cruza los nombres: token_hash_new va con el correo actual y token_hash con el nuevo.
      if (user.new_email && email_data.token_hash_new) {
        await mandar(user.email, m, tipo, montarEnlace(destino, email_data.token_hash_new, tipo));
        await mandar(user.new_email, m, tipo, montarEnlace(destino, email_data.token_hash, tipo));
      } else {
        await mandar(user.new_email || user.email, m, tipo, montarEnlace(destino, email_data.token_hash, tipo));
      }
    } else if (tipo === "reauthentication") {
      await mandar(user.email, m, tipo, undefined, email_data.token);
    } else {
      const enlace = email_data.token_hash ? montarEnlace(destino, email_data.token_hash, tipo) : undefined;
      await mandar(user.email, m, tipo, enlace, undefined, enlace ? aviso : undefined);
    }
  } catch (e) {
    console.error("enviar-correo", e);
    return json(500, { error: { http_code: 500, message: "No se pudo mandar el correo" } });
  }
  return json(200, {});
});

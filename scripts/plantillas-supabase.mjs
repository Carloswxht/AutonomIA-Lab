// Sube las plantillas de correo de supabase/plantillas/ a Supabase (Authentication → Emails) por la API de gestión.
// Solo cambia el cuerpo de «Magic Link» (acceso aprobado) y «Reset Password» (cambiar contraseña); los asuntos no se tocan.
// Necesita SUPABASE_ACCESS_TOKEN (token personal temporal, como secreto del entorno; borrarlo después) y
// api.supabase.com permitido en la red. Uso: node scripts/plantillas-supabase.mjs
import { readFile } from 'node:fs/promises';

const REF = 'dafmorfftnucsxcsafop';
const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) {
  console.error('Falta SUPABASE_ACCESS_TOKEN.');
  process.exit(1);
}

const leer = (nombre) => readFile(new URL(`../supabase/plantillas/${nombre}`, import.meta.url), 'utf8');
const cuerpo = {
  mailer_templates_magic_link_content: await leer('acceso-aprobado.html'),
  mailer_templates_recovery_content: await leer('cambiar-contrasena.html'),
};

const url = `https://api.supabase.com/v1/projects/${REF}/config/auth`;
const respuesta = await fetch(url, {
  method: 'PATCH',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(cuerpo),
});
if (!respuesta.ok) {
  console.error(`Error ${respuesta.status}: ${await respuesta.text()}`);
  process.exit(1);
}

const config = await respuesta.json();
for (const [clave, valor] of Object.entries(cuerpo)) {
  console.log(`${clave}: ${config[clave] === valor ? 'OK' : 'NO COINCIDE'}`);
}

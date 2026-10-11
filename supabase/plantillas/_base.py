# Genera las plantillas de correo de Supabase (Authentication → Emails) con el mismo diseño.
# Uso: python3 supabase/plantillas/_base.py  → escribe acceso-aprobado.html y cambiar-contrasena.html
# Correo HTML "a la antigua" (tablas y estilos en línea): es lo que respetan Gmail, Outlook y Apple Mail.
# Sin imágenes externas: la marca se dibuja con texto, así se ve aunque el lector bloquee imágenes.
import os

AQUI = os.path.dirname(os.path.abspath(__file__))

FONDO = "#0A0B0D"
TARJETA = "#121317"
BORDE = "#24262E"
TEXTO = "#F3F4F6"
TENUE = "#9BA1AE"
APAGADO = "#5C606C"
AZUL = "#3B82F6"
AZUL_VIVO = "#5B9CFF"
AZUL_SUAVE = "#132342"
AZUL_LINEA = "#1E3A63"
RESALTE = "#1A1C22"
TITULO = "'Space Grotesk','Segoe UI',Roboto,Helvetica,Arial,sans-serif"
CUERPO = "'Work Sans','Segoe UI',Roboto,Helvetica,Arial,sans-serif"
MONO = "'IBM Plex Mono',Menlo,Consolas,'Courier New',monospace"


def correo(preheader, etiqueta, titulo, parrafos, boton, enlace, extra_html, nota):
    p = "".join(
        f'<p style="margin:0 0 14px;font-family:{CUERPO};font-size:16px;line-height:1.6;color:{TENUE};">{t}</p>'
        for t in parrafos
    )
    return f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark light">
<meta name="supported-color-schemes" content="dark light">
<title>{titulo}</title>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@600&family=Space+Grotesk:wght@600&family=Work+Sans:wght@400;600&display=swap" rel="stylesheet">
<style>
  @media (max-width: 620px) {{ .caja {{ padding: 28px 22px !important; }} .titulo {{ font-size: 26px !important; }} }}
  a {{ color: {AZUL_VIVO}; }}
</style>
</head>
<body style="margin:0;padding:0;background:{FONDO};" bgcolor="{FONDO}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:{FONDO};">{preheader}&#8203;&#847;&#8203;&#847;&#8203;&#847;&#8203;&#847;&#8203;&#847;&#8203;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="{FONDO}" style="background:{FONDO};">
<tr><td align="center" style="padding:32px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
    <!-- Marca -->
    <tr><td style="padding:0 6px 22px;">
      <span style="font-family:{MONO};font-size:15px;font-weight:600;color:{APAGADO};">[</span><span style="font-family:{MONO};font-size:15px;font-weight:600;color:{AZUL_VIVO};">autonomIA Lab</span><span style="display:inline-block;width:7px;height:15px;margin-left:5px;vertical-align:-2px;background:{AZUL_VIVO};"></span><span style="font-family:{MONO};font-size:15px;font-weight:600;color:{APAGADO};">]</span>
    </td></tr>
    <!-- Tarjeta -->
    <tr><td bgcolor="{TARJETA}" style="background:{TARJETA};border:1px solid {BORDE};border-radius:18px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td height="4" bgcolor="{AZUL}" style="height:4px;line-height:4px;font-size:0;background:linear-gradient(90deg,{AZUL} 0%,{AZUL_VIVO} 60%,{TARJETA} 100%);border-radius:18px 18px 0 0;">&nbsp;</td></tr>
        <tr><td class="caja" style="padding:40px 40px 36px;">
          <p style="margin:0 0 18px;"><span style="display:inline-block;padding:5px 10px;border:1px solid #1E3A63;border-radius:6px;background:{AZUL_SUAVE};font-family:{MONO};font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:{AZUL_VIVO};">&middot; {etiqueta}</span></p>
          <h1 class="titulo" style="margin:0 0 18px;font-family:{TITULO};font-size:30px;line-height:1.15;font-weight:600;color:{TEXTO};">{titulo}</h1>
          {p}
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 12px;">
            <tr><td bgcolor="{AZUL}" style="border-radius:12px;background:{AZUL};">
              <a href="{enlace}" target="_blank" style="display:inline-block;padding:16px 30px;font-family:{CUERPO};font-size:16px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:12px;">{boton} &rarr;</a>
            </td></tr>
          </table>
          <p style="margin:0 0 4px;font-family:{CUERPO};font-size:13px;line-height:1.5;color:{TENUE};">{nota}</p>
          {extra_html}
          <p style="margin:26px 0 0;padding-top:20px;border-top:1px solid {BORDE};font-family:{CUERPO};font-size:12px;line-height:1.6;color:{TENUE};">
            ¿El botón no funciona? Copia este enlace en tu navegador:<br>
            <a href="{enlace}" target="_blank" style="color:{TENUE};word-break:break-all;">{enlace}</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
    <!-- Pie -->
    <tr><td style="padding:24px 8px 0;font-family:{CUERPO};font-size:12px;line-height:1.7;color:{APAGADO};text-align:center;">
      ¿Dudas? Escríbenos por WhatsApp: <a href="https://wa.me/34605288673" target="_blank" style="color:{TENUE};text-decoration:none;">+34 605 288 673</a><br>
      autonomIA Lab · Paneles web con IA para autónomos, pymes y empresas en España
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>
"""


def _ventaja(titulo, texto):
    return f"""
            <tr><td bgcolor="{RESALTE}" style="padding:12px 16px;border:1px solid {AZUL_LINEA};border-radius:12px;background:{RESALTE};font-family:{CUERPO};font-size:15px;line-height:1.5;color:{TEXTO};">
              <span style="color:{AZUL_VIVO};">&rarr;</span>&nbsp; <b style="font-weight:600;">{titulo}</b><span style="color:#C3C8D2;"> · {texto}</span>
            </td></tr>
            <tr><td height="8" style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>"""


DENTRO = f"""
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0;">
            <tr><td style="padding:0 0 8px;font-family:{MONO};font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:{AZUL_VIVO};">Qué encontrarás dentro</td></tr>
            <tr><td style="padding:0 0 14px;font-family:{TITULO};font-size:18px;line-height:1.4;font-weight:600;color:{TEXTO};">Aplicaciones web empresariales pensadas para autónomos, pymes y empresas en España:</td></tr>
            {_ventaja("Ahorra tiempo", "las tareas que hoy haces a mano, hechas solas.")}
            {_ventaja("Ahorra dinero", "menos papeleo, menos errores y menos herramientas sueltas.")}
            {_ventaja("Decide con datos", "toda la información de tu negocio ordenada en un panel, para decidir mejor y más rápido.")}
            {_ventaja("Atiende mejor", "que tus clientes nunca tengan que esperar.")}
            <tr><td style="padding:4px 0 0;font-family:{CUERPO};font-size:15px;line-height:1.5;color:{TEXTO};">Y ejemplos reales que puedes probar desde el móvil.</td></tr>
          </table>"""

PLANTILLAS = {
    "acceso-aprobado.html": correo(
        preheader="Tu cuenta está lista. Crea tu contraseña y entra.",
        etiqueta="Acceso aprobado",
        titulo="Ya tienes acceso a autonomIA Lab",
        parrafos=[
            "Hemos revisado tu solicitud y tu cuenta ya está lista.",
            f'Solo falta un paso: <b style="color:{TEXTO};font-weight:600;">crea tu contraseña</b> y entra.',
        ],
        boton="Crear mi contraseña",
        enlace="{{ .SiteURL }}/auth/confirmar?token_hash={{ .TokenHash }}&type=magiclink",
        extra_html=DENTRO,
        nota="Por seguridad, el enlace solo sirve una vez y caduca al poco tiempo. Si no has pedido acceso, ignora este correo.",
    ),
    "cambiar-contrasena.html": correo(
        preheader="Pon una contraseña nueva para entrar en autonomIA Lab.",
        etiqueta="Seguridad de tu cuenta",
        titulo="Cambia tu contraseña",
        parrafos=[
            "Hemos recibido una petición para cambiar la contraseña de tu cuenta.",
            "Pulsa el botón y elige una nueva. Tu contraseña actual seguirá funcionando hasta que la cambies.",
        ],
        boton="Poner nueva contraseña",
        enlace="{{ .SiteURL }}/auth/confirmar?token_hash={{ .TokenHash }}&type=recovery",
        extra_html="",
        nota="Por seguridad, el enlace solo sirve una vez y caduca al poco tiempo. Si no lo has pedido tú, ignora este correo: nadie puede entrar sin él.",
    ),
}

if __name__ == "__main__":
    for nombre, html in PLANTILLAS.items():
        with open(os.path.join(AQUI, nombre), "w") as f:
            f.write(html)
        print(nombre, len(html), "caracteres")

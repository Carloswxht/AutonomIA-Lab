/** Número de WhatsApp de autonomIA Lab (formato internacional, sin "+"). */
export const WHATSAPP = "34605288673";

/** Enlace a WhatsApp con un mensaje ya escrito. */
export function enlaceWhatsApp(mensaje: string): string {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
}

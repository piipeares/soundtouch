// Fuente única de verdad de identidad y contacto del negocio.
//
// Todo valor de contacto renderizado en el sitio debe salir de acá. Los valores
// son sobreescribibles por entorno vía NEXT_PUBLIC_* (se inlinean en build y
// funcionan tanto en componentes server como client). Ver .env.example.

const whatsappNumber =
  process.env.NEXT_PUBLIC_BUSINESS_WHATSAPP ?? "5491131736468";
const email = process.env.NEXT_PUBLIC_BUSINESS_EMAIL ?? "wylap@yahoo.com.ar";

const rawExchangeRate = Number(process.env.NEXT_PUBLIC_EXCHANGE_RATE ?? 1050);

// Formatea un WhatsApp argentino (549 + código de área + número local) para mostrar.
function formatPhoneForDisplay(number: string): string {
  // 5491131736468 -> +54 9 11 3173-6468
  const match = /^549(\d{2,3})(\d{4})(\d{4})$/.exec(number);
  if (match) return `+54 9 ${match[1]} ${match[2]}-${match[3]}`;
  return `+${number}`;
}

export const business = {
  name: process.env.NEXT_PUBLIC_BUSINESS_NAME ?? "SoundTouch Instrumentos",
  whatsappNumber,
  email,
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  exchangeRate:
    Number.isFinite(rawExchangeRate) && rawExchangeRate > 0
      ? rawExchangeRate
      : 1050,
  city: process.env.NEXT_PUBLIC_BUSINESS_CITY ?? "Buenos Aires, Argentina",
  /** Teléfono formateado para mostrar (derivado del número de WhatsApp). */
  phoneDisplay: formatPhoneForDisplay(whatsappNumber),
  /** Link wa.me corto (sin mensaje precargado). */
  whatsappLink: `https://wa.me/${whatsappNumber}`,
  /** Link tel: derivado del número (formato internacional marcable). */
  telLink: `tel:+${whatsappNumber}`,
  /** Link mailto: derivado del email del negocio. */
  mailtoLink: `mailto:${email}`,
} as const;

/** Arma un link wa.me con mensaje precargado. */
export function generateWhatsAppLink(message: string): string {
  return `${business.whatsappLink}?text=${encodeURIComponent(message)}`;
}
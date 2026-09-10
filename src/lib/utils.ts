import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Tasas de cambio
const EXCHANGE_RATE = 1050; // 1 USD = 1050 ARS (aprox)

// Formatear precio en USD
export function formatPriceUSD(price: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

// Formatear precio en ARS
export function formatPriceARS(price: number): string {
  const priceARS = price * EXCHANGE_RATE;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(priceARS);
}

// Formatear precio según la moneda actual
export function formatPrice(price: number, currency: "USD" | "ARS" = "USD"): string {
  return currency === "USD" ? formatPriceUSD(price) : formatPriceARS(price);
}

export function generateWhatsAppLink(productName: string): string {
  const message = `Hola! Estoy interesado en el instrumento: ${productName}. ¿Me podrías dar más información?`;
  return `https://wa.me/5491112345678?text=${encodeURIComponent(message)}`;
}
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { business } from "@/config/business";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formatear precio en USD
export function formatPriceUSD(price: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

// Formatear precio en ARS usando la tasa única del negocio
export function formatPriceARS(price: number): string {
  const priceARS = price * business.exchangeRate;
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
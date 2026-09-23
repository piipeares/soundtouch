"use client";

import { useCurrency } from "@/context/CurrencyContext";
import { formatPrice } from "@/lib/utils";
import { clsx } from "clsx";

interface PriceProps {
  price: number;
  offerPrice?: number;
  discountPercentage?: number;
  className?: string;
}

/**
 * Precio con moneda (design D3 / task 5.4): isla client mínima que respeta
 * el toggle USD/ARS del CurrencyContext y muestra oferta + tachado cuando
 * existe. Usada dentro de server components (página de detalle).
 */
export default function Price({
  price,
  offerPrice,
  discountPercentage,
  className,
}: PriceProps) {
  const { currency } = useCurrency();
  const hasOffer =
    offerPrice !== undefined && discountPercentage !== undefined;

  if (!hasOffer) {
    return (
      <span
        className={clsx(
          "font-display text-3xl font-semibold text-foreground",
          className
        )}
      >
        {formatPrice(price, currency)}
      </span>
    );
  }

  return (
    <div className={clsx("flex items-baseline gap-3", className)}>
      <span className="font-display text-3xl font-semibold text-foreground">
        {formatPrice(offerPrice, currency)}
      </span>
      <span className="text-lg text-zinc-500 line-through">
        {formatPrice(price, currency)}
      </span>
      <span className="rounded-full bg-brand-accent px-2.5 py-1 text-xs font-bold text-brand-black shadow-glow">
        -{discountPercentage}%
      </span>
    </div>
  );
}
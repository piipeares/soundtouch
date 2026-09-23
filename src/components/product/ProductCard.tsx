"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MessageCircle, Tag } from "lucide-react";
import InstrumentImage from "@/components/product/InstrumentImage";
import { Instrument, CATEGORY_LABELS, CONDITION_LABELS } from "@/types";
import { formatPrice } from "@/lib/utils";
import { generateWhatsAppLink } from "@/config/business";
import { useCurrency } from "@/context/CurrencyContext";

interface ProductCardProps {
  instrument: Instrument;
  index: number;
}

/**
 * Card de catálogo (design D2 / task 4.7): portrait aspect-[4/5], imagen
 * local/placeholder vía InstrumentImage, hover lift + ring amber + zoom de
 * imagen. Precio con currency toggle (client island hereda CurrencyProvider).
 */
export default function ProductCard({ instrument, index }: ProductCardProps) {
  const { currency } = useCurrency();
  const hasOffer =
    instrument.offerPrice !== undefined &&
    instrument.discountPercentage !== undefined;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
      className="group card-surface overflow-hidden rounded-2xl shadow-card transition-shadow duration-300 hover:shadow-lifted hover:ring-1 hover:ring-brand-accent/40"
    >
      {/* Image Container (portrait) */}
      <Link
        href={`/producto/${instrument.id}`}
        className="relative block aspect-[4/5] overflow-hidden bg-surface-raised"
        aria-label={instrument.name}
      >
        <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105">
          <InstrumentImage
            src={instrument.image}
            alt={instrument.name}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>

        {/* Badge de oferta */}
        {hasOffer && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-brand-accent px-2.5 py-1 text-xs font-bold text-brand-black shadow-glow">
            <Tag size={12} aria-hidden="true" />
            -{instrument.discountPercentage}%
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-black/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </Link>

      {/* Content */}
      <div className="p-5">
        <div className="mb-2 flex items-start justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-accent">
            {instrument.brand}
          </span>
          <span className="text-xs text-zinc-500">
            {CATEGORY_LABELS[instrument.category]}
          </span>
        </div>

        <Link href={`/producto/${instrument.id}`}>
          <h3 className="line-clamp-1 text-lg font-bold text-foreground transition-colors group-hover:text-brand-accent">
            {instrument.name}
          </h3>
        </Link>

        <p className="mt-2 line-clamp-2 text-sm text-zinc-400">
          {instrument.description}
        </p>

        {/* Condición */}
        <div className="mt-2">
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
              instrument.condition === "nuevo"
                ? "bg-green-500/15 text-green-400"
                : instrument.condition === "usado-casi-nuevo"
                ? "bg-blue-500/15 text-blue-400"
                : instrument.condition === "reacondicionado"
                ? "bg-purple-500/15 text-purple-400"
                : "bg-zinc-500/15 text-zinc-400"
            }`}
          >
            {CONDITION_LABELS[instrument.condition]}
          </span>
        </div>

        {/* Precio */}
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col">
            {hasOffer ? (
              <>
                <span className="text-lg font-bold text-foreground">
                  {formatPrice(instrument.offerPrice!, currency)}
                </span>
                <span className="text-sm text-zinc-500 line-through">
                  {formatPrice(instrument.price, currency)}
                </span>
              </>
            ) : (
              <span className="text-xl font-bold text-foreground">
                {formatPrice(instrument.price, currency)}
              </span>
            )}
          </div>

          <Link
            href={generateWhatsAppLink(
              `Hola! Estoy interesado en el instrumento: ${instrument.name}. ¿Me podrías dar más información?`
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-brand-accent px-4 py-2 text-sm font-semibold text-brand-black transition-colors hover:bg-brand-accent-bright"
          >
            <MessageCircle size={16} aria-hidden="true" />
            Contactar
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
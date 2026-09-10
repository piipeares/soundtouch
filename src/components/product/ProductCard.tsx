"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { MessageCircle, Tag } from "lucide-react";
import { Instrument, CATEGORY_LABELS, CONDITION_LABELS } from "@/types";
import { formatPrice } from "@/lib/utils";
import { generateWhatsAppLink } from "@/config/business";
import { useCurrency } from "@/context/CurrencyContext";

interface ProductCardProps {
  instrument: Instrument;
  index: number;
}

export default function ProductCard({ instrument, index }: ProductCardProps) {
  const { currency } = useCurrency();
  const hasOffer = instrument.offerPrice && instrument.discountPercentage;
  
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group bg-brand-gray rounded-xl overflow-hidden border border-zinc-800 hover:border-brand-orange/50 transition-colors duration-300"
    >
      {/* Image Container */}
      <Link href={`/producto/${instrument.id}`} className="block relative aspect-square overflow-hidden">
        <Image
          src={instrument.image}
          alt={instrument.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          unoptimized
        />
        {/* Badge de oferta */}
        {hasOffer && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-brand-orange text-brand-black text-xs font-bold rounded">
            <Tag size={12} />
            -{instrument.discountPercentage}%
          </div>
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </Link>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-xs font-medium text-brand-orange uppercase tracking-wider">
            {instrument.brand}
          </span>
          <span className="text-xs text-zinc-500">
            {CATEGORY_LABELS[instrument.category]}
          </span>
        </div>

        <Link href={`/producto/${instrument.id}`}>
          <h3 className="text-lg font-bold text-white group-hover:text-brand-orange transition-colors line-clamp-1">
            {instrument.name}
          </h3>
        </Link>

        <p className="mt-2 text-sm text-zinc-400 line-clamp-2">
          {instrument.description}
        </p>

        {/* Condición */}
        <div className="mt-2">
          <span className={`inline-block px-2 py-0.5 text-xs rounded ${
            instrument.condition === "nuevo" 
              ? "bg-green-500/20 text-green-400"
              : instrument.condition === "usado-casi-nuevo"
              ? "bg-blue-500/20 text-blue-400"
              : instrument.condition === "reacondicionado"
              ? "bg-purple-500/20 text-purple-400"
              : "bg-zinc-500/20 text-zinc-400"
          }`}>
            {CONDITION_LABELS[instrument.condition]}
          </span>
        </div>

        {/* Precio */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex flex-col">
            {hasOffer ? (
              <>
                <span className="text-lg font-bold text-white">
                  {formatPrice(instrument.offerPrice!, currency)}
                </span>
                <span className="text-sm text-zinc-500 line-through">
                  {formatPrice(instrument.price, currency)}
                </span>
              </>
            ) : (
              <span className="text-xl font-bold text-white">
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
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-orange text-brand-black text-sm font-semibold rounded-lg hover:bg-brand-orange-hover transition-colors"
          >
            <MessageCircle size={16} />
            Contactar
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
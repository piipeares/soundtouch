"use client";

import { Edit2, Trash2 } from "lucide-react";
import { Instrument, CATEGORY_LABELS, CONDITION_LABELS } from "@/types";
import { formatPrice } from "@/lib/utils";
import InstrumentImage from "@/components/product/InstrumentImage";

interface InstrumentGridProps {
  instruments: Instrument[];
  onEdit: (instrument: Instrument) => void;
  onDelete: (id: string) => void;
}

/**
 * Grilla del panel admin (task 4.8): cards portrait alineadas al sistema
 * noir+amber, con imagen local/placeholder vía InstrumentImage. El CRUD
 * (editar/borrar) se delega al parent vía callbacks.
 */
export default function InstrumentGrid({
  instruments,
  onEdit,
  onDelete,
}: InstrumentGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {instruments.map((instrument) => (
        <article
          key={instrument.id}
          className="card-surface group overflow-hidden rounded-2xl shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lifted hover:ring-1 hover:ring-brand-accent/40"
        >
          <div className="relative aspect-[4/5] overflow-hidden bg-surface-raised">
            <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105">
              <InstrumentImage
                src={instrument.image}
                alt={instrument.name}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              />
            </div>
            <span className="absolute right-3 top-3 rounded-full border border-white/10 bg-brand-black/70 px-2.5 py-1 text-xs font-medium text-zinc-300 backdrop-blur-sm">
              {CONDITION_LABELS[instrument.condition]}
            </span>
          </div>

          <div className="p-4">
            <span className="text-xs font-medium uppercase tracking-wider text-brand-accent">
              {instrument.brand}
            </span>
            <h3 className="truncate font-semibold text-foreground">
              {instrument.name}
            </h3>
            <p className="mt-0.5 text-xs text-zinc-500">
              {CATEGORY_LABELS[instrument.category]}
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {formatPrice(instrument.price)}
            </p>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => onEdit(instrument)}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/5 py-2 text-sm font-medium text-foreground transition-colors hover:border-brand-accent/50 hover:text-brand-accent"
              >
                <Edit2 size={14} aria-hidden="true" />
                Editar
              </button>
              <button
                onClick={() => onDelete(instrument.id)}
                className="inline-flex items-center justify-center rounded-full bg-red-500/15 px-3 py-2 text-red-400 transition-colors hover:bg-red-500/30"
                aria-label={`Eliminar ${instrument.name}`}
              >
                <Trash2 size={14} aria-hidden="true" />
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
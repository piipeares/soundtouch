"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import {
  Instrument,
  Condition,
  InstrumentCategory,
  CATEGORY_LABELS,
  CONDITION_LABELS,
} from "@/types";
import { validateInstrument, CATEGORIES, CONDITIONS } from "@/lib/catalog";

interface InstrumentFormModalProps {
  /** Instrumento a editar, o null para crear (branch PUT/POST en el parent). */
  instrument: Instrument | null;
  saving: boolean;
  /** Error global/server (400 de validación, conexión, etc.). */
  error: string;
  onCancel: () => void;
  onSave: (payload: Omit<Instrument, "id">) => void;
}

interface FormState {
  name: string;
  description: string;
  price: string;
  image: string;
  category: InstrumentCategory;
  brand: string;
  model: string;
  featured: boolean;
  condition: Condition;
  offerPrice: string;
  discountPercentage: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  price: "",
  image: "",
  category: "guitarra-electrica",
  brand: "",
  model: "",
  featured: false,
  condition: "nuevo",
  offerPrice: "",
  discountPercentage: "",
};

function initialState(instrument: Instrument | null): FormState {
  if (!instrument) return EMPTY_FORM;
  return {
    name: instrument.name,
    description: instrument.description,
    price: String(instrument.price),
    image: instrument.image,
    category: instrument.category,
    brand: instrument.brand,
    model: instrument.model ?? "",
    featured: instrument.featured ?? false,
    condition: instrument.condition ?? "nuevo",
    offerPrice:
      instrument.offerPrice !== undefined ? String(instrument.offerPrice) : "",
    discountPercentage:
      instrument.discountPercentage !== undefined
        ? String(instrument.discountPercentage)
        : "",
  };
}

const inputClasses =
  "w-full px-4 py-3 bg-brand-black border border-white/10 rounded-xl text-foreground placeholder-zinc-500 focus:outline-none focus:border-brand-accent transition-colors";

/**
 * Modal de alta/edición del admin (task 4.8): extraído de admin/page.tsx con
 * estilo premium noir+amber (rounded-3xl, focus visible, placeholder
 * automático si la imagen va vacía). Valida con validateInstrument (misma
 * fuente que el server) y delega la escritura vía onSave.
 */
export default function InstrumentFormModal({
  instrument,
  saving,
  error,
  onCancel,
  onSave,
}: InstrumentFormModalProps) {
  const [form, setForm] = useState<FormState>(() => initialState(instrument));
  const [localError, setLocalError] = useState("");

  const update = (patch: Partial<FormState>) =>
    setForm((current) => ({ ...current, ...patch }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    // Validación client-side con el MISMO validador del server.
    const result = validateInstrument(form);
    if (!result.ok) {
      setLocalError(result.errors.join(". "));
      return;
    }
    onSave(result.instrument);
  };

  const shownError = localError || error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="card-surface w-full max-w-2xl overflow-y-auto rounded-3xl shadow-modal max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-white/10 p-6">
          <h2 className="font-display text-xl font-bold text-foreground">
            {instrument ? "Editar Instrumento" : "Nuevo Instrumento"}
          </h2>
          <button
            onClick={onCancel}
            className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-foreground"
            aria-label="Cerrar"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {shownError && (
            <div
              role="alert"
              className="rounded-xl border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-400"
            >
              {shownError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-zinc-300">
                Nombre
              </label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(e) => update({ name: e.target.value })}
                className={inputClasses}
                required
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="mb-2 block text-sm font-medium text-zinc-300">
                Descripción
              </label>
              <textarea
                id="description"
                value={form.description}
                onChange={(e) => update({ description: e.target.value })}
                rows={3}
                className={`${inputClasses} resize-none`}
                required
              />
            </div>

            <div>
              <label htmlFor="price" className="mb-2 block text-sm font-medium text-zinc-300">
                Precio (USD)
              </label>
              <input
                id="price"
                type="number"
                min="0.01"
                step="0.01"
                value={form.price}
                onChange={(e) => update({ price: e.target.value })}
                className={inputClasses}
                required
              />
            </div>

            <div>
              <label htmlFor="category" className="mb-2 block text-sm font-medium text-zinc-300">
                Categoría
              </label>
              <select
                id="category"
                value={form.category}
                onChange={(e) =>
                  update({ category: e.target.value as InstrumentCategory })
                }
                className={inputClasses}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="condition" className="mb-2 block text-sm font-medium text-zinc-300">
                Condición
              </label>
              <select
                id="condition"
                value={form.condition}
                onChange={(e) => update({ condition: e.target.value as Condition })}
                className={inputClasses}
              >
                {CONDITIONS.map((cond) => (
                  <option key={cond} value={cond}>
                    {CONDITION_LABELS[cond]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="offerPrice" className="mb-2 block text-sm font-medium text-zinc-300">
                Precio de Oferta (USD)
              </label>
              <input
                id="offerPrice"
                type="number"
                min="0.01"
                step="0.01"
                value={form.offerPrice}
                onChange={(e) => update({ offerPrice: e.target.value })}
                className={inputClasses}
                placeholder="Opcional"
              />
            </div>

            <div>
              <label htmlFor="discountPercentage" className="mb-2 block text-sm font-medium text-zinc-300">
                Descuento (%)
              </label>
              <input
                id="discountPercentage"
                type="number"
                min="0"
                max="100"
                value={form.discountPercentage}
                onChange={(e) => update({ discountPercentage: e.target.value })}
                className={inputClasses}
                placeholder="Ej: 15"
              />
            </div>

            <div>
              <label htmlFor="brand" className="mb-2 block text-sm font-medium text-zinc-300">
                Marca
              </label>
              <input
                id="brand"
                type="text"
                value={form.brand}
                onChange={(e) => update({ brand: e.target.value })}
                className={inputClasses}
                required
              />
            </div>

            <div>
              <label htmlFor="model" className="mb-2 block text-sm font-medium text-zinc-300">
                Modelo
              </label>
              <input
                id="model"
                type="text"
                value={form.model}
                onChange={(e) => update({ model: e.target.value })}
                className={inputClasses}
                required
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="image" className="mb-2 block text-sm font-medium text-zinc-300">
                URL de Imagen (opcional)
              </label>
              <input
                id="image"
                type="url"
                value={form.image}
                onChange={(e) => update({ image: e.target.value })}
                className={inputClasses}
                placeholder="Local (/images/...) o vacío para placeholder automático"
              />
              <p className="mt-1 text-xs text-zinc-500">
                Si queda vacío, el sistema genera un placeholder con gradiente e
                iniciales.
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => update({ featured: e.target.checked })}
                  className="h-5 w-5 rounded border-white/10 bg-brand-black text-brand-accent focus:ring-brand-accent"
                />
                <span className="text-sm text-zinc-300">
                  Instrumento destacado
                </span>
              </label>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-full border border-white/10 py-3 text-foreground transition-colors hover:bg-white/5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-brand-accent py-3 font-semibold text-brand-black transition-colors hover:bg-brand-accent-bright disabled:opacity-50"
            >
              {saving && (
                <Loader2 size={18} className="animate-spin" aria-hidden="true" />
              )}
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
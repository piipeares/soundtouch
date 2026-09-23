"use client";

import { InstrumentCategory, CATEGORY_LABELS } from "@/types";
import { clsx } from "clsx";

interface FiltersProps {
  selectedCategory: InstrumentCategory | "all";
  onCategoryChange: (category: InstrumentCategory | "all") => void;
  /** Categorías a listar. Default: todas. El caller filtra las vacías
   * (spec product-catalog: solo categorías con ≥1 instrumento). */
  categories?: readonly InstrumentCategory[];
}

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as InstrumentCategory[];

/**
 * Filtros de categoría (task 4.7): chips pill con aria-pressed (spec
 * premium-design: filtros accesibles por teclado).
 */
export default function Filters({
  selectedCategory,
  onCategoryChange,
  categories = ALL_CATEGORIES,
}: FiltersProps) {
  const chipClasses = (isSelected: boolean) =>
    clsx(
      "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
      isSelected
        ? "border-transparent bg-brand-accent text-brand-black"
        : "border-white/10 bg-white/5 text-zinc-400 hover:border-brand-accent/50 hover:text-foreground"
    );

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoría">
      <button
        type="button"
        onClick={() => onCategoryChange("all")}
        aria-pressed={selectedCategory === "all"}
        className={chipClasses(selectedCategory === "all")}
      >
        Todos
      </button>

      {categories.map((category) => (
        <button
          key={category}
          type="button"
          onClick={() => onCategoryChange(category)}
          aria-pressed={selectedCategory === category}
          className={chipClasses(selectedCategory === category)}
        >
          {CATEGORY_LABELS[category]}
        </button>
      ))}
    </div>
  );
}
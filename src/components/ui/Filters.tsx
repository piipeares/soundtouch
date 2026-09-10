"use client";

import { InstrumentCategory, CATEGORY_LABELS } from "@/types";
import { clsx } from "clsx";

interface FiltersProps {
  selectedCategory: InstrumentCategory | "all";
  onCategoryChange: (category: InstrumentCategory | "all") => void;
}

const categories: { value: InstrumentCategory | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "guitarra-electrica", label: "Guitarra Eléctrica" },
  { value: "guitarra-acustica", label: "Guitarra Acústica" },
  { value: "guitarra-clasica", label: "Guitarra Clásica" },
  { value: "bajo-electrico", label: "Bajo Eléctrico" },
  { value: "bajo-acustico", label: "Bajo Acústico" },
  { value: "otro-instrumento", label: "Otros" },
  { value: "pedal", label: "Pedales" },
  { value: "accesorio", label: "Accesorios" },
  { value: "parte", label: "Partes" },
];

export default function Filters({ selectedCategory, onCategoryChange }: FiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <button
          key={category.value}
          onClick={() => onCategoryChange(category.value)}
          className={clsx(
            "px-3 py-1.5 text-sm rounded-lg transition-colors",
            selectedCategory === category.value
              ? "bg-brand-orange text-brand-black font-medium"
              : "bg-brand-gray text-zinc-400 hover:text-white hover:bg-zinc-700"
          )}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
}
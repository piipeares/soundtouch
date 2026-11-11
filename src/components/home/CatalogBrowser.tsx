"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/product/ProductCard";
import Filters from "@/components/ui/Filters";
import { searchInstruments, activeCategories } from "@/lib/catalog";
import { Instrument, InstrumentCategory } from "@/types";

type Tab = "catalogo" | "ofertas";

interface CatalogBrowserProps {
  instruments: Instrument[];
}

/** Instrumentos visibles antes de tocar "Ver más". */
const INITIAL_COUNT = 8;
/** Cuántos se suman en cada click. */
const PAGE_SIZE = 14;

/**
 * Estado de paginación atado a la combinación de filtros: si el usuario cambia
 * de tab, de categoría o de búsqueda, la lista vuelve a empezar en 8. Se
 * resuelve en render (patrón recomendado por React) en vez de con un efecto,
 * para no encadenar renders.
 */
interface ListState {
  key: string;
  count: number;
}

/**
 * Isla client del catálogo (design D3 / task 5.1): recibe los instrumentos
 * ya resueltos en el server component (SSR/SSG) y solo queda interactiva en
 * el navegador (tabs, filtros, búsqueda por URL, grid). Cero fetch en cliente.
 */
export default function CatalogBrowser({ instruments }: CatalogBrowserProps) {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  const [activeTab, setActiveTab] = useState<Tab>("catalogo");
  const [selectedCategory, setSelectedCategory] = useState<
    InstrumentCategory | "all"
  >("all");

  // Filtrar instrumentos
  const filteredInstruments = searchQuery
    ? searchInstruments(instruments, searchQuery)
    : instruments;

  // Aplicar filtro de categoría
  const categoryFiltered =
    selectedCategory === "all"
      ? filteredInstruments
      : filteredInstruments.filter(
          (inst) => inst.category === selectedCategory
        );

  // Solo ofertas (los que tienen offerPrice)
  const onSale = instruments.filter(
    (inst) => inst.offerPrice && inst.discountPercentage
  );

  const displayInstruments = activeTab === "ofertas" ? onSale : categoryFiltered;

  // Paginación: 8 de entrada y 14 por click, reiniciada al cambiar de filtro.
  const filterKey = `${activeTab}|${selectedCategory}|${searchQuery}`;
  const [listState, setListState] = useState<ListState>({
    key: filterKey,
    count: INITIAL_COUNT,
  });

  if (listState.key !== filterKey) {
    setListState({ key: filterKey, count: INITIAL_COUNT });
  }

  const visibleInstruments = displayInstruments.slice(0, listState.count);
  const hiddenCount = displayInstruments.length - visibleInstruments.length;

  const showMore = () => {
    setListState((prev) => ({ key: prev.key, count: prev.count + PAGE_SIZE }));
  };

  // Solo categorías con ≥1 instrumento (spec product-catalog: las vacías no se listan)
  const categories = activeCategories(instruments);

  return (
    <>
      {/* Tabs + filtros + catálogo */}
      <section
        id="catalogo"
        className="scroll-mt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="flex items-center justify-center gap-4 mb-8 pt-4">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "catalogo"}
            onClick={() => setActiveTab("catalogo")}
            className={`px-6 py-2 rounded-full font-medium transition-colors ${
              activeTab === "catalogo"
                ? "bg-brand-accent text-brand-black"
                : "bg-white/5 border border-white/10 text-zinc-400 hover:text-white"
            }`}
          >
            Catálogo General
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "ofertas"}
            onClick={() => setActiveTab("ofertas")}
            className={`px-6 py-2 rounded-full font-medium transition-colors flex items-center gap-2 ${
              activeTab === "ofertas"
                ? "bg-brand-accent text-brand-black"
                : "bg-white/5 border border-white/10 text-zinc-400 hover:text-white"
            }`}
          >
            Ofertas
            <span className="px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">
              {onSale.length}
            </span>
          </button>
        </div>

        {/* Filtros de categoría */}
        {activeTab === "catalogo" && (
          <div className="mb-8">
            <h3 className="text-sm text-zinc-500 mb-3">Filtrar por categoría</h3>
            <Filters
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              categories={categories}
            />
          </div>
        )}

        {/* Mensaje de búsqueda */}
        {searchQuery && (
          <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
            <p className="text-zinc-400">
              Resultados para:{" "}
              <span className="text-white font-medium">
                &ldquo;{searchQuery}&rdquo;
              </span>
              <span className="text-zinc-500 ml-2">
                ({displayInstruments.length} resultados)
              </span>
            </p>
          </div>
        )}
      </section>

      {/* Catálogo */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {displayInstruments.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {visibleInstruments.map((instrument, index) => (
                <ProductCard
                  key={instrument.id}
                  instrument={instrument}
                  index={index}
                />
              ))}
            </div>

            <div className="mt-10 flex flex-col items-center gap-3">
              <p className="text-sm text-zinc-500">
                Mostrando {visibleInstruments.length} de{" "}
                {displayInstruments.length} instrumentos
              </p>

              {hiddenCount > 0 && (
                <button
                  type="button"
                  onClick={showMore}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-brand-accent/60 hover:text-brand-accent"
                >
                  Ver más
                  <span className="text-zinc-500">
                    (+{Math.min(PAGE_SIZE, hiddenCount)})
                  </span>
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-zinc-400 text-lg">
              No se encontraron instrumentos con los criterios seleccionados
            </p>
          </div>
        )}
      </section>
    </>
  );
}
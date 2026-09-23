"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/product/ProductCard";
import Filters from "@/components/ui/Filters";
import Hero from "@/components/home/Hero";
import AboutSection from "@/components/home/AboutSection";
import HowToBuySection from "@/components/home/HowToBuySection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import GuaranteeSection from "@/components/home/GuaranteeSection";
import ContactSection from "@/components/home/ContactSection";
import { instruments } from "@/lib/seed";
import { searchInstruments, activeCategories } from "@/lib/catalog";
import { generateWhatsAppLink } from "@/config/business";
import { InstrumentCategory } from "@/types";

type Tab = "catalogo" | "ofertas";

function HomeContent() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  
  const [activeTab, setActiveTab] = useState<Tab>("catalogo");
  const [selectedCategory, setSelectedCategory] = useState<InstrumentCategory | "all">("all");
  
  // Filtrar instrumentos
  let filteredInstruments = searchQuery 
    ? searchInstruments(instruments, searchQuery)
    : instruments;
  
  // Aplicar filtro de categoría
  if (selectedCategory !== "all") {
    filteredInstruments = filteredInstruments.filter((inst) => inst.category === selectedCategory);
  }
  
  // Aplicar filtro de ofertas (solo mostrar los que tienen offerPrice)
  const onSale = instruments.filter((inst) => inst.offerPrice && inst.discountPercentage);
  const displayInstruments = activeTab === "ofertas" ? onSale : filteredInstruments;

  // Solo categorías con ≥1 instrumento (spec product-catalog: las vacías no se listan)
  const categories = activeCategories(instruments);

  return (
    <div className="bg-background min-h-screen">
      {/* Hero */}
      <Hero />

      {/* Nosotros */}
      <AboutSection />

      {/* Tabs + filtros + catálogo */}
      <section id="catalogo" className="scroll-mt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center gap-4 mb-8 pt-4">
          <button
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
              Resultados para: <span className="text-white font-medium">"{searchQuery}"</span>
              <span className="text-zinc-500 ml-2">({displayInstruments.length} resultados)</span>
            </p>
          </div>
        )}
      </section>

      {/* Catálogo */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {displayInstruments.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayInstruments.map((instrument, index) => (
              <ProductCard
                key={instrument.id}
                instrument={instrument}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-zinc-400 text-lg">
              No se encontraron instrumentos con los criterios seleccionados
            </p>
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="card-surface rounded-2xl p-8 md:p-12 text-center shadow-card">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-white">
            ¿No encontrás lo que buscás?
          </h2>
          <p className="mt-4 text-zinc-400 max-w-xl mx-auto">
            Contactanos y te ayudamos a encontrar el instrumento perfecto. 
            Tenemos acceso a inventario exclusivo.
          </p>
          <a
            href={generateWhatsAppLink("Hola! Estoy buscando un instrumento específico")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-gradient-to-r from-brand-accent to-brand-accent-deep text-brand-black font-semibold rounded-full shadow-glow hover:opacity-90 transition-opacity"
          >
            Consultar Disponibilidad
          </a>
        </div>
      </section>

      {/* Cómo comprar / Testimonios / Garantía / Contacto */}
      <HowToBuySection />
      <TestimonialsSection />
      <GuaranteeSection />
      <ContactSection />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-accent"></div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
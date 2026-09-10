"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import ProductCard from "@/components/product/ProductCard";
import Filters from "@/components/ui/Filters";
import { instruments } from "@/lib/seed";
import { searchInstruments } from "@/lib/catalog";
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

  return (
    <div className="bg-brand-black min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-brand-orange/5 via-transparent to-transparent rotate-12" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              <span className="text-white">SoundTouch </span>
              <span className="text-brand-orange">Instrumentos</span>
            </h1>
            <p className="mt-4 text-lg md:text-xl text-zinc-400">
              Instrumentos musicales de alta gama para músicos exigentes
            </p>
          </motion.div>
        </div>
      </section>

      {/* Tabs de navegación */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center gap-4 mb-8">
          <button
            onClick={() => setActiveTab("catalogo")}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "catalogo"
                ? "bg-brand-orange text-brand-black"
                : "bg-brand-gray text-zinc-400 hover:text-white"
            }`}
          >
            Catálogo General
          </button>
          <button
            onClick={() => setActiveTab("ofertas")}
            className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === "ofertas"
                ? "bg-brand-orange text-brand-black"
                : "bg-brand-gray text-zinc-400 hover:text-white"
            }`}
          >
            Ofertas
            <span className="px-1.5 py-0.5 text-xs bg-red-500 text-white rounded">
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
            />
          </div>
        )}

        {/* Mensaje de búsqueda */}
        {searchQuery && (
          <div className="mb-6 p-4 bg-brand-gray rounded-lg border border-zinc-800">
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
        <div className="bg-brand-gray rounded-2xl p-8 md:p-12 text-center border border-zinc-800">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
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
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-brand-orange text-brand-black font-semibold rounded-lg hover:bg-brand-orange-hover transition-colors"
          >
            Consultar Disponibilidad
          </a>
        </div>
      </section>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="bg-brand-black min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-orange"></div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
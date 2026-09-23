import { Suspense } from "react";
import type { Metadata } from "next";
import CatalogBrowser from "@/components/home/CatalogBrowser";
import Hero from "@/components/home/Hero";
import AboutSection from "@/components/home/AboutSection";
import HowToBuySection from "@/components/home/HowToBuySection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import GuaranteeSection from "@/components/home/GuaranteeSection";
import ContactSection from "@/components/home/ContactSection";
import JsonLd from "@/components/JsonLd";
import { readInstruments } from "@/lib/store/instruments";
import { generateWhatsAppLink, business } from "@/config/business";

export const metadata: Metadata = {
  title: "SoundTouch Instrumentos | Compra y venta de instrumentos musicales",
  description:
    "Vidriera de instrumentos musicales de alta gama en Argentina. Guitarras, bajos, pedales y más. Contacto directo por WhatsApp.",
};

// ISR: la home se revalida tras writes del admin (revalidatePath("/") en el
// store) y como máximo cada 60 s — el catálogo público refleja las ediciones.
export const revalidate = 60;

/**
 * Home (design D3 / task 5.1): SERVER component. El catálogo y las secciones
 * se renderizan en el servidor; la única isla client es CatalogBrowser
 * (tabs/filtros/búsqueda). Lee del STORE (fuente única: data/instruments.json
 * sembrado desde el seed), NO del seed estático — así las altas/ediciones del
 * admin aparecen en el catálogo público.
 */
export default function Home() {
  const instruments = readInstruments();
  return (
    <div className="bg-background min-h-screen">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Store",
          name: business.name,
          description: metadata.description,
          email: business.email,
          telephone: business.telLink,
          areaServed: "AR",
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "sales",
            email: business.email,
            telephone: business.telLink,
          },
        }}
      />
      {/* Hero */}
      <Hero />

      {/* Nosotros */}
      <AboutSection />

      {/* Catálogo (isla client con Suspense por useSearchParams) */}
      <Suspense
        fallback={
          <div className="bg-background min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-accent" />
          </div>
        }
      >
        <CatalogBrowser instruments={instruments} />
      </Suspense>

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
            href={generateWhatsAppLink(
              "Hola! Estoy buscando un instrumento específico"
            )}
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
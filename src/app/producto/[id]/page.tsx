import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageCircle, Check } from "lucide-react";
import { getInstrumentById } from "@/lib/store/instruments";
import { generateWhatsAppLink } from "@/config/business";
import InstrumentImage from "@/components/product/InstrumentImage";
import Price from "@/components/product/Price";
import JsonLd from "@/components/JsonLd";
import { CATEGORY_LABELS, CONDITION_LABELS } from "@/types";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}
 
export async function generateMetadata({ params }: ProductPageProps) {
  const { id } = await params;
  const instrument = getInstrumentById(id);
 
  if (!instrument) {
    return { title: "Producto no encontrado | SoundTouch" };
  }
 
  return {
    title: `${instrument.name} | SoundTouch Instrumentos`,
    description: instrument.description,
    openGraph: {
      title: instrument.name,
      description: instrument.description,
      images: [instrument.image],
    },
  };
}
 
export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const instrument = getInstrumentById(id);
 
  if (!instrument) {
    notFound();
  }
 
  const whatsappLink = generateWhatsAppLink(
    `Hola! Estoy interesado en el instrumento: ${instrument.name}. ¿Me podrías dar más información?`
  );
 
  return (
    <article className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: instrument.name,
          description: instrument.description,
          brand: { "@type": "Brand", name: instrument.brand },
          category: CATEGORY_LABELS[instrument.category],
          image: instrument.image,
          offers: {
            "@type": "Offer",
            price: instrument.offerPrice ?? instrument.price,
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
          },
        }}
      />
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-zinc-400 hover:text-brand-accent transition-colors mb-8"
      >
        <ArrowLeft size={20} />
        Volver al catálogo
      </Link>
 
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Image */}
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-surface-raised shadow-card">
          <InstrumentImage
            src={instrument.image}
            alt={instrument.name}
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
 
        {/* Details */}
        <div className="flex flex-col">
          <div className="mb-2">
            <span className="text-sm font-semibold text-brand-accent uppercase tracking-wider">
              {instrument.brand}
            </span>
          </div>
 
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            {instrument.name}
          </h1>
 
          <p className="mt-4 text-lg text-zinc-400 leading-relaxed">
            {instrument.description}
          </p>
 
          {/* Price */}
          <div className="mt-8">
            <Price
              price={instrument.price}
              offerPrice={instrument.offerPrice}
              discountPercentage={instrument.discountPercentage}
            />
          </div>
 
          {/* CTA Button */}
          <div className="mt-8">
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-4 bg-brand-accent text-brand-black font-semibold rounded-full hover:bg-brand-accent-bright transition-colors text-lg"
            >
              <MessageCircle size={24} />
              Contactar
            </a>
          </div>
 
          {/* Features / Specs */}
          <div className="mt-12 pt-8 border-t border-white/10">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Características
            </h2>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-zinc-400">
                <Check size={20} className="text-green-500" />
                <span>Marca: {instrument.brand}</span>
              </li>
              {instrument.model && (
                <li className="flex items-center gap-3 text-zinc-400">
                  <Check size={20} className="text-green-500" />
                  <span>Modelo: {instrument.model}</span>
                </li>
              )}
              <li className="flex items-center gap-3 text-zinc-400">
                <Check size={20} className="text-green-500" />
                <span>Categoría: {CATEGORY_LABELS[instrument.category]}</span>
              </li>
              <li className="flex items-center gap-3 text-zinc-400">
                <Check size={20} className="text-green-500" />
                <span>
                  Condición: {CONDITION_LABELS[instrument.condition]}
                </span>
              </li>
              {instrument.specs && instrument.specs.length > 0 && (
                <li className="flex flex-col gap-2 pt-2">
                  <span className="text-sm font-semibold text-foreground">
                    Especificaciones
                  </span>
                  <ul className="space-y-1.5">
                    {instrument.specs.map((spec) => (
                      <li
                        key={spec}
                        className="flex items-center gap-3 text-zinc-400"
                      >
                        <Check size={16} className="text-green-500" />
                        <span>{spec}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </article>
  );
}
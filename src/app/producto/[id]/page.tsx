import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MessageCircle, Check } from "lucide-react";
import { getInstrumentById } from "@/lib/data";
import { formatPrice, generateWhatsAppLink } from "@/lib/utils";

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
 
  const whatsappLink = generateWhatsAppLink(instrument.name);
 
  return (
    <article className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-zinc-600 hover:text-brand-orange transition-colors mb-8"
      >
        <ArrowLeft size={20} />
        Volver al catálogo
      </Link>
 
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Image */}
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-zinc-100">
          <Image
            src={instrument.image}
            alt={instrument.name}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            unoptimized
          />
        </div>
 
        {/* Details */}
        <div className="flex flex-col">
          <div className="mb-2">
            <span className="text-sm font-semibold text-brand-orange uppercase tracking-wider">
              {instrument.brand}
            </span>
          </div>
 
          <h1 className="text-3xl md:text-4xl font-bold text-zinc-900">
            {instrument.name}
          </h1>
 
          <p className="mt-4 text-lg text-zinc-600 leading-relaxed">
            {instrument.description}
          </p>
 
          {/* Price */}
          <div className="mt-8">
            <span className="text-3xl font-bold text-zinc-900">
              {formatPrice(instrument.price)}
            </span>
          </div>
 
          {/* CTA Button */}
          <div className="mt-8">
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-4 bg-brand-orange text-brand-black font-semibold rounded-xl hover:bg-brand-orange-hover transition-colors text-lg"
            >
              <MessageCircle size={24} />
              Contactar
            </a>
          </div>
 
          {/* Features / Specs */}
          <div className="mt-12 pt-8 border-t border-zinc-200">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">
              Características
            </h2>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-zinc-600">
                <Check size={20} className="text-green-500" />
                <span>Marca: {instrument.brand}</span>
              </li>
              {instrument.model && (
                <li className="flex items-center gap-3 text-zinc-600">
                  <Check size={20} className="text-green-500" />
                  <span>Modelo: {instrument.model}</span>
                </li>
              )}
              <li className="flex items-center gap-3 text-zinc-600">
                <Check size={20} className="text-green-500" />
                <span>Categoría: {instrument.category}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </article>
  );
}
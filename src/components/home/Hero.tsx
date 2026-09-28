import Link from "next/link";
import Image from "next/image";
import { MessageCircle, ArrowDown } from "lucide-react";
import { business, generateWhatsAppLink } from "@/config/business";

/**
 * Hero premium (design D2 / task 4.5): foto de fondo real del local
 * (public/images/guitar-hero.jpg), overlay noir para legibilidad, gradiente de
 * texto amber→orange, glow radial y entrada por CSS keyframes (server-safe,
 * honors prefers-reduced-motion vía globals.css). CTA de WhatsApp real desde
 * business config.
 */
export default function Hero() {
  const whatsappLink = generateWhatsAppLink(
    "Hola! Quiero consultar por un instrumento"
  );

  return (
    <section className="relative overflow-hidden">
      {/* Foto de fondo (local, sin remotePatterns) */}
      <div className="absolute inset-0" aria-hidden="true">
        <Image
          src="/images/guitar-hero.jpg"
          alt=""
          fill
          sizes="100vw"
          priority
          className="object-cover"
          unoptimized
        />
        {/* Overlays: gradiente noir para legibilidad + glow amber */}
        <div className="absolute inset-0 bg-gradient-to-b from-brand-black/85 via-brand-black/60 to-background" />
        <div className="absolute inset-0 bg-glow-amber" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 md:py-40 lg:px-8">
        <p className="animate-hero-fade text-sm font-semibold uppercase tracking-[0.2em] text-brand-accent">
          Instrumentos musicales de alta gama
        </p>

        <h1 className="animate-hero-rise mt-6 font-display text-5xl font-bold tracking-tight text-foreground drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)] md:text-7xl">
          <span className="text-gradient-amber">SoundTouch</span> Instrumentos
        </h1>

        <p className="animate-hero-rise hero-delay-1 mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-200 drop-shadow-[0_1px_8px_rgba(0,0,0,0.8)] md:text-xl">
          {business.city && `${business.city}. `}
          Selección curada de guitarras, bajos, teclados y equipos para músicos
          que no se conforman con menos. Trato directo y asesoramiento honesto.
        </p>

        <div className="animate-hero-rise hero-delay-2 mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-auto items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-accent to-brand-accent-deep px-6 py-3 font-semibold text-brand-black shadow-glow transition-opacity hover:opacity-90"
          >
            <MessageCircle size={18} aria-hidden="true" />
            Consultar por WhatsApp
          </a>
          <Link
            href="#catalogo"
            className="inline-flex w-auto items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur-sm transition-colors hover:border-brand-accent/50 hover:text-brand-accent"
          >
            Ver catálogo
            <ArrowDown size={18} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
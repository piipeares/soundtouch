import Link from "next/link";
import { MessageCircle, ArrowDown } from "lucide-react";
import { business, generateWhatsAppLink } from "@/config/business";

/**
 * Hero premium (design D2 / task 4.5): gradiente de texto amber→orange, glow
 * radial y entrada por CSS keyframes (server-safe, honors prefers-reduced-motion
 * vía globals.css). CTA de WhatsApp real desde business config.
 */
export default function Hero() {
  const whatsappLink = generateWhatsAppLink(
    "Hola! Quiero consultar por un instrumento"
  );

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-glow-amber" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 md:py-32 lg:px-8">
        <p className="animate-hero-fade text-sm font-semibold uppercase tracking-[0.2em] text-brand-accent">
          Instrumentos musicales de alta gama
        </p>

        <h1 className="animate-hero-rise mt-6 font-display text-5xl font-bold tracking-tight text-foreground md:text-7xl">
          <span className="text-gradient-amber">SoundTouch</span> Instrumentos
        </h1>

        <p className="animate-hero-rise hero-delay-1 mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400 md:text-xl">
          {business.city && `${business.city}. `}
          Selección curada de guitarras, bajos, teclados y equipos para músicos
          que no se conforman con menos. Trato directo y asesoramiento honesto.
        </p>

        <div className="animate-hero-rise hero-delay-2 mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-accent to-brand-accent-deep px-7 py-3.5 font-semibold text-brand-black shadow-glow transition-opacity hover:opacity-90 sm:w-auto"
          >
            <MessageCircle size={20} aria-hidden="true" />
            Consultar por WhatsApp
          </a>
          <Link
            href="#catalogo"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-7 py-3.5 font-semibold text-foreground transition-colors hover:border-brand-accent/50 hover:text-brand-accent sm:w-auto"
          >
            Ver catálogo
            <ArrowDown size={18} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
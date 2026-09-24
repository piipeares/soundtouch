import { Sparkles, Bot, MessageCircleHeart } from "lucide-react";
import SectionHeading from "@/components/home/SectionHeading";
import { generateWhatsAppLink } from "@/config/business";

/**
 * Espacio reservado para la herramienta diferencial de la casa: el asistente
 * con IA (design D2, tokens del sistema). Es un placeholder PREMIUM — muestra
 * la intención de producto sin prometer funcionalidad que aún no existe.
 *
 * Cuando la IA esté implementada, este bloque se reemplaza por el componente
 * real manteniendo la misma posición en la home.
 */
export default function AISection() {
  return (
    <section className="relative overflow-hidden border-y border-white/5 bg-white/[0.02] py-20 md:py-24">
      <div className="absolute inset-0 bg-glow-amber" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Próximamente"
          title="Tu asistente musical con IA"
          subtitle="La herramienta que va a recomendar el instrumento exacto para tu nivel, estilo y presupuesto. Todavía en desarrollo."
        />

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            {
              icon: Bot,
              title: "Recomendación inteligente",
              text: "Contanos qué tocás o querés tocar, y la IA filtra el catálogo real de SoundTouch para sugerirte el instrumento ideal.",
            },
            {
              icon: Sparkles,
              title: "Asesoría honesta",
              text: "Comparaciones claras entre modelos, condiciones y precios. Sin humo: la misma honestidad que nos caracteriza, con más cabeza.",
            },
            {
              icon: MessageCircleHeart,
              title: "Directo a WhatsApp",
              text: "Toda recomendación termina en una conversación real con nosotros. La IA te acerca, el humano te atiende.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <feature.icon
                size={28}
                className="text-brand-accent"
                aria-hidden="true"
              />
              <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {feature.text}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-accent/30 bg-brand-accent/10 px-5 py-2 text-sm font-semibold text-brand-accent">
            <Sparkles size={16} aria-hidden="true" />
            En desarrollo — sumate a la lista de espera
          </span>
          <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-zinc-500">
            ¿Querés ser de los primeros en probarla cuando esté lista? Escribinos
            y te avisamos.
          </p>
          <a
            href={generateWhatsAppLink(
              "Hola! Quiero enterarme cuando salga el asistente con IA de SoundTouch"
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 font-semibold text-foreground transition-colors hover:border-brand-accent/50 hover:text-brand-accent"
          >
            <MessageCircleHeart size={18} aria-hidden="true" />
            Avisame por WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
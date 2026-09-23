import { Search, MessageCircle, Truck, ShieldCheck } from "lucide-react";
import SectionHeading from "@/components/home/SectionHeading";
import Reveal from "@/components/ui/Reveal";
import { generateWhatsAppLink } from "@/config/business";

const steps = [
  {
    icon: Search,
    title: "Elegí tu instrumento",
    text: "Explorá el catálogo y compará las fichas con estado, precio y fotos reales.",
  },
  {
    icon: MessageCircle,
    title: "Consultanos por WhatsApp",
    text: "Te respondemos dudas, coordinamos una visita o una videollamada para que lo veas.",
  },
  {
    icon: Truck,
    title: "Coordinamos la entrega",
    text: "Retiro en persona o envío cuidadosamente embalado a todo el país.",
  },
  {
    icon: ShieldCheck,
    title: "Recibilo y tocá",
    text: "Probás el instrumento con garantía; si algo no cierra, lo resolvemos sin vueltas.",
  },
];

/**
 * Sección "Cómo comprar" (spec business-contact: how-to-buy con CTA
 * funcional desde config, sin overflow en mobile).
 */
export default function HowToBuySection() {
  return (
    <section className="relative overflow-hidden py-20 md:py-24">
      <div
        className="absolute inset-0 bg-glow-amber-soft"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Cómo comprar"
          title="De la consulta al instrumento en 4 pasos"
          subtitle="Proceso simple y transparente, pensado para que compres con confianza."
        />

        <ol className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <Reveal key={step.title} delay={index * 0.08} className="h-full">
              <li className="card-surface relative h-full rounded-2xl p-6 shadow-card">
                <span
                  className="absolute right-5 top-4 font-display text-4xl font-bold text-white/10"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <step.icon
                  size={28}
                  className="text-brand-accent"
                  aria-hidden="true"
                />
                <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {step.text}
                </p>
              </li>
            </Reveal>
          ))}
        </ol>

        <Reveal delay={0.2} className="mt-12 text-center">
          <a
            href={generateWhatsAppLink(
              "Hola! Quiero saber cómo comprar un instrumento"
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-accent to-brand-accent-deep px-7 py-3.5 font-semibold text-brand-black shadow-glow transition-opacity hover:opacity-90"
          >
            <MessageCircle size={20} aria-hidden="true" />
            Empezar una consulta
          </a>
        </Reveal>
      </div>
    </section>
  );
}
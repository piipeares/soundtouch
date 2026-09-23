import { Sparkles, Headphones, BadgeCheck, HeartHandshake } from "lucide-react";
import SectionHeading from "@/components/home/SectionHeading";
import Reveal from "@/components/ui/Reveal";

const values = [
  {
    icon: Sparkles,
    title: "Selección curada",
    text: "Cada instrumento pasa por nuestras manos antes de publicarse: sonido, estado y precio tienen que cerrar.",
  },
  {
    icon: Headphones,
    title: "Asesoramiento real",
    text: "Te escuchamos primero: tu nivel, tu estilo y tu presupuesto definen qué te conviene, no lo que sobra en stock.",
  },
  {
    icon: BadgeCheck,
    title: "Estado verificado",
    text: "Si dice nuevo, es nuevo. Si dice usado, lo probamos y te contamos exactamente qué tiene.",
  },
  {
    icon: HeartHandshake,
    title: "Trato directo",
    text: "Hablás directo con nosotros por WhatsApp, sin intermediarios ni respuestas automáticas.",
  },
];

/**
 * Sección Nosotros — id="about" (ancla de navbar/footer, spec product-catalog).
 * Contenido real del negocio, sin datos inventados.
 */
export default function AboutSection() {
  return (
    <section
      id="about"
      className="scroll-mt-24 border-y border-white/5 bg-white/[0.02] py-20 md:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Nosotros"
          title="Músicos atendiendo músicos"
          subtitle="Somos un emprendimiento argentino dedicado a la compra y venta de instrumentos de alta gama. Cada publicación es la foto real de un instrumento que está en nuestro poder, revisado y listo para tocar."
        />

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((value, index) => (
            <Reveal key={value.title} delay={index * 0.08} className="h-full">
              <div className="card-surface h-full rounded-2xl p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lifted">
                <value.icon
                  size={28}
                  className="text-brand-accent"
                  aria-hidden="true"
                />
                <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
                  {value.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {value.text}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
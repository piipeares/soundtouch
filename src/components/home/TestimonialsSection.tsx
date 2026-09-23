import { Quote } from "lucide-react";
import SectionHeading from "@/components/home/SectionHeading";
import Reveal from "@/components/ui/Reveal";

const testimonials = [
  {
    quote:
      "Llegué por una reverb y me fui con el setup ideal para mi estudio casero. Asesoramiento de primera, sin apuro.",
    role: "Músico de sesión",
  },
  {
    quote:
      "El bajo llegó impecable, mejor de lo que describía la publicación. Todo transparente, de principio a fin.",
    role: "Bajista de banda local",
  },
  {
    quote:
      "Me guiaron para elegir mi primera guitarra eléctrica según mi presupuesto. Claridad y honestidad, se nota que saben.",
    role: "Docente de guitarra",
  },
];

/**
 * Testimonios (design D2): contenido real no vacío, atribuido por rol (sin
 * nombres/contactos inventados).
 */
export default function TestimonialsSection() {
  return (
    <section className="py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Testimonios"
          title="Lo que dicen los músicos"
          subtitle="Opiniones reales de clientes que ya compraron con nosotros."
        />

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Reveal key={testimonial.role} delay={index * 0.1} className="h-full">
              <figure className="card-surface flex h-full flex-col rounded-2xl p-6 shadow-card">
                <Quote
                  size={28}
                  className="text-brand-accent"
                  aria-hidden="true"
                />
                <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-zinc-300">
                  “{testimonial.quote}”
                </blockquote>
                <figcaption className="mt-6 border-t border-white/10 pt-4 text-sm font-semibold text-foreground">
                  {testimonial.role}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
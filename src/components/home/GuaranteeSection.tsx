import { ShieldCheck, RefreshCcw, PackageCheck, MessageCircleHeart } from "lucide-react";
import SectionHeading from "@/components/home/SectionHeading";
import Reveal from "@/components/ui/Reveal";

const guarantees = [
  {
    icon: ShieldCheck,
    title: "Verificación previa",
    text: "Probamos, limpiamos y revisamos cada instrumento antes de publicarlo. Lo que ves es lo que está en nuestro poder.",
  },
  {
    icon: RefreshCcw,
    title: "Garantía oficial",
    text: "Los instrumentos nuevos incluyen garantía de fábrica; los usados, nuestra garantía de funcionamiento.",
  },
  {
    icon: PackageCheck,
    title: "Envío cuidadoso",
    text: "Embalaje profesional para que el instrumento llegue en el mismo estado en que salió.",
  },
  {
    icon: MessageCircleHeart,
    title: "Post-venta directo",
    text: "Quedamos a disposición por WhatsApp para dudas de setup, mantenimiento o lo que necesites.",
  },
];

/**
 * Garantía (design D2): compromisos reales del negocio, con CTA de contacto.
 */
export default function GuaranteeSection() {
  return (
    <section className="border-y border-white/5 bg-white/[0.02] py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Garantía"
          title="Comprá con confianza"
          subtitle="Asumimos la responsabilidad de cada instrumento que vendemos, antes y después de la compra."
        />

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {guarantees.map((item, index) => (
            <Reveal key={item.title} delay={index * 0.08} className="h-full">
              <div className="h-full rounded-2xl border border-white/10 bg-white/5 p-6">
                <item.icon
                  size={28}
                  className="text-brand-accent"
                  aria-hidden="true"
                />
                <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {item.text}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
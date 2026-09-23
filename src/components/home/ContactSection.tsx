import { MessageCircle, Mail, Phone, MapPin } from "lucide-react";
import SectionHeading from "@/components/home/SectionHeading";
import Reveal from "@/components/ui/Reveal";
import { business, generateWhatsAppLink } from "@/config/business";

/**
 * Sección Contacto — id="contact" (ancla de navbar/footer, spec
 * business-contact: canales reales visibles y CTA funcional). TODO desde
 * business config, cero hardcodeos.
 */
export default function ContactSection() {
  const whatsappLink = generateWhatsAppLink(
    "Hola! Quiero información sobre instrumentos"
  );

  const channels = [
    {
      icon: MessageCircle,
      label: "WhatsApp",
      value: business.phoneDisplay,
      href: whatsappLink,
      external: true,
      primary: true,
    },
    {
      icon: Mail,
      label: "Email",
      value: business.email,
      href: business.mailtoLink,
      external: false,
      primary: false,
    },
    {
      icon: Phone,
      label: "Teléfono",
      value: business.phoneDisplay,
      href: business.telLink,
      external: false,
      primary: false,
    },
  ];

  return (
    <section
      id="contact"
      className="relative scroll-mt-24 overflow-hidden py-20 md:py-24"
    >
      <div className="absolute inset-0 bg-glow-amber" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Contacto"
          title="Hablemos de tu próximo instrumento"
          subtitle="Respondemos consultas, coordinamos visitas y gestionamos envíos a todo el país."
        />

        <div className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
          {channels.map((channel, index) => (
            <Reveal key={channel.label} delay={index * 0.08} className="h-full">
              <a
                href={channel.href}
                target={channel.external ? "_blank" : undefined}
                rel={channel.external ? "noopener noreferrer" : undefined}
                className={`flex h-full items-center gap-4 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 ${
                  channel.primary
                    ? "bg-gradient-to-r from-brand-accent to-brand-accent-deep shadow-glow"
                    : "card-surface shadow-card hover:shadow-lifted"
                }`}
              >
                <channel.icon
                  size={28}
                  className={
                    channel.primary ? "text-brand-black" : "text-brand-accent"
                  }
                  aria-hidden="true"
                />
                <span>
                  <span
                    className={`block text-sm font-medium uppercase tracking-wider ${
                      channel.primary
                        ? "text-brand-black/80"
                        : "text-zinc-500"
                    }`}
                  >
                    {channel.label}
                  </span>
                  <span
                    className={`mt-0.5 block font-semibold ${
                      channel.primary
                        ? "text-brand-black"
                        : "text-foreground"
                    }`}
                  >
                    {channel.value}
                  </span>
                </span>
              </a>
            </Reveal>
          ))}

          <Reveal delay={0.24} className="h-full">
            <div className="card-surface flex h-full items-center gap-4 rounded-2xl p-5 shadow-card">
              <MapPin size={28} className="text-brand-accent" aria-hidden="true" />
              <span>
                <span className="block text-sm font-medium uppercase tracking-wider text-zinc-500">
                  Ubicación
                </span>
                <span className="mt-0.5 block font-semibold text-foreground">
                  {business.city}
                </span>
              </span>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
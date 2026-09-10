import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import Logo from "@/components/layout/Logo";

export default function ProductFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-brand-black border-t border-brand-gray mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Description */}
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-4 text-sm text-zinc-400 max-w-md">
              Instrumentos musicales de alta gama para músicos exigentes.
              Calidad premium y sonido excepcional en cada pieza.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Navegación
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-zinc-400 hover:text-brand-orange transition-colors">
                  Catálogo
                </Link>
              </li>
              <li>
                <Link href="/#about" className="text-sm text-zinc-400 hover:text-brand-orange transition-colors">
                  Nosotros
                </Link>
              </li>
              <li>
                <Link href="/#contact" className="text-sm text-zinc-400 hover:text-brand-orange transition-colors">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Contacto
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-zinc-400">
                <Phone size={16} className="text-brand-orange" />
                <a href="tel:+5491112345678" className="hover:text-brand-orange transition-colors">
                  +54 9 11 1234-5678
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm text-zinc-400">
                <Mail size={16} className="text-brand-orange" />
                <a href="mailto:info@soundtouch.com" className="hover:text-brand-orange transition-colors">
                  info@soundtouch.com
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm text-zinc-400">
                <MapPin size={16} className="text-brand-orange mt-0.5" />
                <span>Buenos Aires, Argentina</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-brand-gray">
          <p className="text-center text-sm text-zinc-500">
            © {currentYear} SoundTouch Instrumentos. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
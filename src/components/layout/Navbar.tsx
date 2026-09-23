"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Menu, X, Search, DollarSign } from "lucide-react";
import { useState } from "react";
import Logo from "./Logo";
import { clsx } from "clsx";
import { useCurrency } from "@/context/CurrencyContext";

const navLinks = [
  { href: "/", label: "Catálogo" },
  { href: "/#about", label: "Nosotros" },
  { href: "/#contact", label: "Contacto" },
];

/**
 * Navbar glass (design D2 / task 4.3): translúcida con backdrop blur, logo
 * por next/link, search + currency toggle funcionando, anclas #about/#contact
 * y menú mobile con aria-expanded/aria-controls (spec premium-design).
 */
export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currency, toggleCurrency } = useCurrency();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const isHomePage = pathname === "/";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    router.push(query ? `/?search=${encodeURIComponent(query)}` : "/");
    setIsMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-white/5 backdrop-blur-xl">
      <nav
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        aria-label="Navegación principal"
      >
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Logo />

          {/* Search Bar - Desktop */}
          {isHomePage && (
            <form
              onSubmit={handleSearch}
              className="hidden flex-1 max-w-md md:flex"
              role="search"
            >
              <div className="relative w-full">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                  size={18}
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar instrumento, modelo, marca..."
                  className="w-full rounded-full border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-foreground placeholder-zinc-500 transition-colors focus:border-brand-accent"
                  aria-label="Buscar instrumentos"
                />
              </div>
            </form>
          )}

          {/* Currency Toggle */}
          <button
            onClick={toggleCurrency}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:border-brand-accent/50 hover:text-brand-accent"
            aria-label={`Cambiar moneda (actual: ${currency})`}
          >
            <DollarSign size={16} aria-hidden="true" />
            <span>{currency}</span>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "text-sm font-medium transition-colors duration-200",
                  pathname === link.href
                    ? "text-brand-accent"
                    : "text-zinc-300 hover:text-brand-accent"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="rounded-lg p-2 text-zinc-300 transition-colors hover:bg-white/5 hover:text-brand-accent md:hidden"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Search */}
        {isHomePage && (
          <form onSubmit={handleSearch} className="pb-4 md:hidden" role="search">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                size={18}
                aria-hidden="true"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar instrumento, modelo, marca..."
                className="w-full rounded-full border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-foreground placeholder-zinc-500 transition-colors focus:border-brand-accent"
                aria-label="Buscar instrumentos"
              />
            </div>
          </form>
        )}

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-white/10 pb-4 pt-4 md:hidden"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={clsx(
                  "block rounded-lg px-2 py-2 text-sm font-medium transition-colors duration-200",
                  pathname === link.href
                    ? "text-brand-accent"
                    : "text-zinc-300 hover:bg-white/5 hover:text-brand-accent"
                )}
              >
                {link.label}
              </Link>
            ))}
          </motion.div>
        )}
      </nav>
    </header>
  );
}
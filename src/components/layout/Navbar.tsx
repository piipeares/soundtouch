"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Menu, X, Search, DollarSign, Heart, LogOut, User, Sparkles } from "lucide-react";
import { useState } from "react";
import Logo from "./Logo";
import { clsx } from "clsx";
import { useCurrency } from "@/context/CurrencyContext";
import { useAccount } from "@/context/AccountContext";

interface NavLink {
  href: string;
  label: string;
  highlight?: boolean;
}

const navLinks: NavLink[] = [
  { href: "/#asistente", label: "SoundMatch AI", highlight: true },
  { href: "/", label: "Catálogo" },
  { href: "/#about", label: "Nosotros" },
  { href: "/#contact", label: "Contacto" },
];

/** Nombre visible del usuario: nombre de perfil si existe, si no el email. */
function displayName(name: string | null, email: string | null): string {
  const trimmed = name?.trim();
  if (trimmed) return trimmed.split(" ")[0];
  return email ?? "músico";
}

/**
 * Navbar glass (design D2 / task 4.3 + task 4.6): translúcida con backdrop
 * blur, logo por next/link, search + currency toggle funcionando, anclas
 * #about/#contact, menú mobile con aria-expanded/aria-controls, contador de
 * favoritos (oculto sin sesión) y menú de cuenta (ingresar / salir).
 */
export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currency, toggleCurrency } = useCurrency();
  const { authenticated, email, name, favoriteIds, logout } = useAccount();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const isHomePage = pathname === "/";
  const favoritesCount = favoriteIds.length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    const target = query
      ? `/?search=${encodeURIComponent(query)}#catalogo`
      : "/#catalogo";
    void router.push(target);
    setIsMenuOpen(false);

    // El hash #catalogo scrollea al catálogo al navegar, pero si ya estamos
    // en el home (misma ruta, solo cambia el query/hash) el router puede
    // ignorar el scroll → fallback explícito. El <section id="catalogo">
    // tiene scroll-mt-24, así que scrollIntoView respeta el offset.
    requestAnimationFrame(() => {
      setTimeout(() => {
        document.getElementById("catalogo")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 50);
    });
  };

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
    router.push("/");
    router.refresh();
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

          {/* Favorites (solo con sesión) */}
          {authenticated && (
            <Link
              href="/favoritos"
              className="relative inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:border-brand-accent/50 hover:text-brand-accent"
              aria-label={`Favoritos (${favoritesCount})`}
            >
              <Heart
                size={16}
                aria-hidden="true"
                className={favoritesCount > 0 ? "fill-brand-accent text-brand-accent" : ""}
              />
              {favoritesCount > 0 && <span>{favoritesCount}</span>}
            </Link>
          )}

          {/* Account */}
          {authenticated ? (
            <div className="hidden items-center gap-2 md:flex">
              <Link
                href="/favoritos"
                className="max-w-[10rem] truncate text-sm font-medium text-zinc-300 transition-colors hover:text-brand-accent"
                title="Ir a mi perfil"
              >
                {displayName(name, email)}
              </Link>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:border-brand-accent/50 hover:text-brand-accent"
              >
                <LogOut size={16} aria-hidden="true" />
                Salir
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:border-brand-accent/50 hover:text-brand-accent md:inline-flex"
            >
              <User size={16} aria-hidden="true" />
              Ingresar
            </Link>
          )}

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-5 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "inline-flex items-center gap-1.5 text-sm font-medium transition-colors duration-200",
                  link.highlight
                    ? "rounded-full border border-brand-accent/40 bg-brand-accent/10 px-3 py-1.5 font-semibold text-brand-accent hover:bg-brand-accent/20"
                    : pathname === link.href
                    ? "text-brand-accent"
                    : "text-zinc-300 hover:text-brand-accent"
                )}
              >
                {link.highlight && <Sparkles size={14} aria-hidden="true" />}
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
                  "rounded-lg px-2 py-2 text-sm font-medium transition-colors duration-200",
                  link.highlight
                    ? "mb-1 flex items-center gap-2 rounded-xl border border-brand-accent/40 bg-brand-accent/10 font-semibold text-brand-accent"
                    : pathname === link.href
                    ? "block text-brand-accent"
                    : "block text-zinc-300 hover:bg-white/5 hover:text-brand-accent"
                )}
              >
                {link.highlight && <Sparkles size={16} aria-hidden="true" />}
                {link.label}
              </Link>
            ))}

            {/* Favoritos mobile */}
            {authenticated && (
              <Link
                href="/favoritos"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-zinc-300 hover:bg-white/5 hover:text-brand-accent"
              >
                <Heart size={16} aria-hidden="true" />
                Favoritos
                {favoritesCount > 0 && (
                  <span className="rounded-full bg-brand-accent px-2 py-0.5 text-xs font-bold text-brand-black">
                    {favoritesCount}
                  </span>
                )}
              </Link>
            )}

            {/* Cuenta mobile */}
            {authenticated ? (
              <>
                <Link
                  href="/favoritos"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-zinc-300 hover:bg-white/5 hover:text-brand-accent"
                >
                  <User size={16} aria-hidden="true" />
                  Mi perfil ({displayName(name, email)})
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-medium text-zinc-300 hover:bg-white/5 hover:text-brand-accent"
                >
                  <LogOut size={16} aria-hidden="true" />
                  Salir
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-zinc-300 hover:bg-white/5 hover:text-brand-accent"
              >
                <User size={16} aria-hidden="true" />
                Ingresar
              </Link>
            )}
          </motion.div>
        )}
      </nav>
    </header>
  );
}
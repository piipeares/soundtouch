"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Menu, X, Search, DollarSign } from "lucide-react";
import { useState, useEffect } from "react";
import Logo from "./Logo";
import { clsx } from "clsx";
import { useCurrency } from "@/context/CurrencyContext";

const navLinks = [
  { href: "/", label: "Catálogo" },
  { href: "/#about", label: "Nosotros" },
  { href: "/#contact", label: "Contacto" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currency, toggleCurrency } = useCurrency();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const isHomePage = pathname === "/";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearch(false);
    } else {
      // Si está vacío, resetear la búsqueda
      router.push("/");
    }
  };

  // Cleanup search cuando se borra el input
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    // Si se borra todo, resetear la URL
    if (value === "") {
      router.push("/");
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-brand-black/95 backdrop-blur-md border-b border-brand-gray">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Logo />

          {/* Search Bar - Desktop */}
          {isHomePage && (
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Buscar instrumento, modelo, marca..."
                  className="w-full pl-10 pr-4 py-2 bg-brand-gray border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-brand-orange transition-colors"
                />
              </div>
            </form>
          )}

          {/* Currency Toggle */}
          <button
            onClick={toggleCurrency}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-gray border border-zinc-700 rounded-lg text-sm font-medium text-zinc-300 hover:border-brand-orange hover:text-brand-orange transition-colors"
          >
            <DollarSign size={16} />
            <span>{currency}</span>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "text-sm font-medium transition-colors duration-200",
                  pathname === link.href
                    ? "text-brand-orange"
                    : "text-zinc-300 hover:text-brand-orange"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-zinc-300 hover:text-brand-orange transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Search */}
        {isHomePage && (
          <form onSubmit={handleSearch} className="md:hidden pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Buscar instrumento, modelo, marca..."
                className="w-full pl-10 pr-4 py-2 bg-brand-gray border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-brand-orange"
              />
            </div>
          </form>
        )}

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden pb-4 border-t border-brand-gray pt-4"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={clsx(
                  "block py-2 text-sm font-medium transition-colors duration-200",
                  pathname === link.href
                    ? "text-brand-orange"
                    : "text-zinc-300 hover:text-brand-orange"
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
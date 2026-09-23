import Link from "next/link";

/**
 * Logo del sitio. Server-safe (sin framer-motion ni "use client"):
 * task 4.3 pedía el logo por next/link para evitar full reloads
 * (antes era motion.a con href plano).
 */
export default function Logo() {
  return (
    <Link
      href="/"
      aria-label="SoundTouch Instrumentos — Inicio"
      className="group flex items-center gap-2"
    >
      {/* Icono de sonido ondas */}
      <svg
        width="36"
        height="36"
        viewBox="0 0 36 36"
        fill="none"
        className="text-brand-accent transition-transform duration-300 group-hover:scale-110"
      >
        <circle cx="18" cy="18" r="4" fill="currentColor" />
        <path
          d="M10 18C10 18 8 14 8 11C8 8 10 6 13 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-60 transition-opacity group-hover:opacity-100"
        />
        <path
          d="M14 18C14 18 14 14 14 10C14 7 17 6 20 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-40 transition-opacity group-hover:opacity-80"
        />
        <path
          d="M22 18C22 18 22 22 22 26C22 29 19 30 16 30"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-40 transition-opacity group-hover:opacity-80"
        />
        <path
          d="M26 18C26 18 28 22 28 25C28 28 26 30 23 30"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-60 transition-opacity group-hover:opacity-100"
        />
      </svg>

      {/* Texto del logo */}
      <span className="text-xl font-bold tracking-tight">
        <span className="text-foreground">Sound</span>
        <span className="text-brand-accent">Touch</span>
      </span>
    </Link>
  );
}
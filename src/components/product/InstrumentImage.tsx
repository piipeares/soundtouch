import Image from "next/image";

interface InstrumentImageProps {
  /** Ruta local (public/images/...) o vacía. Cualquier valor no-local (URLs
   * remotas, undefined) cae al placeholder premium de gradiente + iniciales. */
  src?: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  /** Clases extra para el elemento de imagen/placeholder (el contenedor del
   * caller debe ser `relative`). */
  className?: string;
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

/**
 * Imagen de instrumento (design D2 / task 4.7): imagen local vía next/image,
 * o placeholder generado por gradiente + iniciales cuando no hay imagen local
 * (spec premium-design: "Edge: asset missing → local placeholder; no broken
 * image"). NUNCA hace requests remotos (sin remotePatterns).
 */
export default function InstrumentImage({
  src,
  alt,
  sizes,
  priority,
  className,
}: InstrumentImageProps) {
  const isLocal = typeof src === "string" && src.startsWith("/");

  if (isLocal) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={`object-cover ${className ?? ""}`}
        unoptimized
      />
    );
  }

  const initials = initialsOf(alt);

  return (
    <div
      role="img"
      aria-label={alt}
      className={`absolute inset-0 overflow-hidden bg-gradient-to-br from-surface-raised via-surface to-brand-black ${className ?? ""}`}
    >
      <div className="absolute inset-0 bg-glow-amber" aria-hidden="true" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display text-6xl font-semibold tracking-tight text-brand-accent/70 select-none">
          {initials}
        </span>
      </div>
      <div
        className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-brand-black/80 to-transparent"
        aria-hidden="true"
      />
    </div>
  );
}
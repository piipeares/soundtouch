"use client";

import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { clsx } from "clsx";
import { useState } from "react";
import { useAccount } from "@/context/AccountContext";

interface FavoriteButtonProps {
  instrumentId: string;
  /** Variante overlay (card) o inline (detalle). */
  variant?: "overlay" | "inline";
  label?: string;
}

/**
 * Corazón de favoritos (design D5 / task 4.3): client island que usa el store
 * de AccountContext. Optimista (flip inmediato con revert), 401 → sesión
 * inválida (redirect /login), 404 → revert (instrumento no disponible).
 * Render un <button> real con aria-pressed (spec premium-design).
 */
export default function FavoriteButton({
  instrumentId,
  variant = "inline",
  label,
}: FavoriteButtonProps) {
  const router = useRouter();
  const { authenticated, isFavorite, toggleFavorite } = useAccount();
  const [pending, setPending] = useState(false);

  const favorited = isFavorite(instrumentId);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;

    if (!authenticated) {
      router.push("/login");
      return;
    }
    setPending(true);
    try {
      await toggleFavorite(instrumentId);
    } finally {
      setPending(false);
    }
  };

  const base =
    "inline-flex items-center justify-center rounded-full font-semibold transition-colors";

  if (variant === "overlay") {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={favorited ? "Quitar de favoritos" : "Agregar a favoritos"}
        aria-pressed={favorited}
        className={clsx(
          base,
          "p-2.5 shadow-card backdrop-blur-sm",
          favorited
            ? "bg-brand-accent text-brand-black hover:bg-brand-accent-bright"
            : "bg-white/10 text-white hover:bg-white/20",
          pending && "opacity-60"
        )}
      >
        <Heart
          size={18}
          className={favorited ? "fill-current" : ""}
          aria-hidden="true"
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={favorited ? "Quitar de favoritos" : "Agregar a favoritos"}
      aria-pressed={favorited}
      className={clsx(
        base,
        "gap-2 border px-5 py-3 text-sm",
        favorited
          ? "border-brand-accent bg-brand-accent text-brand-black hover:bg-brand-accent-bright"
          : "border-white/10 bg-white/5 text-foreground hover:border-brand-accent/50 hover:text-brand-accent",
        pending && "opacity-60"
      )}
    >
      <Heart
        size={18}
        className={favorited ? "fill-current" : ""}
        aria-hidden="true"
      />
      {label ?? (favorited ? "En favoritos" : "Agregar a favoritos")}
    </button>
  );
}
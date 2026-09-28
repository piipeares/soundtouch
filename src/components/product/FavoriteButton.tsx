"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
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
 *
 * Feedback al agregar: al completar un toggle que deja el instrumento en
 * favoritos, muestra un indicador transitorio con check ("Guardado" en la
 * card, "¡Agregado!" en el detalle) que desaparece solo a los ~1.6s.
 */
export default function FavoriteButton({
  instrumentId,
  variant = "inline",
  label,
}: FavoriteButtonProps) {
  const router = useRouter();
  const { authenticated, isFavorite, toggleFavorite } = useAccount();
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState(false);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const favorited = isFavorite(instrumentId);

  // Cleanup del timer si el componente se desmonta antes de ocultar el feedback.
  useEffect(() => {
    return () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    };
  }, []);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;

    if (!authenticated) {
      router.push("/login");
      return;
    }

    const wasFavorited = favorited;
    setPending(true);
    try {
      await toggleFavorite(instrumentId);
      // Solo festeja cuando la acción SUMÓ a favoritos (no al quitar).
      if (!wasFavorited && isFavorite(instrumentId)) {
        setFeedback(true);
        if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
        feedbackTimer.current = setTimeout(() => setFeedback(false), 1600);
      }
    } finally {
      setPending(false);
    }
  };

  const base =
    "inline-flex items-center justify-center rounded-full font-semibold transition-colors";

  if (variant === "overlay") {
    return (
      <div className="relative">
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

        {/* Indicador transitorio: "Guardado" sobre la card */}
        <AnimatePresence>
          {feedback && (
            <motion.span
              initial={{ opacity: 0, y: 4, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              className="absolute left-1/2 top-full mt-2 inline-flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-green-500 px-2.5 py-1 text-xs font-bold text-brand-black shadow-lifted"
              role="status"
            >
              <Check size={12} aria-hidden="true" />
              Guardado
            </motion.span>
          )}
        </AnimatePresence>
      </div>
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
      <AnimatePresence mode="wait" initial={false}>
        {feedback ? (
          <motion.span
            key="added"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="inline-flex items-center gap-2"
            role="status"
          >
            <Check size={18} aria-hidden="true" />
            ¡Agregado!
          </motion.span>
        ) : (
          <motion.span
            key="idle"
            initial={false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="inline-flex items-center gap-2"
          >
            <Heart
              size={18}
              className={favorited ? "fill-current" : ""}
              aria-hidden="true"
            />
            {label ?? (favorited ? "En favoritos" : "Agregar a favoritos")}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
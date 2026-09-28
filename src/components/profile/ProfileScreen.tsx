"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, History, LogOut, ArrowLeft, Pencil, Check, X } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import { useAccount } from "@/context/AccountContext";
import { useCurrency } from "@/context/CurrencyContext";
import {
  getRecentlyViewedSnapshot,
  getRecentlyViewedServerSnapshot,
  subscribeRecentlyViewed,
} from "@/lib/recentlyViewed";
import { Instrument } from "@/types";

interface ProfileScreenProps {
  /** Instrumentos disponibles en el catálogo (pasados desde la server page). */
  instruments: Instrument[];
}

/**
 * Pantalla de perfil de cliente (/favoritos): saludo con email, cierre de
 * sesión y dos secciones — "Vistos recientemente" (localStorage) y
 * "Guardados" (favoritos desde AccountContext). Reutiliza ProductCard para
 * mantener el patrón visual del catálogo (D2).
 *
 * Server page hace el guard de sesión (redirect si no hay sesión); acá solo
 * presentación + estado client.
 */
export default function ProfileScreen({ instruments }: ProfileScreenProps) {
  const router = useRouter();
  const { email, name, favoriteIds, updateName, logout } = useAccount();
  const { currency, toggleCurrency } = useCurrency();
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState("");

  const displayName = name?.trim() || email; // fallback: email si no hay nombre

  // Store externo suscribible (patrón CurrencyContext): snapshot server = []
  // evita hydration mismatch; tras hydrate se lee el localStorage real.
  const recentIds = useSyncExternalStore(
    subscribeRecentlyViewed,
    getRecentlyViewedSnapshot,
    getRecentlyViewedServerSnapshot
  );

  const byId = useMemo(() => {
    const map = new Map<string, Instrument>();
    instruments.forEach((item) => map.set(item.id, item));
    return map;
  }, [instruments]);

  const favorites = favoriteIds
    .map((id) => byId.get(id))
    .filter((item): item is Instrument => Boolean(item));

  const recentlyViewed = recentIds
    .map((id) => byId.get(id))
    .filter((item): item is Instrument => Boolean(item))
    .slice(0, 8);

  const handleLogout = async () => {
    await logout();
    router.push("/");
    router.refresh();
  };

  const startEditingName = () => {
    setNameDraft(name?.trim() || "");
    setNameError("");
    setEditingName(true);
  };

  const cancelEditingName = () => {
    setEditingName(false);
    setNameError("");
  };

  const saveName = async () => {
    const trimmed = nameDraft.trim();
    if (!trimmed) {
      setNameError("El nombre no puede estar vacío");
      return;
    }
    setNameSaving(true);
    setNameError("");
    try {
      await updateName(trimmed);
      setEditingName(false);
    } catch {
      setNameError("No se pudo guardar el nombre");
    } finally {
      setNameSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header del perfil */}
      <div className="mb-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-zinc-400 transition-colors hover:text-brand-accent"
        >
          <ArrowLeft size={18} />
          Volver al catálogo
        </Link>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-accent">
              Mi perfil
            </p>

            {editingName ? (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void saveName();
                    if (e.key === "Escape") cancelEditingName();
                  }}
                  maxLength={60}
                  autoFocus
                  aria-label="Tu nombre"
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-display text-2xl font-bold text-foreground outline-none transition-colors focus:border-brand-accent"
                />
                <button
                  onClick={() => void saveName()}
                  disabled={nameSaving}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand-accent px-4 py-2 text-sm font-semibold text-brand-black transition-colors hover:bg-brand-accent-bright disabled:opacity-50"
                >
                  <Check size={16} aria-hidden="true" />
                  {nameSaving ? "Guardando..." : "Guardar"}
                </button>
                <button
                  onClick={cancelEditingName}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-white/30"
                >
                  <X size={16} aria-hidden="true" />
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="mt-1 flex items-center gap-3">
                <h1 className="truncate font-display text-3xl font-bold text-foreground">
                  Hola, {displayName}
                </h1>
                <button
                  onClick={startEditingName}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-brand-accent/50 hover:text-brand-accent"
                  aria-label="Editar tu nombre"
                >
                  <Pencil size={14} aria-hidden="true" />
                  Editar
                </button>
              </div>
            )}
            {nameError && (
              <p className="mt-2 text-sm text-red-400" role="alert">
                {nameError}
              </p>
            )}
            <p className="mt-2 text-zinc-400">
              {email ?? "músico"} — tus instrumentos guardados y los que
              estuviste viendo.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleCurrency}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:border-brand-accent/50 hover:text-brand-accent"
              aria-label={`Cambiar moneda (actual: ${currency})`}
            >
              {currency === "USD" ? "$" : "AR$"} {currency}
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:border-red-500/50 hover:text-red-400"
            >
              <LogOut size={16} aria-hidden="true" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>

      {/* Vistos recientemente */}
      <section className="mb-14">
        <div className="mb-6 flex items-center gap-3">
          <History size={22} className="text-brand-accent" aria-hidden="true" />
          <h2 className="font-display text-2xl font-bold text-foreground">
            Vistos recientemente
          </h2>
        </div>

        {recentlyViewed.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recentlyViewed.map((instrument, index) => (
              <ProductCard
                key={instrument.id}
                instrument={instrument}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-10 text-center">
            <p className="text-zinc-400">
              Todavía no viste ningún instrumento en detalle.
            </p>
            <Link
              href="/"
              className="mt-4 inline-block text-sm font-medium text-brand-accent hover:underline"
            >
              Explorar el catálogo →
            </Link>
          </div>
        )}
      </section>

      {/* Guardados / Favoritos */}
      <section>
        <div className="mb-6 flex items-center gap-3">
          <Heart size={22} className="text-brand-accent" aria-hidden="true" />
          <h2 className="font-display text-2xl font-bold text-foreground">
            Guardados
          </h2>
          {favorites.length > 0 && (
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-zinc-400">
              {favorites.length} {favorites.length === 1 ? "instrumento" : "instrumentos"}
            </span>
          )}
        </div>

        {favorites.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favorites.map((instrument, index) => (
              <ProductCard
                key={instrument.id}
                instrument={instrument}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-10 text-center">
            <p className="text-zinc-400">
              Todavía no guardaste ningún instrumento.
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              Tocá el corazón en cualquier instrumento para guardarlo acá.
            </p>
            <Link
              href="/"
              className="mt-4 inline-block text-sm font-medium text-brand-accent hover:underline"
            >
              Buscar instrumentos →
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
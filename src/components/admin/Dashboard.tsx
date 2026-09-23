"use client";

import { Plus, LogOut } from "lucide-react";
import { Instrument } from "@/types";
import Logo from "@/components/layout/Logo";
import InstrumentGrid from "@/components/admin/InstrumentGrid";

interface DashboardProps {
  instruments: Instrument[];
  error: string;
  onNew: () => void;
  onLogout: () => void;
  onEdit: (instrument: Instrument) => void;
  onDelete: (id: string) => void;
}

/**
 * Panel del admin (task 4.8): shell premium noir+amber (header glass,
 * contador, banner de error) que compone la grilla. El estado del CRUD y la
 * sesión viven en admin/page.tsx; acá solo presentación + callbacks.
 */
export default function Dashboard({
  instruments,
  error,
  onNew,
  onLogout,
  onEdit,
  onDelete,
}: DashboardProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <Logo />
            <div className="flex items-center gap-3">
              <button
                onClick={onNew}
                className="inline-flex items-center gap-2 rounded-full bg-brand-accent px-4 py-2 text-sm font-semibold text-brand-black transition-colors hover:bg-brand-accent-bright"
              >
                <Plus size={18} aria-hidden="true" />
                Nuevo Instrumento
              </button>
              <button
                onClick={onLogout}
                className="inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-foreground"
              >
                <LogOut size={16} aria-hidden="true" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-accent">
              Panel
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold text-foreground md:text-3xl">
              Gestión de Instrumentos
            </h1>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-zinc-400">
            {instruments.length} en catálogo
          </span>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-400"
          >
            {error}
          </div>
        )}

        <InstrumentGrid
          instruments={instruments}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </main>
    </div>
  );
}
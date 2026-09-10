"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, Trash2, Edit2, X, Loader2 } from "lucide-react";
import {
  Instrument,
  Condition,
  InstrumentCategory,
  CATEGORY_LABELS,
  CONDITION_LABELS,
} from "@/types";
import { formatPrice } from "@/lib/utils";
import { validateInstrument, CATEGORIES, CONDITIONS } from "@/lib/catalog";
import Logo from "@/components/layout/Logo";

interface FormState {
  name: string;
  description: string;
  price: string;
  image: string;
  category: InstrumentCategory;
  brand: string;
  model: string;
  featured: boolean;
  condition: Condition;
  offerPrice: string;
  discountPercentage: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  price: "",
  image: "",
  category: "guitarra-electrica",
  brand: "",
  model: "",
  featured: false,
  condition: "nuevo",
  offerPrice: "",
  discountPercentage: "",
};

export default function AdminPage() {
  const router = useRouter();
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const loadInstruments = useCallback(async () => {
    try {
      const res = await fetch("/api/instruments");
      const data = await res.json();
      setInstruments(data);
    } catch (loadError) {
      console.error("Error loading instruments:", loadError);
    }
  }, []);

  // Auth check: una sola vez al montar (single redirect máx, sin loop).
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/auth");
        if (!res.ok) {
          router.push("/admin/login");
          return;
        }
        await loadInstruments();
      } catch {
        router.push("/admin/login");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [router, loadInstruments]);

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/admin/login");
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setError("");
    setShowForm(false);
    setEditingId(null);
  };

  const startEdit = (instrument: Instrument) => {
    setEditingId(instrument.id);
    setError("");
    setForm({
      name: instrument.name,
      description: instrument.description,
      price: String(instrument.price),
      image: instrument.image,
      category: instrument.category,
      brand: instrument.brand,
      model: instrument.model ?? "",
      featured: instrument.featured ?? false,
      condition: instrument.condition ?? "nuevo",
      offerPrice:
        instrument.offerPrice !== undefined ? String(instrument.offerPrice) : "",
      discountPercentage:
        instrument.discountPercentage !== undefined
          ? String(instrument.discountPercentage)
          : "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    // Validación client-side con el MISMO validador del server
    // (validateInstrument): name/brand/model/price obligatorios,
    // price > 0, offerPrice < price, category/condition válidas.
    const result = validateInstrument(form);
    if (!result.ok) {
      setError(result.errors.join(". "));
      setSaving(false);
      return;
    }

    // Branch correcto: editingId → PUT (nunca duplica), si no → POST.
    const url = editingId
      ? `/api/instruments/${editingId}`
      : "/api/instruments";
    const method = editingId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.instrument),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Error al guardar el instrumento");
        return;
      }

      if (editingId) {
        setInstruments(
          instruments.map((item) => (item.id === editingId ? data : item))
        );
      } else {
        setInstruments([...instruments, data]);
      }
      resetForm();
    } catch (submitError) {
      console.error("Error saving:", submitError);
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Estás seguro de eliminar este instrumento?")) return;

    try {
      const res = await fetch(`/api/instruments/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Error al eliminar el instrumento");
        return;
      }
      setInstruments(instruments.filter((item) => item.id !== id));
    } catch (deleteError) {
      console.error("Error deleting:", deleteError);
      setError("Error de conexión");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-orange" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-black">
      {/* Header */}
      <header className="bg-brand-black/95 backdrop-blur-md border-b border-brand-gray sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo />
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setError("");
                  setShowForm(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-orange text-brand-black font-semibold rounded-lg hover:bg-brand-orange-hover transition-colors"
              >
                <Plus size={20} />
                Nuevo Instrumento
              </button>
              <button
                onClick={handleLogout}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-white mb-8">
          Gestión de Instrumentos ({instruments.length})
        </h1>

        {error && !showForm && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Instruments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {instruments.map((instrument) => (
            <div
              key={instrument.id}
              className="bg-brand-gray rounded-xl overflow-hidden border border-zinc-800"
            >
              <div className="relative aspect-video">
                <Image
                  src={instrument.image}
                  alt={instrument.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-brand-orange uppercase">
                      {instrument.brand}
                    </span>
                    <h3 className="text-white font-semibold truncate">
                      {instrument.name}
                    </h3>
                    <p className="text-zinc-400 text-sm">
                      {formatPrice(instrument.price)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => startEdit(instrument)}
                    className="flex-1 inline-flex items-center justify-center gap-1 py-2 bg-zinc-700 text-white text-sm rounded-lg hover:bg-zinc-600 transition-colors"
                  >
                    <Edit2 size={14} />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(instrument.id)}
                    className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                    aria-label={`Eliminar ${instrument.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-gray rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-zinc-800">
              <h2 className="text-xl font-bold text-white">
                {editingId ? "Editar Instrumento" : "Nuevo Instrumento"}
              </h2>
              <button
                onClick={resetForm}
                className="p-2 text-zinc-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-2">
                    Nombre
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 bg-brand-black border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-brand-orange"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-zinc-300 mb-2">
                    Descripción
                  </label>
                  <textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-brand-black border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-brand-orange resize-none"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-zinc-300 mb-2">
                    Precio (USD)
                  </label>
                  <input
                    id="price"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full px-4 py-3 bg-brand-black border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-brand-orange"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-zinc-300 mb-2">
                    Categoría
                  </label>
                  <select
                    id="category"
                    value={form.category}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        category: e.target.value as InstrumentCategory,
                      })
                    }
                    className="w-full px-4 py-3 bg-brand-black border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-brand-orange"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_LABELS[cat]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="condition" className="block text-sm font-medium text-zinc-300 mb-2">
                    Condición
                  </label>
                  <select
                    id="condition"
                    value={form.condition}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        condition: e.target.value as Condition,
                      })
                    }
                    className="w-full px-4 py-3 bg-brand-black border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-brand-orange"
                  >
                    {CONDITIONS.map((cond) => (
                      <option key={cond} value={cond}>
                        {CONDITION_LABELS[cond]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="offerPrice" className="block text-sm font-medium text-zinc-300 mb-2">
                    Precio de Oferta (USD)
                  </label>
                  <input
                    id="offerPrice"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.offerPrice}
                    onChange={(e) => setForm({ ...form, offerPrice: e.target.value })}
                    className="w-full px-4 py-3 bg-brand-black border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-brand-orange"
                    placeholder="Opcional"
                  />
                </div>

                <div>
                  <label htmlFor="discountPercentage" className="block text-sm font-medium text-zinc-300 mb-2">
                    Descuento (%)
                  </label>
                  <input
                    id="discountPercentage"
                    type="number"
                    min="0"
                    max="100"
                    value={form.discountPercentage}
                    onChange={(e) =>
                      setForm({ ...form, discountPercentage: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-brand-black border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-brand-orange"
                    placeholder="Ej: 15"
                  />
                </div>

                <div>
                  <label htmlFor="brand" className="block text-sm font-medium text-zinc-300 mb-2">
                    Marca
                  </label>
                  <input
                    id="brand"
                    type="text"
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    className="w-full px-4 py-3 bg-brand-black border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-brand-orange"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="model" className="block text-sm font-medium text-zinc-300 mb-2">
                    Modelo
                  </label>
                  <input
                    id="model"
                    type="text"
                    value={form.model}
                    onChange={(e) => setForm({ ...form, model: e.target.value })}
                    className="w-full px-4 py-3 bg-brand-black border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-brand-orange"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="image" className="block text-sm font-medium text-zinc-300 mb-2">
                    URL de Imagen
                  </label>
                  <input
                    id="image"
                    type="url"
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                    className="w-full px-4 py-3 bg-brand-black border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-brand-orange"
                    placeholder="https://..."
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.featured}
                      onChange={(e) =>
                        setForm({ ...form, featured: e.target.checked })
                      }
                      className="w-5 h-5 rounded bg-brand-black border-zinc-700 text-brand-orange focus:ring-brand-orange focus:ring-offset-0"
                    />
                    <span className="text-sm text-zinc-300">Instrumento destacado</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-3 border border-zinc-700 text-white rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-brand-orange text-brand-black font-semibold rounded-lg hover:bg-brand-orange-hover transition-colors disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, Trash2, Edit2, X, Loader2 } from "lucide-react";
import { Instrument, CATEGORY_LABELS, CONDITION_LABELS } from "@/types";
import { formatPrice } from "@/lib/utils";
import Logo from "@/components/layout/Logo";

const CATEGORIES = [
  "guitarra-electrica", 
  "guitarra-acustica", 
  "guitarra-clasica",
  "bajo-electrico",
  "bajo-acustico",
  "otro-instrumento",
  "pedal",
  "accesorio",
  "parte"
];

const CONDITIONS = ["nuevo", "usado", "usado-casi-nuevo", "reacondicionado"];

export default function AdminPage() {
  const router = useRouter();
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    image: "",
    category: "guitarra-electrica",
    brand: "",
    model: "",
    featured: false,
    condition: "nuevo" as const,
    offerPrice: "",
    discountPercentage: "",
  });

  // Check auth
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth");
      if (!res.ok) {
        router.push("/admin/login");
      } else {
        loadInstruments();
      }
    } catch {
      router.push("/admin/login");
    }
  };

  const loadInstruments = async () => {
    try {
      const res = await fetch("/api/instruments");
      const data = await res.json();
      setInstruments(data);
    } catch (error) {
      console.error("Error loading instruments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/admin/login");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/instruments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        const newInstrument = await res.json();
        setInstruments([...instruments, newInstrument]);
        resetForm();
      }
    } catch (error) {
      console.error("Error saving:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este instrumento?")) return;

    try {
      await fetch(`/api/instruments/${id}`, { method: "DELETE" });
      setInstruments(instruments.filter((i) => i.id !== id));
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  const resetForm = () => {
    setForm({
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
    });
    setShowForm(false);
    setEditingId(null);
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
                onClick={() => setShowForm(true)}
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
                    onClick={() => {
                      setEditingId(instrument.id);
                      setForm({
                        name: instrument.name,
                        description: instrument.description,
                        price: String(instrument.price),
                        image: instrument.image,
                        category: instrument.category,
                        brand: instrument.brand,
                        model: instrument.model || "",
                        featured: instrument.featured || false,
                        condition: (instrument.condition || "nuevo") as any,
                        offerPrice: instrument.offerPrice ? String(instrument.offerPrice) : "",
                        discountPercentage: instrument.discountPercentage ? String(instrument.discountPercentage) : "",
                      });
                      setShowForm(true);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1 py-2 bg-zinc-700 text-white text-sm rounded-lg hover:bg-zinc-600 transition-colors"
                  >
                    <Edit2 size={14} />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(instrument.id)}
                    className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 bg-brand-black border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-brand-orange"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-brand-black border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-brand-orange resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Precio (USD)
                  </label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full px-4 py-3 bg-brand-black border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-brand-orange"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Categoría
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-4 py-3 bg-brand-black border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-brand-orange"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Condición
                  </label>
                  <select
                    value={form.condition}
                    onChange={(e) => setForm({ ...form, condition: e.target.value as any })}
                    className="w-full px-4 py-3 bg-brand-black border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-brand-orange"
                  >
                    {CONDITIONS.map((cond) => (
                      <option key={cond} value={cond}>
                        {CONDITION_LABELS[cond as keyof typeof CONDITION_LABELS]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Precio de Oferta (USD)
                  </label>
                  <input
                    type="number"
                    value={form.offerPrice}
                    onChange={(e) => setForm({ ...form, offerPrice: e.target.value })}
                    className="w-full px-4 py-3 bg-brand-black border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-brand-orange"
                    placeholder="Opcional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Descuento (%)
                  </label>
                  <input
                    type="number"
                    value={form.discountPercentage}
                    onChange={(e) => setForm({ ...form, discountPercentage: e.target.value })}
                    className="w-full px-4 py-3 bg-brand-black border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-brand-orange"
                    placeholder="Ej: 15"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Marca
                  </label>
                  <input
                    type="text"
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    className="w-full px-4 py-3 bg-brand-black border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-brand-orange"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Modelo
                  </label>
                  <input
                    type="text"
                    value={form.model}
                    onChange={(e) => setForm({ ...form, model: e.target.value })}
                    className="w-full px-4 py-3 bg-brand-black border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-brand-orange"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    URL de Imagen
                  </label>
                  <input
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
                      onChange={(e) => setForm({ ...form, featured: e.target.checked })}
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
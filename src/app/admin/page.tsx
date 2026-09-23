"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Instrument } from "@/types";
import Dashboard from "@/components/admin/Dashboard";
import InstrumentFormModal from "@/components/admin/InstrumentFormModal";

/**
 * Panel admin (task 4.8 reescrito): orquestación de sesión + estado del CRUD
 * (lista, grabando, errores, branch editar/crear). La UI se extrajo a
 * Dashboard / InstrumentGrid / InstrumentFormModal; el CRUD queda intacto.
 */
export default function AdminPage() {
  const router = useRouter();
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
    setShowForm(false);
    setEditingId(null);
    setError("");
  };

  const startEdit = (instrument: Instrument) => {
    setEditingId(instrument.id);
    setError("");
    setShowForm(true);
  };

  const handleNew = () => {
    setEditingId(null);
    setError("");
    setShowForm(true);
  };

  // Branch correcto: editingId → PUT (nunca duplica), si no → POST.
  // El payload ya está validado client-side por InstrumentFormModal.
  const handleSave = async (payload: Omit<Instrument, "id">) => {
    setSaving(true);
    setError("");

    const url = editingId
      ? `/api/instruments/${editingId}`
      : "/api/instruments";
    const method = editingId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Error al guardar el instrumento");
        return;
      }

      if (editingId) {
        setInstruments((list) =>
          list.map((item) => (item.id === editingId ? data : item))
        );
      } else {
        setInstruments((list) => [...list, data]);
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
      setInstruments((list) => list.filter((item) => item.id !== id));
    } catch (deleteError) {
      console.error("Error deleting:", deleteError);
      setError("Error de conexión");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="animate-spin text-brand-accent" size={48} />
      </div>
    );
  }

  const editingInstrument = editingId
    ? instruments.find((item) => item.id === editingId) ?? null
    : null;

  return (
    <>
      <Dashboard
        instruments={instruments}
        error={error}
        onNew={handleNew}
        onLogout={handleLogout}
        onEdit={startEdit}
        onDelete={handleDelete}
      />

      {showForm && (
        <InstrumentFormModal
          key={editingId ?? "new"}
          instrument={editingInstrument}
          saving={saving}
          error={error}
          onCancel={resetForm}
          onSave={handleSave}
        />
      )}
    </>
  );
}
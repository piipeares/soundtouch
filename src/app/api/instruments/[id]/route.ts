import { NextRequest, NextResponse } from "next/server";
import {
  getInstrumentById,
  mutateInstruments,
} from "@/lib/store/instruments";
import { validateInstrument } from "@/lib/catalog";
import { requireSession } from "@/lib/auth";

/**
 * GET /api/instruments/[id] — un instrumento por id; 404 si no existe.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const instrument = getInstrumentById(id);
    if (!instrument) {
      return NextResponse.json(
        { error: "Instrumento no encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json(instrument);
  } catch {
    return NextResponse.json(
      { error: "Error al leer el catálogo" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/instruments/[id] — edita un instrumento existente (NUNCA crea
 * duplicados: si el id no existe → 404). Valida el payload → 400 si no
 * cumple; persiste (mutex) y revalida "/" + "/producto/[id]".
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Mutación: requiere sesión admin válida (401 sin cookie).
  const unauthorized = await requireSession();
  if (unauthorized) return unauthorized;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "JSON inválido en el body" },
      { status: 400 }
    );
  }

  const result = validateInstrument(body);
  if (!result.ok) {
    return NextResponse.json(
      { error: "Datos inválidos", fields: result.errors },
      { status: 400 }
    );
  }

  try {
    const existing = getInstrumentById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Instrumento no encontrado" },
        { status: 404 }
      );
    }
    const instrument = { ...result.instrument, id };
    await mutateInstruments((list) =>
      list.map((item) => (item.id === id ? instrument : item))
    );
    return NextResponse.json(instrument);
  } catch {
    return NextResponse.json(
      { error: "Error al actualizar el instrumento" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/instruments/[id] — elimina un instrumento; 404 si no existe.
 * Persiste (mutex) y revalida "/" + "/producto/[id]".
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Mutación: requiere sesión admin válida (401 sin cookie).
  const unauthorized = await requireSession();
  if (unauthorized) return unauthorized;

  try {
    const existing = getInstrumentById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Instrumento no encontrado" },
        { status: 404 }
      );
    }
    await mutateInstruments((list) => list.filter((item) => item.id !== id));
    return NextResponse.json({ success: true, id });
  } catch {
    return NextResponse.json(
      { error: "Error al eliminar el instrumento" },
      { status: 500 }
    );
  }
}
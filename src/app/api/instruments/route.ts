import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { readInstruments, mutateInstruments } from "@/lib/store/instruments";
import { validateInstrument } from "@/lib/catalog";

/**
 * GET /api/instruments — lista el catálogo desde el JSON store
 * (auto-siembra data/instruments.json si falta o está corrupto).
 */
export async function GET() {
  try {
    return NextResponse.json(readInstruments());
  } catch {
    return NextResponse.json(
      { error: "Error al leer el catálogo" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/instruments — crea un instrumento.
 * Valida el payload (brand/model/price obligatorios, price > 0,
 * offerPrice < price, category válida) → 400 si no cumple.
 * Genera id único, persiste (mutex) y revalida "/" y "/producto/[id]".
 */
export async function POST(request: NextRequest) {
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
    const instrument = { ...result.instrument, id: randomUUID() };
    await mutateInstruments((list) => [...list, instrument]);
    return NextResponse.json(instrument, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Error al guardar el instrumento" },
      { status: 500 }
    );
  }
}
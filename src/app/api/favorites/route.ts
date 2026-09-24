import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireCustomerSession } from "@/lib/auth";
import { getFavorites, toggleFavorite } from "@/lib/store/favorites";
import { readInstruments } from "@/lib/store/instruments";

export async function GET() {
  const session = await requireCustomerSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const favorites = getFavorites(session.sub);
  return NextResponse.json({ favorites });
}

export async function POST(req: NextRequest) {
  const session = await requireCustomerSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const instrumentId = b.instrumentId;
  if (typeof instrumentId !== "string" || instrumentId.trim() === "") {
    return NextResponse.json(
      { error: "instrumentId requerido" },
      { status: 400 }
    );
  }

  const id = instrumentId.trim();
  const exists = readInstruments().some((i) => i.id === id);
  if (!exists) {
    return NextResponse.json(
      { error: "Instrumento no encontrado" },
      { status: 404 }
    );
  }

  const favorites = toggleFavorite(session.sub, id);
  revalidatePath("/favoritos");
  revalidatePath("/");

  return NextResponse.json({
    favorited: favorites.includes(id),
    favorites,
  });
}
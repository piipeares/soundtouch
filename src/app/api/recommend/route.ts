import generatedSongsRaw from "@/data/songs.generated.json";
import { instruments as seedInstruments } from "@/lib/seed";
import { readInstruments } from "@/lib/store/instruments";
import {
  CURATED_SONGS,
  expandGeneratedSongs,
  recommendInstruments,
  type GeneratedSong,
} from "@/lib/songMatcher";
import type { SongProfile } from "@/lib/songMatcher";
import type { Instrument } from "@/types";

/**
 * POST /api/recommend — SoundMatch.
 *
 * Body: { query: string }
 * Respuesta: RecommendResult (canción detectada + 2-3 instrumentos con rol,
 * afinidad y explicación).
 *
 * El catálogo se lee del store y, si el filesystem no está disponible (por
 * ejemplo en un runtime serverless de solo lectura), cae al seed en memoria.
 * Nunca depende de servicios externos ni de API keys.
 */

/**
 * Base curada (100 canciones con roles/tags a medida) + dataset masivo
 * (~3.000 canciones con perfil estimado por género). Se arma una sola vez
 * por proceso: el JSON no viaja al cliente.
 */
const ALL_SONGS: SongProfile[] = [
  ...CURATED_SONGS,
  ...expandGeneratedSongs(generatedSongsRaw as unknown as GeneratedSong[]),
];

function catalog(): Instrument[] {
  try {
    const stored = readInstruments();
    if (stored.length > 0) return stored;
  } catch {
    // Serverless read-only / archivo ausente: usar el seed en memoria.
  }
  return seedInstruments;
}

/** JSON con charset explícito (tildes y eñes correctas en cualquier cliente). */
function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return json({ error: "El cuerpo debe ser JSON válido." }, 400);
  }

  const query =
    body !== null &&
    typeof body === "object" &&
    "query" in body &&
    typeof (body as { query: unknown }).query === "string"
      ? (body as { query: string }).query.trim()
      : "";

  if (query.length < 2) {
    return json(
      { error: "Escribí al menos 2 caracteres (canción, artista o estilo)." },
      400
    );
  }

  if (query.length > 120) {
    return json(
      { error: "La búsqueda no puede superar los 120 caracteres." },
      400
    );
  }

  return json(recommendInstruments(query, catalog(), ALL_SONGS));
}

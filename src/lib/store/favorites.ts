import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

// Store de favoritos sobre un archivo JSON local: data/favorites.json.
// Mismo patrón que instruments.ts: seed/reseed automático si el archivo
// falta o está corrupto, y escrituras serializadas con un mutex en memoria
// (promise chain) para evitar write races entre requests concurrentes.
//
// Backend-only: NO revalida páginas (los favoritos no afectan páginas
// server-rendered estáticas; el estado client se sincroniza vía /api/favorites).
//
// Shape: { favorites: { [userId]: string[] } } — semántica de conjunto por
// usuario: un instrumento está o no está (nunca repetido).
//
// LÍMITE (ver README): store de archivo local = single-process. Sirve para
// dev y un VPS de instancia única; en serverless multi-instancia el
// filesystem no es compartido y se necesitaría una DB real.

export type FavoriteMap = Record<string, string[]>;

export interface FavoritesFile {
  favorites: FavoriteMap;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "favorites.json");

// ---------------------------------------------------------------------------
// Mutex: encadena promesas para serializar las escrituras.
// ---------------------------------------------------------------------------
let writeChain: Promise<unknown> = Promise.resolve();

function withWriteLock<T>(action: () => T | Promise<T>): Promise<T> {
  const run = writeChain.then(action);
  // Si falla, la cadena sigue viva para los próximos requests.
  writeChain = run.catch(() => undefined);
  return run;
}

function isFavoritesFile(value: unknown): value is FavoritesFile {
  if (value === null || typeof value !== "object") return false;
  const favorites = (value as FavoritesFile).favorites;
  if (
    favorites === null ||
    typeof favorites !== "object" ||
    Array.isArray(favorites)
  ) {
    return false;
  }
  return Object.values(favorites as Record<string, unknown>).every(
    (list) => Array.isArray(list) && list.every((id) => typeof id === "string")
  );
}

/** Siembra (o re-siembra) el archivo con un mapa vacío. */
function seedStore(): FavoriteMap {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DATA_FILE, JSON.stringify({ favorites: {} }, null, 2), "utf8");
  return {};
}

function readRaw(): FavoriteMap {
  try {
    const raw = readFileSync(DATA_FILE, "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (isFavoritesFile(parsed)) return parsed.favorites;
    // Archivo presente pero con shape inválido → reseed controlado.
    console.warn(
      "[store] data/favorites.json con formato inesperado; reseed a mapa vacío"
    );
    return seedStore();
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      // Primera corrida: el archivo todavía no existe.
      return seedStore();
    }
    // JSON corrupto u otro error de lectura → reseed controlado.
    console.warn(
      "[store] no se pudo leer data/favorites.json; reseed a mapa vacío:",
      error
    );
    return seedStore();
  }
}

function writeRaw(favorites: FavoriteMap): void {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DATA_FILE, JSON.stringify({ favorites }, null, 2), "utf8");
}

/** Sanea un lote de ids: strings no vacíos, dedupe (semántica de conjunto). */
function sanitizeList(ids: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    const trimmed = typeof id === "string" ? id.trim() : "";
    if (trimmed.length > 0 && !seen.has(trimmed)) {
      seen.add(trimmed);
      out.push(trimmed);
    }
  }
  return out;
}

function isNonEmptyId(id: string): boolean {
  return typeof id === "string" && id.trim().length > 0;
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/** Mapa completo de favoritos (copia defensiva: nunca expone el estado interno). */
export function readFavorites(): FavoriteMap {
  const map = readRaw();
  return Object.fromEntries(
    Object.entries(map).map(([userId, ids]) => [userId, [...ids]])
  );
}

/** Devuelve la lista de favoritos del usuario (copia; [] si no tiene). */
export function getFavorites(userId: string): string[] {
  return [...(readRaw()[userId] ?? [])];
}

/**
 * Sobrescribe los favoritos del usuario. Escritura serializada (mutex).
 * Los ids se sanean (no vacíos, sin duplicados) antes de persistir.
 */
export function writeFavorites(favorites: FavoriteMap): Promise<FavoriteMap> {
  return withWriteLock(() => {
    const next: FavoriteMap = {};
    for (const [userId, ids] of Object.entries(favorites)) {
      next[userId] = sanitizeList(ids);
    }
    writeRaw(next);
    return next;
  });
}

/**
 * Setea los favoritos del usuario a una lista exacta (semántica de conjunto).
 * Escritura serializada (mutex). Devuelve la lista persistida.
 */
export function setFavorites(userId: string, ids: string[]): Promise<string[]> {
  return withWriteLock(() => {
    const next = sanitizeList(ids);
    const map = readRaw();
    map[userId] = next;
    writeRaw(map);
    return [...next];
  });
}

/**
 * Toggle idempotente: agrega el id si falta, lo quita si existe.
 * Semántica de conjunto bajo mutex (read-modify-write atómico — sin lost
 * updates entre requests concurrentes). Un id vacío/inválido es no-op sin
 * escritura. Devuelve la lista resultante del usuario.
 */
export function toggleFavorite(
  userId: string,
  instrumentId: string
): Promise<string[]> {
  return withWriteLock(() => {
    const map = readRaw();
    const list = map[userId] ?? [];
    if (!isNonEmptyId(instrumentId)) return [...list]; // no-op, sin escritura
    const next = list.includes(instrumentId)
      ? list.filter((id) => id !== instrumentId)
      : [...list, instrumentId];
    if (next !== list) {
      map[userId] = next;
      writeRaw(map);
    }
    return [...next];
  });
}

/**
 * Quita un favorito explícito. Idempotente: remover un id ausente responde
 * sin error y sin escritura. Un id vacío/inválido es no-op. Devuelve la
 * lista resultante del usuario.
 */
export function removeFavorite(
  userId: string,
  instrumentId: string
): Promise<string[]> {
  return withWriteLock(() => {
    const map = readRaw();
    const list = map[userId] ?? [];
    if (!isNonEmptyId(instrumentId) || !list.includes(instrumentId)) {
      return [...list]; // no-op, sin escritura
    }
    const next = list.filter((id) => id !== instrumentId);
    map[userId] = next;
    writeRaw(map);
    return [...next];
  });
}
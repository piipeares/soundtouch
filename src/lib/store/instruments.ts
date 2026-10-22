import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { Instrument } from "@/types";
import { instruments as seedInstruments } from "@/lib/seed";
import { findInstrumentById } from "@/lib/catalog";

// Store del catálogo sobre un archivo JSON local: data/instruments.json.
//
// - Seed automático: si el archivo no existe (primera corrida) o está corrupto
//   (JSON inválido / shape incorrecto), se regenera desde src/lib/seed.ts
//   (reseed controlado; GET nunca crashea por datos faltantes).
// - Escrituras serializadas con un mutex en memoria (promise chain) para
//   evitar write races entre requests concurrentes en el mismo proceso.
// - Tras cada escritura exitosa se revalida "/" y "/producto/[id]" para que
//   home y detalle reflejen los cambios (revalidatePath).
//
// LÍMITE (ver README): store de archivo local = single-process. Sirve para
// dev y un VPS de instancia única; en serverless multi-instancia el filesystem
// no es compartido y se necesitaría una DB real.

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "instruments.json");

// ---------------------------------------------------------------------------
// Mutex: encadena promesas para serializar las escrituras.
// ---------------------------------------------------------------------------
let writeChain: Promise<unknown> = Promise.resolve();

function withWriteLock<T>(action: () => T): Promise<T> {
  const run = writeChain.then(action);
  // Si falla, la cadena sigue viva para los próximos requests.
  writeChain = run.catch(() => undefined);
  return run;
}

// ---------------------------------------------------------------------------
// Lectura / escritura crudas (sin lock: el lock lo ponen los métodos públicos
// que escriben; las lecturas puras no necesitan serialización).
// ---------------------------------------------------------------------------
function isInstrumentArray(value: unknown): value is Instrument[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item !== null &&
        typeof item === "object" &&
        typeof (item as Instrument).id === "string" &&
        typeof (item as Instrument).name === "string" &&
        typeof (item as Instrument).price === "number"
    )
  );
}

/**
 * Siembra (o re-siembra) el archivo con los datos de seed.ts.
 *
 * En Vercel/serverless el filesystem es de solo lectura: si no se puede
 * persistir, devolvemos el seed en memoria para que las páginas y fichas
 * sigan renderizando. El store persistente sigue siendo single-process.
 */
function seedStore(): Instrument[] {
  try {
    mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(DATA_FILE, JSON.stringify(seedInstruments, null, 2), "utf8");
  } catch (error) {
    console.warn(
      "[store] no se pudo persistir el seed (filesystem read-only); usando seed en memoria:",
      error
    );
  }
  return [...seedInstruments];
}

function readRaw(): Instrument[] {
  try {
    const raw = readFileSync(DATA_FILE, "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (isInstrumentArray(parsed)) return parsed;
    // Archivo presente pero con shape inválido → reseed controlado.
    console.warn(
      "[store] data/instruments.json con formato inesperado; reseed desde seed.ts"
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
      "[store] no se pudo leer data/instruments.json; reseed desde seed.ts:",
      error
    );
    return seedStore();
  }
}

function writeRaw(list: Instrument[]): void {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), "utf8");
}

function revalidateCatalog(): void {
  revalidatePath("/");
  revalidatePath("/producto/[id]", "page");
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/** Lista completa del catálogo (auto-siembra si falta/corrompe el archivo). */
export function readInstruments(): Instrument[] {
  return readRaw();
}

/**
 * Sobrescribe el catálogo completo. Escritura serializada (mutex) y
 * revalidación de "/" + "/producto/[id]" tras persistir.
 */
export function writeInstruments(list: Instrument[]): Promise<Instrument[]> {
  return withWriteLock(() => {
    writeRaw(list);
    revalidateCatalog();
    return list;
  });
}

/**
 * Lectura + mutación + escritura atómica bajo el mutex: el read-modify-write
 * completo queda serializado, así dos mutations concurrentes no se pisan.
 * Devuelve la lista resultante.
 */
export function mutateInstruments(
  mutator: (list: Instrument[]) => Instrument[]
): Promise<Instrument[]> {
  return withWriteLock(() => {
    const next = mutator(readRaw());
    writeRaw(next);
    revalidateCatalog();
    return next;
  });
}

/** Busca un instrumento por id (lee del store). */
export function getInstrumentById(id: string): Instrument | undefined {
  return findInstrumentById(readRaw(), id);
}
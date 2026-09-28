// Vistos recientemente (client-only) con store externo suscribible.
//
// Mismo patrón que CurrencyContext/AccountContext: se guardan ids de
// instrumentos en localStorage (key fija, máx 12, más reciente primero) y se
// notifica a listeners para consumo vía useSyncExternalStore. NO toca el
// server ni las cookies → el ISR de /producto/[id] y la home quedan intactos
// (design D5).
//
// IMPORTANTE (referencia estable): useSyncExternalStore compara la snapshot
// con Object.is. Para objetos/arrays la comparación es por REFERENCIA, así
// que getSnapshot() DEBE devolver la misma referencia mientras el valor no
// cambie; y getServerSnapshot() DEBE devolver una constante cacheada. Si se
// construye un array nuevo en cada llamada, React percibe un cambio en cada
// render → "Maximum update depth exceeded". Por eso `cache` es una variable
// de módulo inicializada una sola vez (lazy en el primer snapshot client) y
// reemplazada únicamente por trackRecentlyViewed().

const STORAGE_KEY = "soundtouch:recently-viewed";
const MAX_ITEMS = 12;

type RecentlyViewed = string[];

// Constante compartida: la misma referencia para snapshot server y para el
// estado "vacío" del client (evita el loop de Object.is).
const EMPTY: RecentlyViewed = [];

const listeners = new Set<() => void>();

// null = todavía no inicializado (SSR o primer render client).
let cache: RecentlyViewed | null = null;

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function readFromStorage(): RecentlyViewed {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : EMPTY;
  } catch {
    return EMPTY;
  }
}

function getSnapshot(): RecentlyViewed {
  // Lazy init: la primera lectura client cachea la referencia; las siguientes
  // devuelven la misma hasta que track la reemplace.
  if (cache === null) {
    cache = readFromStorage();
  }
  return cache;
}

function getServerSnapshot(): RecentlyViewed {
  return EMPTY;
}

/** Registra la visita a un producto (dedupe, más reciente primero). */
export function trackRecentlyViewed(instrumentId: string): void {
  if (!instrumentId) return;
  const current = getSnapshot();
  const next = [instrumentId, ...current.filter((id) => id !== instrumentId)];
  cache = next.slice(0, MAX_ITEMS);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage puede no estar disponible (privacy mode); best-effort.
  }
  listeners.forEach((listener) => listener());
}

/** Suscriptor para useSyncExternalStore. */
export function subscribeRecentlyViewed(callback: () => void): () => void {
  return subscribe(callback);
}

export function getRecentlyViewedSnapshot(): RecentlyViewed {
  return getSnapshot();
}

export function getRecentlyViewedServerSnapshot(): RecentlyViewed {
  return getServerSnapshot();
}
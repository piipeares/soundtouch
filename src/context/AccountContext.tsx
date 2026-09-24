"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useSyncExternalStore,
} from "react";

interface AccountState {
  authenticated: boolean;
  email: string | null;
  favoriteIds: string[];
}

interface AccountContextType extends AccountState {
  isFavorite: (instrumentId: string) => boolean;
  toggleFavorite: (instrumentId: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Sesión de cliente + favoritos (design D5 / task 4.1).
 *
 * Store externo resuelto con useSyncExternalStore siguiendo el patrón de
 * CurrencyContext — la clave es D5: NO leer `cookies()` desde páginas estáticas
 * (home/detalle son ISR), el estado de cuenta se hidrata en el cliente con un
 * fetch en mount a /api/auth/customer + /api/favorites.
 *
 * - getServerSnapshot() = estado neutro (logged-out, 0 favoritos) → SSR y el
 *   primer render del client son idénticos (0 hydration warnings).
 * - Tras el hydrate, el fetch reemplaza el estado real y notifica listeners.
 * - Toggle optimista con revert; 401 → sesión caída + redirect /login.
 */
const NEUTRAL_STATE: AccountState = {
  authenticated: false,
  email: null,
  favoriteIds: [],
};

let state: AccountState = NEUTRAL_STATE;
const listeners = new Set<() => void>();

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot(): AccountState {
  return state;
}

function getServerSnapshot(): AccountState {
  return NEUTRAL_STATE;
}

function setState(next: AccountState): void {
  state = next;
  listeners.forEach((listener) => listener());
}

const defaultContext: AccountContextType = {
  ...NEUTRAL_STATE,
  isFavorite: () => false,
  toggleFavorite: async () => {},
  logout: async () => {},
  refresh: async () => {},
};

const AccountContext = createContext<AccountContextType>(defaultContext);

export function AccountProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const account = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const refresh = useCallback(async () => {
    try {
      const [authRes, favRes] = await Promise.all([
        fetch("/api/auth/customer"),
        fetch("/api/favorites"),
      ]);

      if (!authRes.ok) {
        setState({ ...NEUTRAL_STATE });
        return;
      }
      const auth = (await authRes.json()) as { authenticated: boolean; email: string };
      const fav = favRes.ok
        ? ((await favRes.json()) as { favorites: string[] })
        : { favorites: [] };

      setState({
        authenticated: auth.authenticated,
        email: auth.email ?? null,
        favoriteIds: Array.isArray(fav.favorites) ? fav.favorites : [],
      });
    } catch {
      setState({ ...NEUTRAL_STATE });
    }
  }, []);

  // Hidratación inicial en mount (client-only, post-hydration).
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggleFavorite = useCallback(async (instrumentId: string) => {
    const prev = state;
    // Optimista: aplicar el flip local primero.
    const already = prev.favoriteIds.includes(instrumentId);
    const optimistic: string[] = already
      ? prev.favoriteIds.filter((id) => id !== instrumentId)
      : [...prev.favoriteIds, instrumentId];
    setState({ ...prev, favoriteIds: optimistic });

    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instrumentId }),
      });

      if (res.status === 401) {
        // Sesión inválida/caída: reset + redirect a /login desde el caller.
        setState({ ...NEUTRAL_STATE });
        window.location.assign("/login");
        return;
      }
      if (!res.ok) {
        // Revertir al estado previo (404 instrumento, 400, 500...).
        setState({ ...prev });
        return;
      }
      const data = (await res.json()) as { favorites: string[] };
      setState({ ...state, favoriteIds: data.favorites });
    } catch {
      setState({ ...prev });
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/customer", { method: "DELETE" });
    } catch {
      // Logout best-effort: aún sin respuesta, la sesión local se limpia.
    }
    setState({ ...NEUTRAL_STATE });
  }, []);

  const isFavorite = useCallback(
    (instrumentId: string) => state.favoriteIds.includes(instrumentId),
    []
  );

  return (
    <AccountContext.Provider
      value={{
        ...account,
        isFavorite,
        toggleFavorite,
        logout,
        refresh,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  return useContext(AccountContext);
}
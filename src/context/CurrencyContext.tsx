"use client";

import { createContext, useContext, useCallback, useSyncExternalStore } from "react";
import { business } from "@/config/business";

type Currency = "USD" | "ARS";

interface CurrencyContextType {
  currency: Currency;
  toggleCurrency: () => void;
  exchangeRate: number;
}

const STORAGE_KEY = "currency";

/**
 * Store externo de moneda resuelto con useSyncExternalStore.
 *
 * Por qué así y no useState + localStorage lazy:
 * - SSR renderiza con getServerSnapshot() = "USD" (idéntico en server y client
 *   durante el primer render → NO hay hydration mismatch).
 * - Después del hydrate, useSyncExternalStore detecta el snapshot real del
 *   client (ARS guardado en localStorage) y re-renderiza SIN error de
 *   hydration (es el mecanismo oficial para "external changing data").
 * - Evita el patrón setState-in-effect que marcaba el lint.
 */
const listeners = new Set<() => void>();

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot(): Currency {
  if (typeof window === "undefined") return "USD";
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === "ARS" ? "ARS" : "USD";
  } catch {
    return "USD";
  }
}

function getServerSnapshot(): Currency {
  return "USD";
}

// Default values
const defaultContext: CurrencyContextType = {
  currency: "USD",
  toggleCurrency: () => {},
  exchangeRate: business.exchangeRate,
};

const CurrencyContext = createContext<CurrencyContextType>(defaultContext);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const currency = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const toggleCurrency = useCallback(() => {
    const next: Currency = getSnapshot() === "USD" ? "ARS" : "USD";
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage puede no estar disponible (privacy mode); el toggle sigue funcionando en memoria.
    }
    listeners.forEach((listener) => listener());
  }, []);

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        toggleCurrency,
        exchangeRate: business.exchangeRate,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  return context;
}
"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { business } from "@/config/business";

type Currency = "USD" | "ARS";

interface CurrencyContextType {
  currency: Currency;
  toggleCurrency: () => void;
  exchangeRate: number;
}

// Default values
const defaultContext: CurrencyContextType = {
  currency: "USD",
  toggleCurrency: () => {},
  exchangeRate: business.exchangeRate,
};

const CurrencyContext = createContext<CurrencyContextType>(defaultContext);

/**
 * Lee la moneda persistida SOLO en el cliente (lazy initializer). Evita el
 * patrón setState-in-effect (react-hooks/set-state-in-effect) y el flash de
 * USD cuando el usuario ya eligió ARS.
 */
function getInitialCurrency(): Currency {
  if (typeof window === "undefined") return "USD";
  try {
    const saved = window.localStorage.getItem("currency");
    return saved === "ARS" ? "ARS" : "USD";
  } catch {
    return "USD";
  }
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>(getInitialCurrency);

  const toggleCurrency = useCallback(() => {
    setCurrency((prev) => {
      const next: Currency = prev === "USD" ? "ARS" : "USD";
      try {
        window.localStorage.setItem("currency", next);
      } catch {
        // localStorage puede no estar disponible (privacy mode); el toggle sigue funcionando en memoria.
      }
      return next;
    });
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
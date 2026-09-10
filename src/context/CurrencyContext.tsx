"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

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
  exchangeRate: 1050,
};

const CurrencyContext = createContext<CurrencyContextType>(defaultContext);

// Tasa de cambio fija por ahora (luego se puede actualizar automáticamente)
const EXCHANGE_RATE = 1050;

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>("USD");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("currency") as Currency;
    if (saved) setCurrency(saved);
  }, []);

  const toggleCurrency = () => {
    const newCurrency = currency === "USD" ? "ARS" : "USD";
    setCurrency(newCurrency);
    localStorage.setItem("currency", newCurrency);
  };

  return (
    <CurrencyContext.Provider value={{ 
      currency: mounted ? currency : "USD", 
      toggleCurrency, 
      exchangeRate: EXCHANGE_RATE 
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  return context;
}
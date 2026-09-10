"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
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
    <CurrencyContext.Provider
      value={{
        currency: mounted ? currency : "USD",
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
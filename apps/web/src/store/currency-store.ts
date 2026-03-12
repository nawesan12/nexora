"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type Currency = "ARS" | "USD";

interface CurrencyState {
  currency: Currency;
  exchangeRate: number;
  setCurrency: (currency: Currency) => void;
  setExchangeRate: (rate: number) => void;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set) => ({
      currency: "ARS",
      exchangeRate: 1,
      setCurrency: (currency) => set({ currency }),
      setExchangeRate: (exchangeRate) => set({ exchangeRate }),
    }),
    {
      name: "nexora-currency",
    },
  ),
);

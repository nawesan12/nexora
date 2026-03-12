"use client";

import { useCurrencyStore } from "@/store/currency-store";
import { Button } from "@/components/ui/button";

export function CurrencyToggle() {
  const { currency, setCurrency } = useCurrencyStore();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setCurrency(currency === "ARS" ? "USD" : "ARS")}
      className="font-mono text-xs"
    >
      {currency}
    </Button>
  );
}

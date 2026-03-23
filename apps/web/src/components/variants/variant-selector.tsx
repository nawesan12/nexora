"use client";

import { useState, useEffect, useMemo } from "react";
import { useVariantes, useSKUs } from "@/hooks/queries/use-variants";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SKUVariante } from "@pronto/shared/types";

interface VariantSelectorProps {
  productoId: string;
  onSelect?: (sku: SKUVariante | null) => void;
  className?: string;
}

export function VariantSelector({
  productoId,
  onSelect,
  className,
}: VariantSelectorProps) {
  const { data: variantes } = useVariantes(productoId);
  const { data: skus } = useSKUs(productoId);

  // Track selected option per variant axis
  const [selections, setSelections] = useState<Record<string, string>>({});

  // Reset selections when product changes
  useEffect(() => {
    setSelections({});
  }, [productoId]);

  // Find the matching SKU for the current selection
  const matchedSKU = useMemo(() => {
    if (!skus || !variantes) return null;

    const selectedIds = Object.values(selections).filter(Boolean).sort();
    if (selectedIds.length === 0) return null;

    return (
      skus.find((sku) => {
        const skuIds = [...sku.opciones_ids].sort();
        if (skuIds.length !== selectedIds.length) return false;
        return skuIds.every((id, idx) => id === selectedIds[idx]);
      }) || null
    );
  }, [skus, variantes, selections]);

  // Notify parent of selection changes
  useEffect(() => {
    onSelect?.(matchedSKU);
  }, [matchedSKU, onSelect]);

  const handleSelectOption = (varianteId: string, opcionId: string) => {
    setSelections((prev) => {
      const next = { ...prev };
      if (next[varianteId] === opcionId) {
        delete next[varianteId];
      } else {
        next[varianteId] = opcionId;
      }
      return next;
    });
  };

  if (!variantes || variantes.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      {variantes.map((variante) => (
        <div key={variante.id} className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">
            {variante.nombre}
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {variante.opciones.map((opcion) => {
              const isSelected = selections[variante.id] === opcion.id;
              return (
                <button
                  key={opcion.id}
                  type="button"
                  onClick={() => handleSelectOption(variante.id, opcion.id)}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-sm font-medium transition-all",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-background hover:bg-muted",
                  )}
                >
                  {opcion.valor}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {matchedSKU && (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-primary/30 bg-primary/5 px-3 py-2">
          <Badge variant="outline" className="font-mono text-xs">
            {matchedSKU.sku || "SKU"}
          </Badge>
          {matchedSKU.precio_adicional > 0 && (
            <span className="text-sm text-muted-foreground">
              +${matchedSKU.precio_adicional.toFixed(2)}
            </span>
          )}
          {matchedSKU.stock_adicional > 0 && (
            <span className="text-xs text-muted-foreground">
              ({matchedSKU.stock_adicional} en stock)
            </span>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useCallback, useEffect } from "react";
import type { Producto } from "@pronto/shared/types";
import { useConvertUnits } from "@/hooks/queries/use-conversions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, Scale, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const UNITS = ["KG", "UNIDAD", "LITRO", "METRO", "CAJA", "BOLSA", "PACK"] as const;

const unitLabels: Record<string, string> = {
  KG: "Kilogramo",
  UNIDAD: "Unidad",
  LITRO: "Litro",
  METRO: "Metro",
  CAJA: "Caja",
  BOLSA: "Bolsa",
  PACK: "Pack",
};

interface WeighingModalProps {
  product: Producto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (qty: number) => void;
}

export function WeighingModal({ product, open, onOpenChange, onConfirm }: WeighingModalProps) {
  const [weight, setWeight] = useState(0);
  const [targetUnit, setTargetUnit] = useState("");
  const productUnit = product.unidad || "KG";

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setWeight(0);
      setTargetUnit("");
    }
  }, [open]);

  const showConversion = targetUnit && targetUnit !== productUnit;

  const { data: conversionData } = useConvertUnits(
    productUnit,
    targetUnit,
    weight,
  );

  const increment = useCallback((amount: number) => {
    setWeight((prev) => {
      const next = Math.round((prev + amount) * 1000) / 1000;
      return Math.max(0, next);
    });
  }, []);

  const handleManualInput = (value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) {
      setWeight(num);
    } else if (value === "" || value === "0") {
      setWeight(0);
    }
  };

  const displayQty = showConversion && conversionData
    ? conversionData.to_qty
    : weight;

  const displayUnit = showConversion && conversionData
    ? targetUnit
    : productUnit;

  const pricePerUnit = product.precio_base;
  const totalPrice = displayQty * pricePerUnit;

  const handleConfirm = () => {
    if (weight > 0) {
      onConfirm(weight);
      onOpenChange(false);
    }
  };

  const isWeighable = productUnit === "KG" || productUnit === "LITRO";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            {isWeighable ? "Pesaje" : "Cantidad"} - {product.nombre}
          </DialogTitle>
          <DialogDescription>
            Unidad del producto: <Badge variant="outline">{productUnit}</Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Simulated Scale Display */}
          <div className="rounded-lg border-2 border-dashed bg-muted/50 p-6 text-center">
            <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">
              {isWeighable ? "Peso / Volumen" : "Cantidad"}
            </p>
            <div className="flex items-baseline justify-center gap-2">
              <span className="font-mono text-4xl font-bold tabular-nums">
                {weight.toFixed(isWeighable ? 3 : 0)}
              </span>
              <span className="text-lg text-muted-foreground">{productUnit}</span>
            </div>
          </div>

          {/* Quick Increment Buttons */}
          <div className="space-y-2">
            <Label>Ajuste rapido</Label>
            <div className="grid grid-cols-4 gap-2">
              {isWeighable ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => increment(-0.5)}>
                    <Minus className="mr-1 h-3 w-3" /> 0.5
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => increment(-0.1)}>
                    <Minus className="mr-1 h-3 w-3" /> 0.1
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => increment(0.1)}>
                    <Plus className="mr-1 h-3 w-3" /> 0.1
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => increment(0.5)}>
                    <Plus className="mr-1 h-3 w-3" /> 0.5
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => increment(-1)}>
                    <Minus className="mr-1 h-3 w-3" /> 1
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => increment(-0.25)}>
                    <Minus className="mr-1 h-3 w-3" /> 0.25
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => increment(0.25)}>
                    <Plus className="mr-1 h-3 w-3" /> 0.25
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => increment(1)}>
                    <Plus className="mr-1 h-3 w-3" /> 1
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={() => increment(-5)}>
                    <Minus className="mr-1 h-3 w-3" /> 5
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => increment(-1)}>
                    <Minus className="mr-1 h-3 w-3" /> 1
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => increment(1)}>
                    <Plus className="mr-1 h-3 w-3" /> 1
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => increment(5)}>
                    <Plus className="mr-1 h-3 w-3" /> 5
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Manual Input */}
          <div className="space-y-2">
            <Label>Ingreso manual</Label>
            <Input
              type="number"
              step={isWeighable ? "0.001" : "1"}
              min="0"
              value={weight || ""}
              onChange={(e) => handleManualInput(e.target.value)}
              placeholder={isWeighable ? "Ej: 2.500" : "Ej: 10"}
            />
          </div>

          {/* Unit Conversion */}
          <div className="space-y-2">
            <Label>Convertir a otra unidad (opcional)</Label>
            <Select value={targetUnit} onValueChange={setTargetUnit}>
              <SelectTrigger>
                <SelectValue placeholder="Sin conversion" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin conversion</SelectItem>
                {UNITS.filter((u) => u !== productUnit).map((u) => (
                  <SelectItem key={u} value={u}>
                    {u} - {unitLabels[u]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {showConversion && conversionData && (
              <div className="flex items-center gap-2 rounded-md bg-muted p-2 text-sm">
                <span className="font-mono">
                  {weight.toFixed(3)} {productUnit}
                </span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="font-mono font-medium">
                  {conversionData.to_qty.toFixed(3)} {targetUnit}
                </span>
                <span className="text-xs text-muted-foreground">
                  (factor: {conversionData.factor})
                </span>
              </div>
            )}
            {showConversion && !conversionData && weight > 0 && (
              <p className="text-xs text-destructive">
                No se encontro conversion de {productUnit} a {targetUnit}. Configure una en Configuracion &gt; Conversiones.
              </p>
            )}
          </div>

          {/* Price Calculation */}
          <div
            className={cn(
              "rounded-lg border bg-card p-4",
              weight > 0 && "border-primary/50 bg-primary/5",
            )}
          >
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Precio unitario</span>
              <span className="font-mono">
                ${pricePerUnit.toLocaleString("es-AR", { minimumFractionDigits: 2 })} / {productUnit}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Cantidad</span>
              <span className="font-mono">
                {weight.toFixed(isWeighable ? 3 : 0)} {productUnit}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t pt-2">
              <span className="font-medium">Total</span>
              <span className="font-mono text-lg font-bold">
                ${(weight * pricePerUnit).toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={weight <= 0}>
            Confirmar {weight > 0 && `(${weight.toFixed(isWeighable ? 3 : 0)} ${productUnit})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

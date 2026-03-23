"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

const TIPO_LABELS: Record<string, string> = {
  IVA: "IVA",
  IIBB: "IIBB",
  PERCEPCION_IVA: "Percepción IVA",
  PERCEPCION_IIBB: "Percepción IIBB",
  OTRO: "Otro",
};

import type { ImpuestoItemInput } from "@pronto/shared/schemas";

type TaxItem = ImpuestoItemInput;

interface Props {
  taxes: TaxItem[];
  onChange: (taxes: TaxItem[]) => void;
}

export function OrderTaxSection({ taxes, onChange }: Props) {
  const addTax = () => {
    onChange([...taxes, { tipo: "IVA" as const, nombre: "IVA 21%", porcentaje: 21 }]);
  };

  const updateTax = (index: number, data: Partial<TaxItem>) => {
    const updated = taxes.map((t, i) =>
      i === index ? { ...t, ...data } : t,
    );
    onChange(updated);
  };

  const removeTax = (index: number) => {
    onChange(taxes.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Impuestos</h3>
        <Button type="button" variant="outline" size="sm" onClick={addTax}>
          <Plus className="mr-1 h-3 w-3" />
          Agregar
        </Button>
      </div>
      {taxes.map((tax, i) => (
        <div key={i} className="grid grid-cols-12 items-center gap-2">
          <div className="col-span-3">
            <Select
              value={tax.tipo}
              onValueChange={(v) => updateTax(i, { tipo: v as TaxItem["tipo"] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TIPO_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-5">
            <Input
              placeholder="Nombre (ej: IVA 21%)"
              value={tax.nombre}
              onChange={(e) => updateTax(i, { nombre: e.target.value })}
            />
          </div>
          <div className="col-span-3">
            <Input
              type="number"
              placeholder="%"
              min={0}
              step="0.01"
              value={tax.porcentaje || ""}
              onChange={(e) =>
                updateTax(i, { porcentaje: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
          <div className="col-span-1 text-right">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeTax(i)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      ))}
      {taxes.length === 0 && (
        <p className="text-sm text-muted-foreground">Sin impuestos configurados</p>
      )}
    </div>
  );
}

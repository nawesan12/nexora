"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import { ProductSearchCombobox } from "./product-search-combobox";

interface ItemData {
  producto_id: string;
  producto_nombre?: string;
  producto_unidad?: string;
  cantidad: number;
  precio_unitario: number;
  descuento_porcentaje: number;
}

interface Props {
  item: ItemData;
  index: number;
  onChange: (index: number, data: Partial<ItemData>) => void;
  onRemove: (index: number) => void;
}

export function OrderItemRow({ item, index, onChange, onRemove }: Props) {
  const lineTotal = item.cantidad * item.precio_unitario;
  const lineDiscount = lineTotal * (item.descuento_porcentaje / 100);
  const lineNet = lineTotal - lineDiscount;

  return (
    <div className="grid grid-cols-12 items-center gap-2">
      <div className="col-span-4">
        <ProductSearchCombobox
          value={item.producto_id}
          onSelect={(p) =>
            onChange(index, {
              producto_id: p.id,
              producto_nombre: p.nombre,
              producto_unidad: p.unidad,
              precio_unitario: p.precio_base,
            })
          }
        />
      </div>
      <div className="col-span-2">
        <Input
          type="number"
          placeholder="Cant."
          min={0}
          step="0.01"
          value={item.cantidad || ""}
          onChange={(e) =>
            onChange(index, { cantidad: parseFloat(e.target.value) || 0 })
          }
        />
      </div>
      <div className="col-span-2">
        <Input
          type="number"
          placeholder="Precio"
          min={0}
          step="0.01"
          value={item.precio_unitario || ""}
          onChange={(e) =>
            onChange(index, { precio_unitario: parseFloat(e.target.value) || 0 })
          }
        />
      </div>
      <div className="col-span-1">
        <Input
          type="number"
          placeholder="Dto%"
          min={0}
          max={100}
          step="0.01"
          value={item.descuento_porcentaje || ""}
          onChange={(e) =>
            onChange(index, {
              descuento_porcentaje: parseFloat(e.target.value) || 0,
            })
          }
        />
      </div>
      <div className="col-span-2 text-right text-sm font-medium">
        {new Intl.NumberFormat("es-AR", {
          style: "currency",
          currency: "ARS",
        }).format(lineNet)}
      </div>
      <div className="col-span-1 text-right">
        <Button variant="ghost" size="icon" onClick={() => onRemove(index)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

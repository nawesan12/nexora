"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useProductos } from "@/hooks/queries/use-products";
import { useDebounce } from "@/hooks/use-debounce";

interface Props {
  value?: string;
  onSelect: (producto: {
    id: string;
    nombre: string;
    codigo?: string;
    unidad: string;
    precio_base: number;
  }) => void;
}

export function ProductSearchCombobox({ value, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 300);

  const { data } = useProductos({ page: 1, pageSize: 20, search });
  const productos = data?.data || [];

  const selectedName = productos.find((p) => p.id === value)?.nombre;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between font-normal"
        >
          {selectedName || "Seleccionar producto..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-2" align="start">
        <Input
          placeholder="Buscar producto..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="mb-2"
        />
        <div className="max-h-[200px] overflow-y-auto">
          {productos.length === 0 ? (
            <p className="p-2 text-sm text-muted-foreground">Sin resultados</p>
          ) : (
            productos.map((p) => (
              <button
                key={p.id}
                className={cn(
                  "flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent",
                  value === p.id && "bg-accent",
                )}
                onClick={() => {
                  onSelect({
                    id: p.id,
                    nombre: p.nombre,
                    codigo: p.codigo,
                    unidad: p.unidad,
                    precio_base: p.precio_base,
                  });
                  setOpen(false);
                  setSearchInput("");
                }}
              >
                <Check
                  className={cn(
                    "h-4 w-4",
                    value === p.id ? "opacity-100" : "opacity-0",
                  )}
                />
                <div className="flex-1 text-left">
                  <div>{p.nombre}</div>
                  {p.codigo && (
                    <div className="text-xs text-muted-foreground">{p.codigo}</div>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{p.unidad}</span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

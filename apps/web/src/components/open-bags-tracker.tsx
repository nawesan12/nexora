"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Plus, Minus, Trash2, Package } from "lucide-react";

interface OpenBag {
  id: string;
  productName: string;
  originalQty: number;
  remainingQty: number;
  unit: string;
  openedAt: string;
}

const STORAGE_KEY = "pronto-open-bags";

function loadBags(): OpenBag[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as OpenBag[]) : [];
  } catch {
    return [];
  }
}

function saveBags(bags: OpenBag[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bags));
}

export function OpenBagsTracker() {
  const [bags, setBags] = useState<OpenBag[]>([]);
  const [newProduct, setNewProduct] = useState("");
  const [newQty, setNewQty] = useState("");
  const [newUnit, setNewUnit] = useState("kg");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    setBags(loadBags());
  }, []);

  const persist = useCallback((updated: OpenBag[]) => {
    setBags(updated);
    saveBags(updated);
  }, []);

  const addBag = () => {
    const qty = parseFloat(newQty);
    if (!newProduct.trim() || isNaN(qty) || qty <= 0) return;

    const bag: OpenBag = {
      id: crypto.randomUUID(),
      productName: newProduct.trim(),
      originalQty: qty,
      remainingQty: qty,
      unit: newUnit,
      openedAt: new Date().toISOString(),
    };

    persist([bag, ...bags]);
    setNewProduct("");
    setNewQty("");
    setNewUnit("kg");
    setDialogOpen(false);
  };

  const adjust = (id: string, delta: number) => {
    persist(
      bags.map((b) => {
        if (b.id !== id) return b;
        const next = Math.max(0, Math.min(b.originalQty, b.remainingQty + delta));
        return { ...b, remainingQty: next };
      }),
    );
  };

  const removeBag = (id: string) => {
    persist(bags.filter((b) => b.id !== id));
  };

  const progressPct = (b: OpenBag) =>
    b.originalQty > 0 ? (b.remainingQty / b.originalQty) * 100 : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Package className="h-4 w-4 text-[var(--accent)]" />
          Bolsones Abiertos
        </CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Abrir Bolson
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Abrir Nuevo Bolson</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="space-y-2">
                <Label>Producto</Label>
                <Input
                  placeholder="Ej: Arroz 25kg"
                  value={newProduct}
                  onChange={(e) => setNewProduct(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    placeholder="25"
                    min="0.1"
                    step="0.1"
                    value={newQty}
                    onChange={(e) => setNewQty(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unidad</Label>
                  <Input
                    placeholder="kg"
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button onClick={addBag} disabled={!newProduct.trim() || !newQty}>
                Abrir Bolson
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {bags.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay bolsones abiertos
          </p>
        ) : (
          <div className="space-y-3">
            {bags.map((bag) => {
              const pct = progressPct(bag);
              return (
                <div
                  key={bag.id}
                  className="rounded-lg border border-border/50 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate max-w-[180px]">
                      {bag.productName}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => removeBag(bag.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {bag.remainingQty.toFixed(1)} / {bag.originalQty.toFixed(1)} {bag.unit}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => adjust(bag.id, -1)}
                        disabled={bag.remainingQty <= 0}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => adjust(bag.id, 1)}
                        disabled={bag.remainingQty >= bag.originalQty}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

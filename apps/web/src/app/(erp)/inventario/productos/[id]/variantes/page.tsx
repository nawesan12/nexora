"use client";

import { useState, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useVariantes,
  useCreateVariante,
  useDeleteVariante,
  useCreateOpcion,
  useDeleteOpcion,
  useSKUs,
  useCreateSKU,
  useUpdateSKU,
  useDeleteSKU,
} from "@/hooks/queries/use-variants";
import { useProducto } from "@/hooks/queries/use-products";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Plus,
  Trash2,
  X,
  Package,
  Layers,
  Tags,
} from "lucide-react";
import type { VarianteProducto, OpcionVariante } from "@pronto/shared/types";
import gsap from "gsap";

export default function VariantesPage() {
  const { id: productoId } = useParams<{ id: string }>();
  const { data: producto, isLoading: loadingProducto } = useProducto(productoId);
  const { data: variantes, isLoading: loadingVariantes } = useVariantes(productoId);
  const { data: skus, isLoading: loadingSKUs } = useSKUs(productoId);

  const createVarianteMut = useCreateVariante();
  const deleteVarianteMut = useDeleteVariante();
  const createOpcionMut = useCreateOpcion();
  const deleteOpcionMut = useDeleteOpcion();
  const createSKUMut = useCreateSKU();
  const updateSKUMut = useUpdateSKU();
  const deleteSKUMut = useDeleteSKU();

  const [showVarianteDialog, setShowVarianteDialog] = useState(false);
  const [newVarianteName, setNewVarianteName] = useState("");
  const [newOpcionValues, setNewOpcionValues] = useState<Record<string, string>>({});
  const [showSKUDialog, setShowSKUDialog] = useState(false);
  const [skuForm, setSKUForm] = useState({
    sku: "",
    precio_adicional: 0,
    stock_adicional: 0,
    opciones_ids: [] as string[],
  });
  const [editingSKU, setEditingSKU] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current || loadingProducto || loadingVariantes) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".variant-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      );
      gsap.fromTo(
        ".variant-card",
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: "power2.out", delay: 0.15, stagger: 0.1 },
      );
    }, containerRef);

    return () => ctx.revert();
  }, [loadingProducto, loadingVariantes]);

  const handleCreateVariante = () => {
    if (!newVarianteName.trim()) return;
    createVarianteMut.mutate(
      { producto_id: productoId, nombre: newVarianteName.trim() },
      {
        onSuccess: () => {
          setNewVarianteName("");
          setShowVarianteDialog(false);
        },
      },
    );
  };

  const handleAddOpcion = (variante: VarianteProducto) => {
    const valor = newOpcionValues[variante.id]?.trim();
    if (!valor) return;
    createOpcionMut.mutate(
      {
        productoId,
        varianteId: variante.id,
        data: { variante_id: variante.id, valor, orden: variante.opciones.length },
      },
      {
        onSuccess: () => {
          setNewOpcionValues((prev) => ({ ...prev, [variante.id]: "" }));
        },
      },
    );
  };

  const handleDeleteOpcion = (varianteId: string, opcion: OpcionVariante) => {
    deleteOpcionMut.mutate({ productoId, varianteId, opcionId: opcion.id });
  };

  const handleDeleteVariante = (id: string) => {
    deleteVarianteMut.mutate({ productoId, id });
  };

  const handleOpenSKUDialog = (existingSKUId?: string) => {
    if (existingSKUId && skus) {
      const existing = skus.find((s) => s.id === existingSKUId);
      if (existing) {
        setSKUForm({
          sku: existing.sku,
          precio_adicional: existing.precio_adicional,
          stock_adicional: existing.stock_adicional,
          opciones_ids: existing.opciones_ids,
        });
        setEditingSKU(existingSKUId);
      }
    } else {
      setSKUForm({ sku: "", precio_adicional: 0, stock_adicional: 0, opciones_ids: [] });
      setEditingSKU(null);
    }
    setShowSKUDialog(true);
  };

  const handleSaveSKU = () => {
    if (editingSKU) {
      updateSKUMut.mutate(
        {
          productoId,
          id: editingSKU,
          data: {
            sku: skuForm.sku,
            precio_adicional: skuForm.precio_adicional,
            stock_adicional: skuForm.stock_adicional,
            opciones_ids: skuForm.opciones_ids,
          },
        },
        { onSuccess: () => setShowSKUDialog(false) },
      );
    } else {
      createSKUMut.mutate(
        {
          producto_id: productoId,
          sku: skuForm.sku,
          precio_adicional: skuForm.precio_adicional,
          stock_adicional: skuForm.stock_adicional,
          opciones_ids: skuForm.opciones_ids,
        },
        { onSuccess: () => setShowSKUDialog(false) },
      );
    }
  };

  const handleDeleteSKU = (id: string) => {
    deleteSKUMut.mutate({ productoId, id });
  };

  const handleGenerateSKUs = () => {
    if (!variantes || variantes.length === 0) return;

    const allOptionSets = variantes
      .filter((v) => v.opciones.length > 0)
      .map((v) => v.opciones);

    if (allOptionSets.length === 0) return;

    const combinations = cartesianProduct(allOptionSets);
    const existingCombos = new Set(
      (skus || []).map((s) => [...s.opciones_ids].sort().join(",")),
    );

    for (const combo of combinations) {
      const ids = combo.map((o) => o.id).sort();
      const key = ids.join(",");
      if (existingCombos.has(key)) continue;

      const skuLabel = combo.map((o) => o.valor).join("-");
      createSKUMut.mutate({
        producto_id: productoId,
        sku: skuLabel,
        precio_adicional: 0,
        stock_adicional: 0,
        opciones_ids: ids,
      });
    }
  };

  const toggleOpcionInSKU = (opcionId: string) => {
    setSKUForm((prev) => ({
      ...prev,
      opciones_ids: prev.opciones_ids.includes(opcionId)
        ? prev.opciones_ids.filter((id) => id !== opcionId)
        : [...prev.opciones_ids, opcionId],
    }));
  };

  const getOpcionLabel = (opcionId: string): string => {
    if (!variantes) return opcionId;
    for (const v of variantes) {
      const o = v.opciones.find((op) => op.id === opcionId);
      if (o) return `${v.nombre}: ${o.valor}`;
    }
    return opcionId;
  };

  if (loadingProducto || loadingVariantes) {
    return (
      <div className="mx-auto max-w-4xl space-y-5">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="variant-header space-y-3">
        <Link
          href={`/inventario/productos/${productoId}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al producto
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Variantes
              </h1>
              <p className="text-sm text-muted-foreground">
                {producto ? producto.nombre : "Producto"}
              </p>
            </div>
          </div>
          <Button onClick={() => setShowVarianteDialog(true)} size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            Agregar Eje
          </Button>
        </div>
      </div>

      {/* Variant Axes */}
      {(!variantes || variantes.length === 0) && (
        <Card className="variant-card">
          <CardContent className="flex flex-col items-center gap-2 py-12">
            <Tags className="h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium text-foreground">Sin variantes</p>
            <p className="text-sm text-muted-foreground">
              Agrega ejes de variantes como &quot;Tamano&quot;, &quot;Color&quot;, etc.
            </p>
          </CardContent>
        </Card>
      )}

      {variantes &&
        variantes.map((variante) => (
          <Card key={variante.id} className="variant-card">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">{variante.nombre}</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => handleDeleteVariante(variante.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {variante.opciones.map((opcion) => (
                  <Badge
                    key={opcion.id}
                    variant="secondary"
                    className="gap-1.5 px-3 py-1.5 text-sm"
                  >
                    {opcion.valor}
                    <button
                      onClick={() => handleDeleteOpcion(variante.id, opcion)}
                      className="ml-1 rounded-full p-0.5 hover:bg-muted"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Nueva opcion..."
                  value={newOpcionValues[variante.id] || ""}
                  onChange={(e) =>
                    setNewOpcionValues((prev) => ({
                      ...prev,
                      [variante.id]: e.target.value,
                    }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddOpcion(variante);
                  }}
                  className="max-w-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddOpcion(variante)}
                  disabled={!newOpcionValues[variante.id]?.trim()}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Agregar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

      {/* SKU Combinations */}
      {variantes && variantes.length > 0 && (
        <Card className="variant-card">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4" />
              Combinaciones SKU
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleGenerateSKUs}>
                Generar Combinaciones
              </Button>
              <Button size="sm" onClick={() => handleOpenSKUDialog()}>
                <Plus className="mr-1.5 h-4 w-4" />
                SKU Manual
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingSKUs ? (
              <Skeleton className="h-[200px] w-full" />
            ) : !skus || skus.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                <Package className="h-8 w-8 opacity-40" />
                <p className="text-sm">
                  Sin combinaciones SKU. Genera combinaciones automaticamente o agrega manualmente.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Opciones</TableHead>
                    <TableHead className="text-right">Precio Adicional</TableHead>
                    <TableHead className="text-right">Stock Adicional</TableHead>
                    <TableHead className="w-[100px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {skus.map((sku) => (
                    <TableRow key={sku.id}>
                      <TableCell className="font-mono text-sm">
                        {sku.sku || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {sku.opciones_ids.map((oid) => (
                            <Badge key={oid} variant="outline" className="text-xs">
                              {getOpcionLabel(oid)}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        ${sku.precio_adicional.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {sku.stock_adicional}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleOpenSKUDialog(sku.id)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                              <path d="m15 5 4 4" />
                            </svg>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteSKU(sku.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Variante Dialog */}
      <Dialog open={showVarianteDialog} onOpenChange={setShowVarianteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Eje de Variante</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nombre del eje</Label>
              <Input
                placeholder='Ej: "Tamano", "Color", "Sabor"'
                value={newVarianteName}
                onChange={(e) => setNewVarianteName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateVariante();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVarianteDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateVariante}
              disabled={!newVarianteName.trim() || createVarianteMut.isPending}
            >
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit SKU Dialog */}
      <Dialog open={showSKUDialog} onOpenChange={setShowSKUDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSKU ? "Editar SKU" : "Nuevo SKU"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Codigo SKU</Label>
              <Input
                placeholder="Ej: PROD-001-GRD-ROJ"
                value={skuForm.sku}
                onChange={(e) =>
                  setSKUForm((prev) => ({ ...prev, sku: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Precio Adicional</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={skuForm.precio_adicional}
                  onChange={(e) =>
                    setSKUForm((prev) => ({
                      ...prev,
                      precio_adicional: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Stock Adicional</Label>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={skuForm.stock_adicional}
                  onChange={(e) =>
                    setSKUForm((prev) => ({
                      ...prev,
                      stock_adicional: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>
            {variantes && variantes.length > 0 && (
              <div className="space-y-3">
                <Label>Opciones</Label>
                {variantes.map((v) => (
                  <div key={v.id} className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">
                      {v.nombre}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {v.opciones.map((o) => {
                        const selected = skuForm.opciones_ids.includes(o.id);
                        return (
                          <button
                            key={o.id}
                            type="button"
                            onClick={() => toggleOpcionInSKU(o.id)}
                            className={`rounded-md border px-3 py-1 text-sm transition-colors ${
                              selected
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border hover:bg-muted"
                            }`}
                          >
                            {o.valor}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSKUDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveSKU}
              disabled={createSKUMut.isPending || updateSKUMut.isPending}
            >
              {editingSKU ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Cartesian product of arrays of options */
function cartesianProduct(arrays: OpcionVariante[][]): OpcionVariante[][] {
  if (arrays.length === 0) return [[]];
  return arrays.reduce<OpcionVariante[][]>(
    (acc, curr) => {
      const result: OpcionVariante[][] = [];
      for (const a of acc) {
        for (const c of curr) {
          result.push([...a, c]);
        }
      }
      return result;
    },
    [[]],
  );
}

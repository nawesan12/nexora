"use client";

import { useState, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { useProductos } from "@/hooks/queries/use-products";
import { useAdjustStock, useMovimientosStock } from "@/hooks/queries/use-stock";
import { useUserStore } from "@/store/user-store";
import { hasPermission } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  AlertTriangle,
  Loader2,
  PackageMinus,
} from "lucide-react";
import { toast } from "sonner";
import gsap from "gsap";

function formatARS(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(value);
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

export default function QuiebreStockPage() {
  const user = useUserStore((s) => s.user);
  const permissions = user?.permissions ?? [];
  const canAdjust = hasPermission(permissions, "stock:adjust");
  const sucursales = user?.sucursales || [];

  const [selectedProducto, setSelectedProducto] = useState("");
  const [selectedSucursal, setSelectedSucursal] = useState(
    sucursales[0]?.id || "",
  );
  const [cantidad, setCantidad] = useState("");
  const [motivo, setMotivo] = useState("");
  const [productSearch, setProductSearch] = useState("");

  const adjustMutation = useAdjustStock();

  const { data: productosData } = useProductos({
    pageSize: 100,
    search: productSearch || undefined,
  });
  const productos = productosData?.data || [];

  const { data: historyData, isLoading: historyLoading } = useMovimientosStock({
    tipo: "QUIEBRE",
    sucursalId: selectedSucursal || undefined,
    pageSize: 20,
  });
  const historyItems = historyData?.data || [];

  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".quiebre-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      );
      gsap.fromTo(
        ".quiebre-content",
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.15 },
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProducto || !selectedSucursal || !cantidad || !motivo) {
      toast.error("Completa todos los campos");
      return;
    }

    const qty = parseInt(cantidad);
    if (isNaN(qty) || qty <= 0) {
      toast.error("La cantidad debe ser un numero positivo");
      return;
    }

    try {
      await adjustMutation.mutateAsync({
        producto_id: selectedProducto,
        sucursal_id: selectedSucursal,
        cantidad: -Math.abs(qty),
        tipo: "QUIEBRE",
        motivo,
      });
      toast.success("Quiebre de stock registrado");
      setSelectedProducto("");
      setCantidad("");
      setMotivo("");
    } catch {
      // Error handled by mutation hook
    }
  };

  if (!canAdjust) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No tienes permisos para registrar quiebres de stock.
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-5">
      {/* Header */}
      <div className="quiebre-header">
        <Link
          href="/inventario"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Inventario
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <PackageMinus className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Quiebre de Stock
            </h1>
            <p className="text-sm text-muted-foreground">
              Registrar perdidas, roturas o merma de productos
            </p>
          </div>
        </div>
      </div>

      <div className="quiebre-content grid gap-5 lg:grid-cols-2">
        {/* Form */}
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Datos del quiebre
                </h3>
                <Separator className="mt-2 mb-4" />
              </div>

              {/* Branch selector */}
              <div className="space-y-2">
                <Label htmlFor="sucursal">Sucursal</Label>
                <Select
                  value={selectedSucursal}
                  onValueChange={setSelectedSucursal}
                >
                  <SelectTrigger id="sucursal">
                    <SelectValue placeholder="Seleccionar sucursal" />
                  </SelectTrigger>
                  <SelectContent>
                    {sucursales.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Product selector */}
              <div className="space-y-2">
                <Label htmlFor="producto">Producto</Label>
                <Select
                  value={selectedProducto}
                  onValueChange={setSelectedProducto}
                >
                  <SelectTrigger id="producto">
                    <SelectValue placeholder="Seleccionar producto" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 pb-2">
                      <Input
                        placeholder="Buscar producto..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="h-8"
                      />
                    </div>
                    {productos.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.codigo ? `[${p.codigo}] ` : ""}
                        {p.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <Label htmlFor="cantidad">Cantidad (unidades perdidas)</Label>
                <Input
                  id="cantidad"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Ej: 5"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Se restara esta cantidad del stock actual.
                </p>
              </div>

              {/* Motivo */}
              <div className="space-y-2">
                <Label htmlFor="motivo">
                  Motivo <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="motivo"
                  placeholder="Descripcion del motivo del quiebre (rotura, vencimiento, merma, etc.)"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Warning */}
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-950/10 p-3">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Esta accion reducira el stock del producto en la sucursal
                  seleccionada. El movimiento quedara registrado en el historial.
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" asChild>
                  <Link href="/inventario">Cancelar</Link>
                </Button>
                <Button
                  type="submit"
                  disabled={
                    adjustMutation.isPending ||
                    !selectedProducto ||
                    !selectedSucursal ||
                    !cantidad ||
                    !motivo
                  }
                  variant="destructive"
                >
                  {adjustMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <PackageMinus className="mr-2 h-4 w-4" />
                  )}
                  {adjustMutation.isPending
                    ? "Registrando..."
                    : "Registrar Quiebre"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Recent breakage history */}
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold text-foreground mb-1">
              Historial de quiebres
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Ultimos movimientos de tipo QUIEBRE
            </p>

            {historyLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : historyItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <PackageMinus className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">
                  No hay quiebres registrados
                </p>
              </div>
            ) : (
              <div className="max-h-[500px] overflow-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="border-muted/50">
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Fecha
                      </TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Producto
                      </TableHead>
                      <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Cantidad
                      </TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Motivo
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyItems.map((mov) => (
                      <TableRow key={mov.id} className="border-muted/30">
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(mov.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <p className="text-sm font-medium">
                              {mov.producto_nombre || "—"}
                            </p>
                            {mov.producto_codigo && (
                              <Badge
                                variant="outline"
                                className="font-mono text-[10px] border-[var(--accent)]/30 text-[var(--accent)]"
                              >
                                {mov.producto_codigo}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-semibold text-red-600 dark:text-red-400">
                          {mov.cantidad}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                          {mov.motivo || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { useState, useRef, useLayoutEffect, useCallback, useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { useProductos, useCatalogo, useUpsertCatalogo } from "@/hooks/queries/use-products";
import { useBranches } from "@/hooks/queries/use-branches";
import { catalogoApi } from "@/lib/products";
import type { Branch, Producto, CatalogoProducto } from "@pronto/shared/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import gsap from "gsap";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(n);
}

type EditingCell = {
  productoId: string;
  sucursalId: string;
} | null;

export default function PreciosPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const { data: branchesData, isLoading: branchesLoading } = useBranches();
  const branches: Branch[] = branchesData?.data ?? [];

  const { data: productosData, isLoading: productosLoading } = useProductos({
    page,
    pageSize,
  });
  const productos: Producto[] = productosData?.data ?? [];
  const meta = productosData?.meta;

  // Fetch catalogs for all branches in parallel
  const catalogQueries = useQueries({
    queries: branches.map((branch) => ({
      queryKey: ["catalogo", branch.id, 1, 1000],
      queryFn: () => catalogoApi.listBySucursal(branch.id, 1, 1000),
      enabled: !!branch.id,
    })),
  });

  // Build a lookup map: `${productoId}-${sucursalId}` -> CatalogoProducto
  const catalogMap = useMemo(() => {
    const map = new Map<string, CatalogoProducto>();
    catalogQueries.forEach((query) => {
      const items = query.data?.data ?? [];
      items.forEach((item: CatalogoProducto) => {
        map.set(`${item.producto_id}-${item.sucursal_id}`, item);
      });
    });
    return map;
  }, [catalogQueries]);

  const catalogsLoading = catalogQueries.some((q) => q.isLoading);
  const isLoading = branchesLoading || productosLoading || catalogsLoading;

  const upsertMutation = useUpsertCatalogo();

  const [editingCell, setEditingCell] = useState<EditingCell>(null);
  const [editValue, setEditValue] = useState("");

  const handleCellClick = useCallback(
    (productoId: string, sucursalId: string, currentPrice: number) => {
      setEditingCell({ productoId, sucursalId });
      setEditValue(currentPrice > 0 ? String(currentPrice) : "");
    },
    [],
  );

  const handleSave = useCallback(
    (productoId: string, sucursalId: string) => {
      const newPrice = parseFloat(editValue);
      if (isNaN(newPrice) || newPrice < 0) {
        toast.error("Precio invalido");
        setEditingCell(null);
        return;
      }

      const existing = catalogMap.get(`${productoId}-${sucursalId}`);
      const stock = existing?.stock ?? 0;

      upsertMutation.mutate(
        {
          producto_id: productoId,
          sucursal_id: sucursalId,
          precio: newPrice,
          stock,
        },
        {
          onSuccess: () => setEditingCell(null),
          onError: () => setEditingCell(null),
        },
      );
    },
    [editValue, catalogMap, upsertMutation],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, productoId: string, sucursalId: string) => {
      if (e.key === "Enter") {
        handleSave(productoId, sucursalId);
      } else if (e.key === "Escape") {
        setEditingCell(null);
      }
    },
    [handleSave],
  );

  // GSAP entrance animation
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".precios-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      );
      gsap.fromTo(
        ".precios-content",
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.15 },
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const totalPages = meta?.totalPages ?? 1;

  return (
    <div ref={containerRef} className="space-y-5">
      {/* Header */}
      <div className="precios-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
              <DollarSign className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Gestion de Precios
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Administra precios por sucursal
          </p>
        </div>
      </div>

      {/* Matrix Table */}
      <Card className="precios-content">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Matriz de Precios
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : productos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <DollarSign className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                Sin productos
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                No hay productos registrados para mostrar precios.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      <th className="sticky left-0 z-10 bg-muted/30 px-4 py-3 text-left font-semibold text-foreground">
                        Producto
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-muted-foreground whitespace-nowrap">
                        Precio Base
                      </th>
                      {branches.map((branch) => (
                        <th
                          key={branch.id}
                          className="px-4 py-3 text-center font-semibold whitespace-nowrap"
                        >
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-foreground">
                              {branch.nombre}
                            </span>
                            {branch.tipo && (
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px] px-1.5 py-0",
                                  branch.tipo === "TIENDA" &&
                                    "border-blue-300 text-blue-600 dark:border-blue-700 dark:text-blue-400",
                                  branch.tipo === "DEPOSITO" &&
                                    "border-orange-300 text-orange-600 dark:border-orange-700 dark:text-orange-400",
                                )}
                              >
                                {branch.tipo}
                              </Badge>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {productos.map((producto, idx) => (
                      <tr
                        key={producto.id}
                        className={cn(
                          "border-b border-border/30 transition-colors hover:bg-muted/20",
                          idx % 2 === 0 && "bg-muted/5",
                        )}
                      >
                        {/* Product info */}
                        <td className="sticky left-0 z-10 bg-inherit px-4 py-2.5">
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">
                              {producto.nombre}
                            </span>
                            {producto.codigo && (
                              <span className="text-xs text-muted-foreground font-mono">
                                {producto.codigo}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Precio Base */}
                        <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground whitespace-nowrap">
                          {formatCurrency(producto.precio_base ?? 0)}
                        </td>

                        {/* Branch price cells */}
                        {branches.map((branch) => {
                          const key = `${producto.id}-${branch.id}`;
                          const catalog = catalogMap.get(key);
                          const price = catalog?.precio ?? 0;
                          const isEditing =
                            editingCell?.productoId === producto.id &&
                            editingCell?.sucursalId === branch.id;

                          return (
                            <td
                              key={branch.id}
                              className="px-2 py-1.5 text-center"
                            >
                              {isEditing ? (
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={(e) =>
                                    handleKeyDown(e, producto.id, branch.id)
                                  }
                                  onBlur={() =>
                                    handleSave(producto.id, branch.id)
                                  }
                                  autoFocus
                                  className="h-8 w-28 mx-auto text-center tabular-nums text-sm"
                                  disabled={upsertMutation.isPending}
                                />
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCellClick(
                                      producto.id,
                                      branch.id,
                                      price,
                                    )
                                  }
                                  className={cn(
                                    "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm tabular-nums transition-colors",
                                    "hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] cursor-pointer",
                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                    price > 0
                                      ? "font-medium text-foreground"
                                      : "text-muted-foreground/50",
                                  )}
                                >
                                  {price > 0 ? formatCurrency(price) : "--"}
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border/50 px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    Pagina {page} de {totalPages}
                    {meta?.total != null && (
                      <span>
                        {" "}
                        ({meta.total}{" "}
                        {meta.total === 1 ? "producto" : "productos"})
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

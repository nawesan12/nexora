"use client";

import { useState, useMemo, useRef, useLayoutEffect } from "react";
import {
  useCatalogo,
  useUpsertCatalogo,
  useDeleteCatalogo,
  useProductos,
} from "@/hooks/queries/use-products";
import { useUserStore } from "@/store/user-store";
import { hasPermission } from "@/lib/permissions";
import type { CatalogoProducto } from "@pronto/shared/types";
import type { ColumnDef } from "@tanstack/react-table";
import {
  DataTable,
  DataTableColumnHeader,
  DataTableRowActions,
  type RowAction,
} from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Trash2,
  Pencil,
  AlertTriangle,
  Warehouse,
  Package,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyProducts } from "@/components/illustrations";
import gsap from "gsap";

const LOW_STOCK_THRESHOLD = 10;

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(n);
}

export default function StockPage() {
  const user = useUserStore((s) => s.user);
  const permissions = user?.permissions ?? [];
  const canManage = hasPermission(permissions, "stock:adjust");
  const sucursales = user?.sucursales || [];

  const [selectedSucursal, setSelectedSucursal] = useState(
    sucursales[0]?.id || "",
  );
  const [page, setPage] = useState(1);
  const { data, isLoading } = useCatalogo(selectedSucursal, page, 20);
  const items = data?.data || [];
  const meta = data?.meta;

  const [addDialog, setAddDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    productoId: string;
    sucursalId: string;
  } | null>(null);

  const upsertMutation = useUpsertCatalogo();
  const deleteMutation = useDeleteCatalogo();

  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".stock-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      );
      gsap.fromTo(
        ".stock-summary",
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.15 },
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const currentBranch =
    sucursales.find((s) => s.id === selectedSucursal)?.nombre || "Sucursal";

  const columns = useMemo<ColumnDef<CatalogoProducto, unknown>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Seleccionar todos"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Seleccionar fila"
            onClick={(e) => e.stopPropagation()}
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40,
      },
      {
        accessorKey: "producto_codigo",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Codigo" />
        ),
        cell: ({ row }) => {
          const code = row.getValue("producto_codigo") as string;
          return code ? (
            <Badge
              variant="outline"
              className="font-mono text-xs border-[var(--accent)]/30 text-[var(--accent)]"
            >
              {code}
            </Badge>
          ) : (
            <span className="text-muted-foreground/50">--</span>
          );
        },
      },
      {
        accessorKey: "producto_nombre",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Producto" />
        ),
        cell: ({ row }) => {
          const item = row.original;
          const isLow = item.stock <= LOW_STOCK_THRESHOLD;
          return (
            <div className="flex items-center gap-1.5">
              <span className="font-medium">{item.producto_nombre}</span>
              {isLow && (
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              )}
            </div>
          );
        },
        enableHiding: false,
      },
      {
        accessorKey: "producto_unidad",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Unidad" />
        ),
        cell: ({ row }) => (
          <Badge
            variant="secondary"
            className="border-0 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
          >
            {row.getValue("producto_unidad")}
          </Badge>
        ),
      },
      {
        accessorKey: "producto_precio_base",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Precio Base" className="justify-end" />
        ),
        cell: ({ row }) => (
          <div className="text-right tabular-nums text-muted-foreground">
            {formatCurrency(row.getValue("producto_precio_base") as number || 0)}
          </div>
        ),
      },
      {
        accessorKey: "precio",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Precio Sucursal" className="justify-end" />
        ),
        cell: ({ row }) => (
          <div className="text-right tabular-nums font-medium">
            {formatCurrency(row.getValue("precio") as number)}
          </div>
        ),
      },
      {
        accessorKey: "stock",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Stock" className="justify-end" />
        ),
        cell: ({ row }) => {
          const stock = row.getValue("stock") as number;
          const isLow = stock <= LOW_STOCK_THRESHOLD;
          return (
            <div className="text-right">
              <span
                className={cn(
                  "tabular-nums font-semibold",
                  isLow
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-foreground",
                )}
              >
                {stock}
              </span>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => (
          <span className="text-xs font-semibold uppercase tracking-wider">
            Acciones
          </span>
        ),
        cell: ({ row }) => {
          const item = row.original;
          const actions: RowAction[] = [];
          if (canManage) {
            actions.push({
              label: "Editar precio/stock",
              icon: <Pencil className="h-4 w-4" />,
              onClick: () => {
                // TODO: open edit dialog
              },
            });
            actions.push({
              label: "Quitar del catalogo",
              icon: <Trash2 className="h-4 w-4" />,
              onClick: () =>
                setDeleteTarget({
                  productoId: item.producto_id,
                  sucursalId: item.sucursal_id,
                }),
              variant: "destructive",
              separator: true,
            });
          }
          if (actions.length === 0) return null;
          return (
            <div onClick={(ev) => ev.stopPropagation()}>
              <DataTableRowActions actions={actions} />
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
        size: 60,
      },
    ],
    [canManage],
  );

  return (
    <div ref={containerRef} className="space-y-5">
      {/* Header */}
      <div className="stock-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Stock por Sucursal
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestiona precios y stock de cada sucursal
          </p>
        </div>
        <div className="flex items-center gap-3">
          {sucursales.length > 1 && (
            <Select
              value={selectedSucursal}
              onValueChange={setSelectedSucursal}
            >
              <SelectTrigger className="w-56 border-border/50 shadow-sm">
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
          )}
        </div>
      </div>

      {/* Summary Bar */}
      {meta && (
        <div className="stock-summary flex items-center gap-3 rounded-xl border border-border/50 bg-gradient-to-r from-[var(--accent)]/5 to-transparent px-5 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
            <Warehouse className="h-4 w-4" />
          </div>
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{meta.total}</span>{" "}
            {meta.total === 1 ? "producto" : "productos"} en{" "}
            <span className="font-medium text-foreground">{currentBranch}</span>
          </span>
        </div>
      )}

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={items}
        page={page}
        pageSize={20}
        totalPages={meta?.totalPages || 1}
        totalItems={meta?.total}
        onPageChange={setPage}
        searchKey="producto_nombre"
        searchPlaceholder="Buscar productos..."
        isLoading={isLoading}
        emptyIllustration={<EmptyProducts className="w-full h-full" />}
        emptyMessage="No hay productos en esta sucursal"
        emptyDescription="Agrega productos al catalogo para comenzar."
        enableRowSelection={canManage}
        bulkActions={
          canManage ? (
            <Button variant="ghost" size="sm" className="h-7 text-xs">
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Exportar
            </Button>
          ) : undefined
        }
        toolbarActions={
          canManage && selectedSucursal ? (
            <Button size="sm" className="h-9" onClick={() => setAddDialog(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Agregar
            </Button>
          ) : undefined
        }
      />

      {/* Add Product to Catalog Dialog */}
      <AddToCatalogoDialog
        open={addDialog}
        onOpenChange={setAddDialog}
        sucursalId={selectedSucursal}
        onSubmit={(data) => {
          upsertMutation.mutate(data, {
            onSuccess: () => setAddDialog(false),
          });
        }}
        isPending={upsertMutation.isPending}
      />

      {/* Delete Confirm */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Quitar del catalogo</AlertDialogTitle>
            <AlertDialogDescription>
              El producto sera eliminado del catalogo de esta sucursal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) {
                  deleteMutation.mutate(deleteTarget);
                  setDeleteTarget(null);
                }
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AddToCatalogoDialog({
  open,
  onOpenChange,
  sucursalId,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sucursalId: string;
  onSubmit: (data: {
    producto_id: string;
    sucursal_id: string;
    precio: number;
    stock: number;
  }) => void;
  isPending: boolean;
}) {
  const { data: productosData } = useProductos({ pageSize: 100 });
  const productos = productosData?.data || [];

  const [productoId, setProductoId] = useState("");
  const [precio, setPrecio] = useState("");
  const [stock, setStock] = useState("");

  const handleSubmit = () => {
    if (!productoId) return;
    onSubmit({
      producto_id: productoId,
      sucursal_id: sucursalId,
      precio: parseFloat(precio) || 0,
      stock: parseInt(stock) || 0,
    });
    setProductoId("");
    setPrecio("");
    setStock("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar producto al catalogo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Producto</label>
            <Select value={productoId} onValueChange={setProductoId}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Seleccionar producto" />
              </SelectTrigger>
              <SelectContent>
                {productos.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.codigo ? `[${p.codigo}] ` : ""}
                    {p.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Precio Sucursal</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Stock Inicial</label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending || !productoId}
            >
              {isPending ? "Guardando..." : "Agregar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

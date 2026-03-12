"use client";

import { useState, useMemo, useRef, useLayoutEffect } from "react";
import {
  useMovimientosStock,
  useAdjustStock,
} from "@/hooks/queries/use-stock";
import { useProductos } from "@/hooks/queries/use-products";
import { useUserStore } from "@/store/user-store";
import { hasPermission } from "@/lib/permissions";
import type { MovimientoStock } from "@nexora/shared/types";
import type { ColumnDef } from "@tanstack/react-table";
import {
  DataTable,
  DataTableColumnHeader,
} from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { ArrowUpDown, Plus, ArrowDown, ArrowUp, Package } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { EmptyStock } from "@/components/illustrations";
import gsap from "gsap";

const TIPO_LABELS: Record<string, string> = {
  COMPRA: "Compra",
  VENTA: "Venta",
  AJUSTE: "Ajuste",
  TRANSFERENCIA: "Transferencia",
  DEVOLUCION: "Devolucion",
  QUIEBRE: "Quiebre",
};

const TIPO_COLORS: Record<string, string> = {
  COMPRA:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  VENTA:
    "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
  AJUSTE:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  TRANSFERENCIA:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400",
  DEVOLUCION:
    "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400",
  QUIEBRE:
    "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
};

const ADJUST_TIPOS = ["AJUSTE", "QUIEBRE", "DEVOLUCION"] as const;

export default function MovimientosStockPage() {
  const user = useUserStore((s) => s.user);
  const permissions = user?.permissions ?? [];
  const canAdjust = hasPermission(permissions, "stock:adjust");
  const sucursales = user?.sucursales || [];

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 300);
  const [selectedSucursal, setSelectedSucursal] = useState<string>("");
  const [selectedTipo, setSelectedTipo] = useState<string>("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  const { data, isLoading } = useMovimientosStock({
    page,
    pageSize: 20,
    productoId: undefined,
    sucursalId: selectedSucursal || undefined,
    tipo: selectedTipo || undefined,
    fechaDesde: fechaDesde || undefined,
    fechaHasta: fechaHasta || undefined,
  });

  const movimientos = data?.data || [];
  const meta = data?.meta;
  const totalCount = meta?.total || 0;

  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".movimientos-header",
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
      );
      gsap.fromTo(
        ".movimientos-summary",
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, delay: 0.1, ease: "power3.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const columns = useMemo<ColumnDef<MovimientoStock, unknown>[]>(
    () => [
      {
        accessorKey: "producto_nombre",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Producto" />
        ),
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div>
              <span className="font-medium">{item.producto_nombre}</span>
              {item.producto_codigo && (
                <span className="ml-2 text-xs text-muted-foreground">
                  {item.producto_codigo}
                </span>
              )}
            </div>
          );
        },
        enableHiding: false,
      },
      {
        accessorKey: "sucursal_nombre",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Sucursal" />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.getValue("sucursal_nombre")}
          </span>
        ),
      },
      {
        accessorKey: "tipo",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Tipo" />
        ),
        cell: ({ row }) => {
          const tipo = row.getValue("tipo") as string;
          return (
            <Badge
              variant="secondary"
              className={`border-0 text-xs font-medium ${TIPO_COLORS[tipo] || ""}`}
            >
              {TIPO_LABELS[tipo] || tipo}
            </Badge>
          );
        },
      },
      {
        accessorKey: "cantidad",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="Cantidad"
            className="justify-end"
          />
        ),
        cell: ({ row }) => {
          const cantidad = row.getValue("cantidad") as number;
          const isPositive = cantidad > 0;
          return (
            <div className="flex items-center justify-end gap-1.5">
              {isPositive ? (
                <ArrowUp className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <ArrowDown className="h-3.5 w-3.5 text-red-500" />
              )}
              <span
                className={`tabular-nums font-semibold ${
                  isPositive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {isPositive ? `+${cantidad}` : cantidad}
              </span>
            </div>
          );
        },
      },
      {
        id: "stock_change",
        header: () => (
          <span className="text-xs font-semibold uppercase tracking-wider">
            Stock
          </span>
        ),
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex items-center gap-1 text-sm tabular-nums text-muted-foreground">
              <span>{item.stock_anterior}</span>
              <span className="text-muted-foreground/50">&rarr;</span>
              <span className="font-medium text-foreground">
                {item.stock_nuevo}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "motivo",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Motivo" />
        ),
        cell: ({ row }) => {
          const motivo = row.getValue("motivo") as string | undefined;
          return (
            <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
              {motivo || "\u2014"}
            </span>
          );
        },
      },
      {
        accessorKey: "created_at",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Fecha" />
        ),
        cell: ({ row }) => {
          const fecha = row.getValue("created_at") as string;
          return (
            <span className="text-xs text-muted-foreground">
              {new Date(fecha).toLocaleDateString("es-AR", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          );
        },
      },
    ],
    []
  );

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="movimientos-header flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Movimientos de Stock
          </h1>
          <p className="text-muted-foreground mt-1">
            Historial de entradas y salidas de inventario
          </p>
        </div>
        {canAdjust && (
          <Button
            size="lg"
            className="shadow-sm"
            onClick={() => setAdjustDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Ajustar Stock
          </Button>
        )}
      </div>

      {/* Summary bar */}
      <Card className="movimientos-summary border-0 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary to-violet-500" />
        <CardContent className="py-4">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <ArrowUpDown className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalCount}</p>
                <p className="text-xs text-muted-foreground">
                  Total movimientos
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                Buscar producto
              </Label>
              <Input
                placeholder="Nombre o codigo..."
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            {sucursales.length > 1 && (
              <div className="w-48">
                <Label className="text-xs text-muted-foreground mb-1.5 block">
                  Sucursal
                </Label>
                <Select
                  value={selectedSucursal}
                  onValueChange={(v) => {
                    setSelectedSucursal(v === "all" ? "" : v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {sucursales.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="w-44">
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                Tipo
              </Label>
              <Select
                value={selectedTipo}
                onValueChange={(v) => {
                  setSelectedTipo(v === "all" ? "" : v);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Object.entries(TIPO_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                Desde
              </Label>
              <Input
                type="date"
                value={fechaDesde}
                onChange={(e) => {
                  setFechaDesde(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="w-40">
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                Hasta
              </Label>
              <Input
                type="date"
                value={fechaHasta}
                onChange={(e) => {
                  setFechaHasta(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={movimientos}
        page={page}
        pageSize={20}
        totalPages={meta?.totalPages || 1}
        totalItems={meta?.total}
        onPageChange={setPage}
        searchKey="producto_nombre"
        searchPlaceholder="Buscar movimientos..."
        isLoading={isLoading}
        emptyIllustration={<EmptyStock className="w-full h-full" />}
        emptyMessage="No se encontraron movimientos"
        emptyDescription="Los movimientos de stock apareceran aqui cuando se registren."
        toolbarActions={
          canAdjust ? (
            <Button
              size="sm"
              className="h-9"
              onClick={() => setAdjustDialogOpen(true)}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Ajustar Stock
            </Button>
          ) : undefined
        }
      />

      {/* Adjust Stock Dialog */}
      <AdjustStockDialog
        open={adjustDialogOpen}
        onOpenChange={setAdjustDialogOpen}
        sucursales={sucursales}
      />
    </div>
  );
}

function AdjustStockDialog({
  open,
  onOpenChange,
  sucursales,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sucursales: Array<{ id: string; nombre: string }>;
}) {
  const { data: productosData } = useProductos({ pageSize: 100 });
  const productos = productosData?.data || [];
  const adjustMutation = useAdjustStock();

  const [productoId, setProductoId] = useState("");
  const [sucursalId, setSucursalId] = useState(sucursales[0]?.id || "");
  const [cantidad, setCantidad] = useState("");
  const [tipo, setTipo] = useState<string>("");
  const [motivo, setMotivo] = useState("");

  const resetForm = () => {
    setProductoId("");
    setSucursalId(sucursales[0]?.id || "");
    setCantidad("");
    setTipo("");
    setMotivo("");
  };

  const handleSubmit = () => {
    if (!productoId || !sucursalId || !cantidad || !tipo || !motivo) return;
    adjustMutation.mutate(
      {
        producto_id: productoId,
        sucursal_id: sucursalId,
        cantidad: parseInt(cantidad),
        tipo,
        motivo,
      },
      {
        onSuccess: () => {
          resetForm();
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajustar Stock</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Producto</Label>
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
          <div>
            <Label>Sucursal</Label>
            <Select value={sucursalId} onValueChange={setSucursalId}>
              <SelectTrigger className="mt-1.5">
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Cantidad</Label>
              <Input
                type="number"
                placeholder="Ej: 10 o -5"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {ADJUST_TIPOS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {TIPO_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Motivo</Label>
            <Textarea
              placeholder="Describe el motivo del ajuste..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="mt-1.5"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              adjustMutation.isPending ||
              !productoId ||
              !sucursalId ||
              !cantidad ||
              !tipo ||
              !motivo
            }
          >
            {adjustMutation.isPending ? "Guardando..." : "Registrar Ajuste"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState, useMemo, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { useGastosRecurrentes, useDeleteGastoRecurrente } from "@/hooks/queries/use-finance";
import type { GastoRecurrente } from "@nexora/shared/types";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable, DataTableColumnHeader, DataTableRowActions, type RowAction } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  RefreshCw,
  Download,
} from "lucide-react";
import { EmptyFinance } from "@/components/illustrations";
import gsap from "gsap";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(n);
}

const categoriaLabels: Record<string, string> = {
  OPERATIVO: "Operativo",
  ADMINISTRATIVO: "Administrativo",
  LOGISTICA: "Logística",
  COMERCIAL: "Comercial",
  IMPOSITIVO: "Impositivo",
};

const CATEGORIA_COLORS: Record<string, string> = {
  OPERATIVO: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
  ADMINISTRATIVO: "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400",
  LOGISTICA: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  COMERCIAL: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-400",
  IMPOSITIVO: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
};

const frecuenciaLabels: Record<string, string> = {
  DIARIA: "Diaria",
  SEMANAL: "Semanal",
  QUINCENAL: "Quincenal",
  MENSUAL: "Mensual",
  BIMESTRAL: "Bimestral",
  TRIMESTRAL: "Trimestral",
  SEMESTRAL: "Semestral",
  ANUAL: "Anual",
};

export default function GastosRecurrentesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGastosRecurrentes({ page, pageSize: 20 });
  const deleteMutation = useDeleteGastoRecurrente();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const items = data?.data || [];
  const meta = data?.meta;

  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".gr-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      );
      gsap.fromTo(
        ".gr-summary",
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.15 },
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const columns = useMemo<ColumnDef<GastoRecurrente, unknown>[]>(
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
        accessorKey: "concepto",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Concepto" />
        ),
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {row.getValue("concepto")}
          </span>
        ),
        enableHiding: false,
      },
      {
        accessorKey: "monto",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Monto" className="justify-end" />
        ),
        cell: ({ row }) => (
          <div className="text-right font-semibold text-red-600 dark:text-red-400">
            {formatCurrency(row.getValue("monto") as number)}
          </div>
        ),
      },
      {
        accessorKey: "categoria",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Categoría" />
        ),
        cell: ({ row }) => {
          const cat = row.getValue("categoria") as string;
          return (
            <Badge
              variant="secondary"
              className={`border-0 text-xs font-medium ${CATEGORIA_COLORS[cat] || "bg-gray-100 text-gray-700"}`}
            >
              {categoriaLabels[cat] || cat}
            </Badge>
          );
        },
        filterFn: (row, id, value) => value === undefined || row.getValue(id) === value,
      },
      {
        accessorKey: "frecuencia",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Frecuencia" />
        ),
        cell: ({ row }) => {
          const freq = row.getValue("frecuencia") as string;
          return (
            <Badge variant="outline" className="text-xs font-medium">
              {frecuenciaLabels[freq] || freq}
            </Badge>
          );
        },
        filterFn: (row, id, value) => value === undefined || row.getValue(id) === value,
      },
      {
        accessorKey: "proxima_fecha",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Próxima Fecha" />
        ),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {new Date(row.getValue("proxima_fecha") as string).toLocaleDateString("es-AR")}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => (
          <span className="text-xs font-semibold uppercase tracking-wider">
            Acciones
          </span>
        ),
        cell: ({ row }) => {
          const g = row.original;
          const actions: RowAction[] = [
            {
              label: "Eliminar",
              icon: <Trash2 className="h-4 w-4" />,
              onClick: () => setDeleteId(g.id),
              variant: "destructive",
              separator: true,
            },
          ];
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
    [],
  );

  return (
    <div ref={containerRef} className="space-y-5">
      {/* Header */}
      <div className="gr-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Gastos Recurrentes
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestiona los gastos que se repiten periódicamente
          </p>
        </div>
        <Button asChild className="shadow-sm">
          <Link href="/finanzas/gastos-recurrentes/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Gasto Recurrente
          </Link>
        </Button>
      </div>

      {/* Summary Bar */}
      {meta && (
        <div className="gr-summary flex items-center gap-3 rounded-xl border border-border/50 bg-gradient-to-r from-[var(--accent)]/5 to-transparent px-5 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
            <RefreshCw className="h-4 w-4" />
          </div>
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{meta.total}</span>
            {" gastos recurrentes activos"}
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
        searchKey="concepto"
        searchPlaceholder="Buscar por concepto..."
        filterOptions={[
          {
            key: "categoria",
            label: "Categoría",
            options: Object.entries(categoriaLabels).map(([value, label]) => ({
              value,
              label,
            })),
          },
          {
            key: "frecuencia",
            label: "Frecuencia",
            options: Object.entries(frecuenciaLabels).map(([value, label]) => ({
              value,
              label,
            })),
          },
        ]}
        isLoading={isLoading}
        emptyIllustration={<EmptyFinance className="w-full h-full" />}
        emptyMessage="No se encontraron gastos recurrentes"
        emptyDescription="Crea un nuevo gasto recurrente para comenzar."
        emptyAction={{ label: "Nuevo Gasto Rec.", href: "/finanzas/gastos-recurrentes/nuevo" }}
        enableRowSelection
        bulkActions={
          <Button variant="ghost" size="sm" className="h-7 text-xs">
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Exportar
          </Button>
        }
        toolbarActions={
          <Button asChild size="sm" className="h-9">
            <Link href="/finanzas/gastos-recurrentes/nuevo">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Nuevo
            </Link>
          </Button>
        }
      />

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar gasto recurrente</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El gasto recurrente dejará de generarse.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  deleteMutation.mutate(deleteId);
                  setDeleteId(null);
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

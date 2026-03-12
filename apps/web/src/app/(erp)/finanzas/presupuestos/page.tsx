"use client";

import { useState, useMemo, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePresupuestos, useDeletePresupuesto } from "@/hooks/queries/use-finance";
import type { Presupuesto } from "@nexora/shared/types";
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
  Eye,
  Trash2,
  PieChart,
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

const estadoPresupuestoLabels: Record<string, string> = {
  BORRADOR: "Borrador",
  ACTIVO: "Activo",
  CERRADO: "Cerrado",
  EXCEDIDO: "Excedido",
};

const PRESUPUESTO_COLORS: Record<string, string> = {
  BORRADOR: "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400",
  ACTIVO: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  CERRADO: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
  EXCEDIDO: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
};

export default function PresupuestosPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);

  const { data, isLoading } = usePresupuestos({ page, pageSize: 20 });
  const deleteMutation = useDeletePresupuesto();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const presupuestos = data?.data || [];
  const meta = data?.meta;

  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".presupuestos-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      );
      gsap.fromTo(
        ".presupuestos-summary",
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.15 },
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const columns = useMemo<ColumnDef<Presupuesto, unknown>[]>(
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
        accessorKey: "nombre",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Nombre" />
        ),
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {row.getValue("nombre")}
          </span>
        ),
        enableHiding: false,
      },
      {
        accessorKey: "monto_asignado",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Monto Asignado" className="justify-end" />
        ),
        cell: ({ row }) => (
          <div className="text-right font-semibold">
            {formatCurrency(row.getValue("monto_asignado") as number)}
          </div>
        ),
      },
      {
        accessorKey: "estado",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Estado" />
        ),
        cell: ({ row }) => {
          const estado = row.getValue("estado") as string;
          return (
            <Badge
              variant="secondary"
              className={`border-0 text-xs font-medium ${PRESUPUESTO_COLORS[estado] || "bg-gray-100 text-gray-700"}`}
            >
              {estadoPresupuestoLabels[estado] || estado}
            </Badge>
          );
        },
        filterFn: (row, id, value) => {
          return value === undefined || row.getValue(id) === value;
        },
      },
      {
        accessorKey: "fecha_inicio",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Inicio" />
        ),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {new Date(row.getValue("fecha_inicio") as string).toLocaleDateString("es-AR")}
          </span>
        ),
      },
      {
        accessorKey: "fecha_fin",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Fin" />
        ),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {new Date(row.getValue("fecha_fin") as string).toLocaleDateString("es-AR")}
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
          const p = row.original;
          const actions: RowAction[] = [
            {
              label: "Ver detalle",
              icon: <Eye className="h-4 w-4" />,
              onClick: () => router.push(`/finanzas/presupuestos/${p.id}`),
            },
            {
              label: "Eliminar",
              icon: <Trash2 className="h-4 w-4" />,
              onClick: () => setDeleteId(p.id),
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
    [router],
  );

  return (
    <div ref={containerRef} className="space-y-5">
      {/* Header */}
      <div className="presupuestos-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Presupuestos
          </h1>
          <p className="text-sm text-muted-foreground">
            Define y controla los presupuestos por periodo
          </p>
        </div>
        <Button asChild className="shadow-sm">
          <Link href="/finanzas/presupuestos/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Presupuesto
          </Link>
        </Button>
      </div>

      {/* Summary Bar */}
      {meta && (
        <div className="presupuestos-summary flex items-center gap-3 rounded-xl border border-border/50 bg-gradient-to-r from-[var(--accent)]/5 to-transparent px-5 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
            <PieChart className="h-4 w-4" />
          </div>
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{meta.total}</span>
            {" presupuestos en total"}
          </span>
        </div>
      )}

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={presupuestos}
        page={page}
        pageSize={20}
        totalPages={meta?.totalPages || 1}
        totalItems={meta?.total}
        onPageChange={setPage}
        searchKey="nombre"
        searchPlaceholder="Buscar por nombre..."
        filterOptions={[
          {
            key: "estado",
            label: "Estado",
            options: Object.entries(estadoPresupuestoLabels).map(([value, label]) => ({
              value,
              label,
            })),
          },
        ]}
        isLoading={isLoading}
        emptyIllustration={<EmptyFinance className="w-full h-full" />}
        emptyMessage="No se encontraron presupuestos"
        emptyDescription="Crea un nuevo presupuesto para comenzar."
        emptyAction={{ label: "Nuevo Presupuesto", href: "/finanzas/presupuestos/nuevo" }}
        enableRowSelection
        onRowClick={(row) => router.push(`/finanzas/presupuestos/${row.original.id}`)}
        bulkActions={
          <Button variant="ghost" size="sm" className="h-7 text-xs">
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Exportar
          </Button>
        }
        toolbarActions={
          <Button asChild size="sm" className="h-9">
            <Link href="/finanzas/presupuestos/nuevo">
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
            <AlertDialogTitle>Eliminar presupuesto</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer.
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

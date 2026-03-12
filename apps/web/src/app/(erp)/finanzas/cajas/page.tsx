"use client";

import { useState, useMemo, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCajas, useDeleteCaja } from "@/hooks/queries/use-finance";
import type { Caja } from "@nexora/shared/types";
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
  Wallet,
  Landmark,
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

const tipoLabels: Record<string, string> = {
  EFECTIVO: "Efectivo",
  BANCO: "Banco",
};

const TIPO_COLORS: Record<string, string> = {
  EFECTIVO: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  BANCO: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
};

export default function CajasPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useCajas({ page, pageSize: 20 });
  const deleteMutation = useDeleteCaja();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const cajas = data?.data || [];
  const meta = data?.meta;

  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".cajas-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      );
      gsap.fromTo(
        ".cajas-summary",
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.15 },
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const columns = useMemo<ColumnDef<Caja, unknown>[]>(
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
        accessorKey: "tipo",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Tipo" />
        ),
        cell: ({ row }) => {
          const tipo = row.getValue("tipo") as string;
          return (
            <Badge
              variant="secondary"
              className={`border-0 text-xs font-medium gap-1.5 ${TIPO_COLORS[tipo] || "bg-gray-100 text-gray-700"}`}
            >
              {tipo === "BANCO" ? (
                <Landmark className="h-3 w-3" />
              ) : (
                <Wallet className="h-3 w-3" />
              )}
              {tipoLabels[tipo] || tipo}
            </Badge>
          );
        },
        filterFn: (row, id, value) => {
          return value === undefined || row.getValue(id) === value;
        },
      },
      {
        accessorKey: "saldo",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Saldo" className="justify-end" />
        ),
        cell: ({ row }) => {
          const saldo = row.getValue("saldo") as number;
          return (
            <div className="text-right">
              <span
                className={`font-semibold ${saldo >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
              >
                {formatCurrency(saldo)}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "created_at",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Creado" />
        ),
        cell: ({ row }) => {
          const date = row.getValue("created_at") as string;
          return (
            <span className="text-xs text-muted-foreground">
              {new Date(date).toLocaleDateString("es-AR")}
            </span>
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
          const c = row.original;
          const actions: RowAction[] = [
            {
              label: "Ver detalle",
              icon: <Eye className="h-4 w-4" />,
              onClick: () => router.push(`/finanzas/cajas/${c.id}`),
            },
            {
              label: "Eliminar",
              icon: <Trash2 className="h-4 w-4" />,
              onClick: () => setDeleteId(c.id),
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
      <div className="cajas-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Cajas
          </h1>
          <p className="text-sm text-muted-foreground">
            Administra las cajas de efectivo y cuentas bancarias
          </p>
        </div>
        <Button asChild className="shadow-sm">
          <Link href="/finanzas/cajas/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Caja
          </Link>
        </Button>
      </div>

      {/* Summary Bar */}
      {meta && (
        <div className="cajas-summary flex items-center gap-3 rounded-xl border border-border/50 bg-gradient-to-r from-[var(--accent)]/5 to-transparent px-5 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
            <Wallet className="h-4 w-4" />
          </div>
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{meta.total}</span>
            {" cajas en total"}
          </span>
        </div>
      )}

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={cajas}
        page={page}
        pageSize={20}
        totalPages={meta?.totalPages || 1}
        totalItems={meta?.total}
        onPageChange={setPage}
        searchKey="nombre"
        searchPlaceholder="Buscar por nombre..."
        filterOptions={[
          {
            key: "tipo",
            label: "Tipo",
            options: Object.entries(tipoLabels).map(([value, label]) => ({
              value,
              label,
            })),
          },
        ]}
        isLoading={isLoading}
        emptyIllustration={<EmptyFinance className="w-full h-full" />}
        emptyMessage="No se encontraron cajas"
        emptyDescription="Crea una nueva caja para comenzar."
        emptyAction={{ label: "Nueva Caja", href: "/finanzas/cajas/nueva" }}
        enableRowSelection
        onRowClick={(row) => router.push(`/finanzas/cajas/${row.original.id}`)}
        bulkActions={
          <Button variant="ghost" size="sm" className="h-7 text-xs">
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Exportar
          </Button>
        }
        toolbarActions={
          <Button asChild size="sm" className="h-9">
            <Link href="/finanzas/cajas/nuevo">
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
            <AlertDialogTitle>Eliminar caja</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. La caja sera desactivada.
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

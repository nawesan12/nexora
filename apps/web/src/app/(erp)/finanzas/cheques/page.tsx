"use client";

import { useState, useMemo, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { useCheques, useUpdateChequeEstado } from "@/hooks/queries/use-finance";
import { useDebounce } from "@/hooks/use-debounce";
import type { Cheque } from "@pronto/shared/types";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable, DataTableColumnHeader, DataTableRowActions, type RowAction } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  CreditCard,
  ArrowDownToLine,
  BadgeCheck,
  Trash2,
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

const estadoChequeLabels: Record<string, string> = {
  EN_CARTERA: "En Cartera",
  DEPOSITADO: "Depositado",
  COBRADO: "Cobrado",
  RECHAZADO: "Rechazado",
  ENDOSADO: "Endosado",
  VENCIDO: "Vencido",
};

const CHEQUE_COLORS: Record<string, string> = {
  EN_CARTERA: "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400",
  DEPOSITADO: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
  COBRADO: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  RECHAZADO: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
  ENDOSADO: "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400",
  VENCIDO: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
};

export default function ChequesPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 300);
  const [estado, setEstado] = useState<string>("");

  const { data, isLoading } = useCheques({
    page,
    pageSize: 20,
    search: search || undefined,
    estado: estado || undefined,
  });
  const updateEstado = useUpdateChequeEstado();

  const cheques = data?.data || [];
  const meta = data?.meta;

  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".cheques-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      );
      gsap.fromTo(
        ".cheques-summary",
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.15 },
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const columns = useMemo<ColumnDef<Cheque, unknown>[]>(
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
        accessorKey: "numero",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Numero" />
        ),
        cell: ({ row }) => (
          <code className="rounded bg-muted px-2 py-0.5 font-mono text-sm">
            {row.getValue("numero")}
          </code>
        ),
        enableHiding: false,
      },
      {
        accessorKey: "monto",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Monto" className="justify-end" />
        ),
        cell: ({ row }) => (
          <div className="text-right font-semibold">
            {formatCurrency(row.getValue("monto") as number)}
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
              className={`border-0 text-xs font-medium ${CHEQUE_COLORS[estado] || "bg-gray-100 text-gray-700"}`}
            >
              {estadoChequeLabels[estado] || estado}
            </Badge>
          );
        },
        filterFn: (row, id, value) => {
          return value === undefined || row.getValue(id) === value;
        },
      },
      {
        accessorKey: "banco",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Banco" />
        ),
        cell: ({ row }) => {
          const banco = row.getValue("banco") as string | undefined;
          return banco ? (
            <span className="text-sm text-muted-foreground">{banco}</span>
          ) : (
            <span className="text-xs text-muted-foreground/50">—</span>
          );
        },
      },
      {
        accessorKey: "fecha_emision",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Emision" />
        ),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {new Date(row.getValue("fecha_emision") as string).toLocaleDateString("es-AR")}
          </span>
        ),
      },
      {
        accessorKey: "fecha_vencimiento",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Vencimiento" />
        ),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {new Date(row.getValue("fecha_vencimiento") as string).toLocaleDateString("es-AR")}
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
          const ch = row.original;
          const actions: RowAction[] = [];

          if (ch.estado === "EN_CARTERA") {
            actions.push({
              label: "Depositar",
              icon: <ArrowDownToLine className="h-4 w-4" />,
              onClick: () =>
                updateEstado.mutate({
                  id: ch.id,
                  data: { estado: "DEPOSITADO" } as any,
                }),
            });
          }

          if (ch.estado === "DEPOSITADO") {
            actions.push({
              label: "Cobrar",
              icon: <BadgeCheck className="h-4 w-4" />,
              onClick: () =>
                updateEstado.mutate({
                  id: ch.id,
                  data: { estado: "COBRADO" } as any,
                }),
            });
          }

          actions.push({
            label: "Eliminar",
            icon: <Trash2 className="h-4 w-4" />,
            onClick: () => {
              // Cheques don't have a delete mutation in the current hooks,
              // but we keep the action for UI consistency
            },
            variant: "destructive",
            separator: true,
          });

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
    [updateEstado],
  );

  return (
    <div ref={containerRef} className="space-y-5">
      {/* Header */}
      <div className="cheques-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Cheques
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestiona los cheques recibidos y su estado
          </p>
        </div>
        <Button asChild className="shadow-sm">
          <Link href="/finanzas/cheques/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Cheque
          </Link>
        </Button>
      </div>

      {/* Summary Bar */}
      {meta && (
        <div className="cheques-summary flex items-center gap-3 rounded-xl border border-border/50 bg-gradient-to-r from-[var(--accent)]/5 to-transparent px-5 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
            <CreditCard className="h-4 w-4" />
          </div>
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{meta.total}</span>
            {" cheques en total"}
          </span>
        </div>
      )}

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={cheques}
        page={page}
        pageSize={20}
        totalPages={meta?.totalPages || 1}
        totalItems={meta?.total}
        onPageChange={setPage}
        searchKey="numero"
        searchPlaceholder="Buscar por numero..."
        filterOptions={[
          {
            key: "estado",
            label: "Estado",
            options: Object.entries(estadoChequeLabels).map(([value, label]) => ({
              value,
              label,
            })),
          },
        ]}
        isLoading={isLoading}
        emptyIllustration={<EmptyFinance className="w-full h-full" />}
        emptyMessage="No se encontraron cheques"
        emptyDescription="Registra un nuevo cheque para comenzar."
        emptyAction={{ label: "Nuevo Cheque", href: "/finanzas/cheques/nuevo" }}
        enableRowSelection
        bulkActions={
          <Button variant="ghost" size="sm" className="h-7 text-xs">
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Exportar
          </Button>
        }
        toolbarActions={
          <Button asChild size="sm" className="h-9">
            <Link href="/finanzas/cheques/nuevo">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Nuevo
            </Link>
          </Button>
        }
      />
    </div>
  );
}

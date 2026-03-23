"use client";

import { useState, useMemo, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFacturas, useEmitFactura, useVoidFactura, useDeleteFactura } from "@/hooks/queries/use-invoices";
import { useDebounce } from "@/hooks/use-debounce";
import type { ComprobanteList } from "@pronto/shared/types";
import {
  ESTADO_COMPROBANTE_LABELS,
  TIPO_COMPROBANTE_LABELS,
} from "@pronto/shared/constants";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable, DataTableColumnHeader, DataTableRowActions, type RowAction } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  FileText,
  Send,
  Ban,
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

const ESTADO_COLORS: Record<string, string> = {
  BORRADOR: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  EMITIDO: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  ANULADO: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
};

const AFIP_ESTADO_COLORS: Record<string, string> = {
  NO_APLICA: "bg-gray-100 text-gray-500 dark:bg-gray-800/50 dark:text-gray-400",
  PENDIENTE: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  AUTORIZADO: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  RECHAZADO: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
};

const AFIP_ESTADO_LABELS: Record<string, string> = {
  NO_APLICA: "N/A",
  PENDIENTE: "Pendiente",
  AUTORIZADO: "Autorizado",
  RECHAZADO: "Rechazado",
};

export default function FacturasPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 300);
  const [estado, setEstado] = useState<string>("");

  const { data, isLoading } = useFacturas({
    page,
    pageSize: 20,
    search: search || undefined,
    estado: estado || undefined,
  });
  const emitMutation = useEmitFactura();
  const voidMutation = useVoidFactura();
  const deleteMutation = useDeleteFactura();

  const facturas = data?.data || [];
  const meta = data?.meta;

  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".facturas-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      );
      gsap.fromTo(
        ".facturas-summary",
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.15 },
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const columns = useMemo<ColumnDef<ComprobanteList, unknown>[]>(
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
        id: "tipo_letra",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Tipo" />
        ),
        cell: ({ row }) => {
          const tipo = row.original.tipo;
          const letra = row.original.letra;
          return (
            <span className="text-sm font-medium">
              {TIPO_COMPROBANTE_LABELS[tipo] || tipo} {letra}
            </span>
          );
        },
      },
      {
        accessorKey: "cliente_nombre",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Cliente" />
        ),
        cell: ({ row }) => (
          <span className="text-sm">{row.getValue("cliente_nombre")}</span>
        ),
      },
      {
        accessorKey: "fecha_emision",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Fecha" />
        ),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {new Date(row.getValue("fecha_emision") as string + "T00:00:00").toLocaleDateString("es-AR")}
          </span>
        ),
      },
      {
        accessorKey: "total",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Total" className="justify-end" />
        ),
        cell: ({ row }) => (
          <div className="text-right font-semibold">
            {formatCurrency(row.getValue("total") as number)}
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
              className={`border-0 text-xs font-medium ${ESTADO_COLORS[estado] || "bg-gray-100 text-gray-700"}`}
            >
              {ESTADO_COMPROBANTE_LABELS[estado] || estado}
            </Badge>
          );
        },
        filterFn: (row, id, value) => {
          return value === undefined || row.getValue(id) === value;
        },
      },
      {
        accessorKey: "afip_estado",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="AFIP" />
        ),
        cell: ({ row }) => {
          const afip = row.getValue("afip_estado") as string | undefined;
          if (!afip || afip === "NO_APLICA") return <span className="text-xs text-muted-foreground/50">-</span>;
          return (
            <Badge
              variant="secondary"
              className={`border-0 text-xs font-medium ${AFIP_ESTADO_COLORS[afip] || ""}`}
            >
              {AFIP_ESTADO_LABELS[afip] || afip}
            </Badge>
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
          const factura = row.original;
          const actions: RowAction[] = [];

          if (factura.estado === "BORRADOR") {
            actions.push({
              label: "Emitir",
              icon: <Send className="h-4 w-4" />,
              onClick: () => emitMutation.mutate(factura.id),
            });
          }

          if (factura.estado === "EMITIDO") {
            actions.push({
              label: "Anular",
              icon: <Ban className="h-4 w-4" />,
              onClick: () => voidMutation.mutate(factura.id),
              variant: "destructive",
            });
          }

          if (factura.estado === "BORRADOR") {
            actions.push({
              label: "Eliminar",
              icon: <Trash2 className="h-4 w-4" />,
              onClick: () => deleteMutation.mutate(factura.id),
              variant: "destructive",
              separator: true,
            });
          }

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
    [emitMutation, voidMutation, deleteMutation],
  );

  return (
    <div ref={containerRef} className="space-y-5">
      {/* Header */}
      <div className="facturas-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Facturas
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestiona comprobantes de venta: facturas, notas de credito y debito
          </p>
        </div>
      </div>

      {/* Summary Bar */}
      {meta && (
        <div className="facturas-summary flex items-center gap-3 rounded-xl border border-border/50 bg-gradient-to-r from-[var(--accent)]/5 to-transparent px-5 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
            <FileText className="h-4 w-4" />
          </div>
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{meta.total}</span>
            {" comprobantes en total"}
          </span>
        </div>
      )}

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={facturas}
        page={page}
        pageSize={20}
        totalPages={meta?.totalPages || 1}
        totalItems={meta?.total}
        onPageChange={setPage}
        onRowClick={(row) => router.push(`/ventas/facturas/${row.original.id}`)}
        searchKey="numero"
        searchPlaceholder="Buscar por numero o cliente..."
        filterOptions={[
          {
            key: "estado",
            label: "Estado",
            options: Object.entries(ESTADO_COMPROBANTE_LABELS).map(([value, label]) => ({
              value,
              label,
            })),
          },
        ]}
        isLoading={isLoading}
        emptyIllustration={<EmptyFinance className="w-full h-full" />}
        emptyMessage="No se encontraron facturas"
        emptyDescription="Crea una factura desde un pedido o de forma manual."
        enableRowSelection
        bulkActions={
          <Button variant="ghost" size="sm" className="h-7 text-xs">
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Exportar
          </Button>
        }
      />
    </div>
  );
}

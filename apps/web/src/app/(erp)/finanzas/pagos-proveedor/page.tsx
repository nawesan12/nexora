"use client";

import { useState, useMemo, useRef, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { usePagosProveedor } from "@/hooks/queries/use-payments";
import type { PagoProveedor } from "@pronto/shared/types";
import type { ColumnDef } from "@tanstack/react-table";
import {
  DataTable,
  DataTableColumnHeader,
  DataTableRowActions,
  type RowAction,
} from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FileCheck, Eye } from "lucide-react";
import { EmptyGeneric } from "@/components/illustrations";
import gsap from "gsap";
import Link from "next/link";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n);
}

const ESTADO_COLORS: Record<string, string> = {
  PENDIENTE: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  CONFIRMADO: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  ANULADO: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
};

export default function PagosProveedorPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { data, isLoading } = usePagosProveedor({ page, pageSize: 20 });

  const pagos = data?.data || [];
  const meta = data?.meta;

  const containerRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".pp-header", { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" });
      gsap.fromTo(".pp-summary", { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.15 });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const columns = useMemo<ColumnDef<PagoProveedor, unknown>[]>(
    () => [
      {
        accessorKey: "numero",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Numero" />,
        cell: ({ row }) => <Badge variant="outline" className="font-mono text-xs">{row.getValue("numero")}</Badge>,
        enableHiding: false,
      },
      {
        accessorKey: "proveedor_nombre",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Proveedor" />,
        cell: ({ row }) => <span className="font-medium">{row.getValue("proveedor_nombre")}</span>,
      },
      {
        accessorKey: "tipo",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo" />,
        cell: ({ row }) => <Badge variant="secondary" className="border-0 text-xs">{row.getValue("tipo")}</Badge>,
      },
      {
        accessorKey: "monto",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Monto" />,
        cell: ({ row }) => <span className="font-semibold tabular-nums">{formatCurrency(row.getValue("monto") as number)}</span>,
      },
      {
        accessorKey: "fecha_pago",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" />,
        cell: ({ row }) => {
          const d = row.getValue("fecha_pago") as string;
          return <span className="text-sm text-muted-foreground">{d ? new Date(d + "T00:00:00").toLocaleDateString("es-AR") : "-"}</span>;
        },
      },
      {
        accessorKey: "estado",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
        cell: ({ row }) => {
          const e = row.getValue("estado") as string;
          return <Badge variant="secondary" className={`border-0 text-xs font-medium ${ESTADO_COLORS[e] || ""}`}>{e}</Badge>;
        },
      },
      {
        id: "actions",
        header: () => <span className="text-xs font-semibold uppercase tracking-wider">Acciones</span>,
        cell: ({ row }) => {
          const actions: RowAction[] = [
            { label: "Ver detalle", icon: <Eye className="h-4 w-4" />, onClick: () => router.push(`/finanzas/pagos-proveedor/${row.original.id}`) },
          ];
          return <div onClick={(ev) => ev.stopPropagation()}><DataTableRowActions actions={actions} /></div>;
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
      <div className="pp-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Pagos a Proveedores</h1>
          <p className="text-sm text-muted-foreground">Cuentas por pagar</p>
        </div>
        <Button className="shadow-sm" asChild>
          <Link href="/finanzas/pagos-proveedor/nuevo"><Plus className="mr-2 h-4 w-4" />Nuevo Pago</Link>
        </Button>
      </div>

      {meta && (
        <div className="pp-summary flex items-center gap-3 rounded-xl border border-border/50 bg-gradient-to-r from-[var(--accent)]/5 to-transparent px-5 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]"><FileCheck className="h-4 w-4" /></div>
          <span className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">{meta.total}</span> pagos registrados</span>
        </div>
      )}

      <DataTable
        columns={columns}
        data={pagos}
        page={page}
        pageSize={20}
        totalPages={meta?.totalPages || 1}
        totalItems={meta?.total}
        onPageChange={setPage}
        searchKey="numero"
        searchPlaceholder="Buscar por numero..."
        isLoading={isLoading}
        emptyIllustration={<EmptyGeneric className="w-full h-full" />}
        emptyMessage="No se encontraron pagos"
        emptyDescription="Registra un pago para comenzar."
        onRowClick={(row) => router.push(`/finanzas/pagos-proveedor/${row.original.id}`)}
      />
    </div>
  );
}

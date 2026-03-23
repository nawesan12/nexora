"use client";

import { useState, useMemo, useRef, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { usePagos, useAgingReport } from "@/hooks/queries/use-payments";
import type { Pago, AgingBucket } from "@pronto/shared/types";
import type { ColumnDef } from "@tanstack/react-table";
import {
  DataTable,
  DataTableColumnHeader,
  DataTableRowActions,
  type RowAction,
} from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, CreditCard, Eye, ChevronDown, ChevronUp } from "lucide-react";
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

const TIPO_COLORS: Record<string, string> = {
  EFECTIVO: "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400",
  TRANSFERENCIA: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
  CHEQUE: "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400",
  TARJETA: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-teal-400",
  OTRO: "bg-gray-100 text-gray-700 dark:bg-gray-950/50 dark:text-gray-400",
};

export default function CobrosPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { data, isLoading } = usePagos({ page, pageSize: 20 });
  const { data: agingData } = useAgingReport();
  const [showAging, setShowAging] = useState(false);

  const pagos = data?.data || [];
  const meta = data?.meta;
  const aging = (agingData as AgingBucket[] | undefined) || [];

  const containerRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".cobros-header", { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" });
      gsap.fromTo(".cobros-summary", { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.15 });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const columns = useMemo<ColumnDef<Pago, unknown>[]>(
    () => [
      {
        accessorKey: "numero",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Numero" />,
        cell: ({ row }) => <Badge variant="outline" className="font-mono text-xs">{row.getValue("numero")}</Badge>,
        enableHiding: false,
      },
      {
        accessorKey: "cliente_nombre",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Cliente" />,
        cell: ({ row }) => <span className="font-medium">{row.getValue("cliente_nombre")}</span>,
      },
      {
        accessorKey: "tipo",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo" />,
        cell: ({ row }) => {
          const t = row.getValue("tipo") as string;
          return <Badge variant="secondary" className={`border-0 text-xs font-medium ${TIPO_COLORS[t] || ""}`}>{t}</Badge>;
        },
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
            { label: "Ver detalle", icon: <Eye className="h-4 w-4" />, onClick: () => router.push(`/finanzas/cobros/${row.original.id}`) },
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
      <div className="cobros-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Cobros</h1>
          <p className="text-sm text-muted-foreground">Cuentas por cobrar — pagos de clientes</p>
        </div>
        <Button className="shadow-sm" asChild>
          <Link href="/finanzas/cobros/nuevo"><Plus className="mr-2 h-4 w-4" />Nuevo Cobro</Link>
        </Button>
      </div>

      {meta && (
        <div className="cobros-summary flex items-center gap-3 rounded-xl border border-border/50 bg-gradient-to-r from-[var(--accent)]/5 to-transparent px-5 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]"><CreditCard className="h-4 w-4" /></div>
          <span className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">{meta.total}</span> cobros registrados</span>
        </div>
      )}

      {/* Aging report collapsible */}
      {aging.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="cursor-pointer py-3" onClick={() => setShowAging(!showAging)}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Reporte de Antiguedad</CardTitle>
              {showAging ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </CardHeader>
          {showAging && (
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {aging.map((bucket) => (
                  <div key={bucket.rango} className="rounded-lg border p-3 text-center">
                    <p className="text-xs font-medium text-muted-foreground">{bucket.rango}</p>
                    <p className="text-lg font-bold">{formatCurrency(bucket.monto)}</p>
                    <p className="text-xs text-muted-foreground">{bucket.cantidad} docs.</p>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
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
        emptyMessage="No se encontraron cobros"
        emptyDescription="Registra un cobro para comenzar."
        onRowClick={(row) => router.push(`/finanzas/cobros/${row.original.id}`)}
      />
    </div>
  );
}

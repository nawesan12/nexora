"use client";

import { useState, useMemo, useRef, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { useMetasVenta, useDeleteMetaVenta } from "@/hooks/queries/use-metas-venta";
import type { MetaVenta } from "@pronto/shared/types";
import type { ColumnDef } from "@tanstack/react-table";
import {
  DataTable,
  DataTableColumnHeader,
  DataTableRowActions,
  type RowAction,
} from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Target, Trash2, Eye } from "lucide-react";
import { EmptyGeneric } from "@/components/illustrations";
import gsap from "gsap";
import Link from "next/link";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n);
}

function getProgressColor(progreso: number) {
  if (progreso >= 80) return "bg-emerald-500";
  if (progreso >= 50) return "bg-blue-500";
  return "bg-amber-500";
}

export default function MetasVentaPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMetasVenta({ page, pageSize: 20 });
  const deleteMutation = useDeleteMetaVenta();

  const metas = data?.data || [];
  const meta = data?.meta;
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const avgProgreso = metas.length > 0 ? Math.round(metas.reduce((acc, m) => acc + (m.progreso || 0), 0) / metas.length) : 0;

  const containerRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".metas-header", { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" });
      gsap.fromTo(".metas-summary", { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.15 });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const columns = useMemo<ColumnDef<MetaVenta, unknown>[]>(
    () => [
      {
        accessorKey: "nombre",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nombre" />,
        cell: ({ row }) => <span className="font-medium">{row.getValue("nombre")}</span>,
        enableHiding: false,
      },
      {
        accessorKey: "tipo",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo" />,
        cell: ({ row }) => {
          const tipo = row.getValue("tipo") as string;
          return <Badge variant="secondary" className={`border-0 text-xs font-medium ${tipo === "EMPLEADO" ? "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400" : "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400"}`}>{tipo}</Badge>;
        },
      },
      {
        id: "entidad",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Entidad" />,
        cell: ({ row }) => {
          const m = row.original;
          return <span className="text-sm text-muted-foreground">{m.empleado_nombre || m.sucursal_nombre || "-"}</span>;
        },
      },
      {
        accessorKey: "monto_objetivo",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Objetivo" />,
        cell: ({ row }) => <span className="font-semibold tabular-nums">{formatCurrency(row.getValue("monto_objetivo") as number)}</span>,
      },
      {
        accessorKey: "progreso",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Progreso" />,
        cell: ({ row }) => {
          const p = row.getValue("progreso") as number;
          return (
            <div className="flex items-center gap-2 min-w-[120px]">
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full transition-all ${getProgressColor(p)}`} style={{ width: `${Math.min(p, 100)}%` }} />
              </div>
              <span className="text-xs font-medium tabular-nums w-10 text-right">{p}%</span>
            </div>
          );
        },
      },
      {
        id: "periodo",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Periodo" />,
        cell: ({ row }) => {
          const m = row.original;
          const desde = m.fecha_inicio ? new Date(m.fecha_inicio + "T00:00:00").toLocaleDateString("es-AR") : "";
          const hasta = m.fecha_fin ? new Date(m.fecha_fin + "T00:00:00").toLocaleDateString("es-AR") : "";
          return <span className="text-xs text-muted-foreground">{desde} - {hasta}</span>;
        },
      },
      {
        id: "actions",
        header: () => <span className="text-xs font-semibold uppercase tracking-wider">Acciones</span>,
        cell: ({ row }) => {
          const m = row.original;
          const actions: RowAction[] = [
            { label: "Ver detalle", icon: <Eye className="h-4 w-4" />, onClick: () => router.push(`/administracion/metas-venta/${m.id}`) },
            { label: "Eliminar", icon: <Trash2 className="h-4 w-4" />, onClick: () => setDeleteId(m.id), variant: "destructive", separator: true },
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
      <div className="metas-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Metas de Venta</h1>
          <p className="text-sm text-muted-foreground">Objetivos comerciales por empleado o sucursal</p>
        </div>
        <Button className="shadow-sm" asChild>
          <Link href="/administracion/metas-venta/nueva"><Plus className="mr-2 h-4 w-4" />Nueva Meta</Link>
        </Button>
      </div>

      {meta && (
        <div className="metas-summary flex items-center gap-3 rounded-xl border border-border/50 bg-gradient-to-r from-[var(--accent)]/5 to-transparent px-5 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]"><Target className="h-4 w-4" /></div>
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{meta.total}</span> metas — progreso promedio <span className="font-semibold text-foreground">{avgProgreso}%</span>
          </span>
        </div>
      )}

      <DataTable
        columns={columns}
        data={metas}
        page={page}
        pageSize={20}
        totalPages={meta?.totalPages || 1}
        totalItems={meta?.total}
        onPageChange={setPage}
        searchKey="nombre"
        searchPlaceholder="Buscar por nombre..."
        isLoading={isLoading}
        emptyIllustration={<EmptyGeneric className="w-full h-full" />}
        emptyMessage="No se encontraron metas"
        emptyDescription="Crea una meta de venta para comenzar."
        onRowClick={(row) => router.push(`/administracion/metas-venta/${row.original.id}`)}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Eliminar meta de venta</AlertDialogTitle><AlertDialogDescription>Esta accion no se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) { deleteMutation.mutate(deleteId); setDeleteId(null); } }}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

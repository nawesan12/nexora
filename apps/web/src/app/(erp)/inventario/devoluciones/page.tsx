"use client";

import { useState, useMemo, useRef, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useDevoluciones,
  useApproveDevolucion,
  useRejectDevolucion,
  useDeleteDevolucion,
} from "@/hooks/queries/use-devoluciones";
import type { DevolucionList } from "@pronto/shared/types";
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
import { Plus, PackageMinus, Trash2, Eye, Check, X } from "lucide-react";
import { EmptyGeneric } from "@/components/illustrations";
import gsap from "gsap";
import Link from "next/link";

const estadoBadge: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
  PENDIENTE: { variant: "outline", className: "border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400" },
  APROBADA: { variant: "outline", className: "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400" },
  RECHAZADA: { variant: "outline", className: "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400" },
  PROCESADA: { variant: "outline", className: "border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-400" },
};

export default function DevolucionesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useDevoluciones({ page, pageSize: 20 });
  const approveMutation = useApproveDevolucion();
  const rejectMutation = useRejectDevolucion();
  const deleteMutation = useDeleteDevolucion();

  const devoluciones = data?.data || [];
  const meta = data?.meta;
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".dev-header", { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" });
      gsap.fromTo(".dev-summary", { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.15 });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const columns = useMemo<ColumnDef<DevolucionList, unknown>[]>(
    () => [
      {
        accessorKey: "numero",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Numero" />,
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold">{row.getValue("numero")}</span>
        ),
        enableHiding: false,
      },
      {
        accessorKey: "cliente_nombre",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Cliente" />,
        cell: ({ row }) => <span className="font-medium">{row.getValue("cliente_nombre")}</span>,
      },
      {
        accessorKey: "motivo",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Motivo" />,
        cell: ({ row }) => {
          const motivo = row.getValue("motivo") as string;
          return <span className="text-sm text-muted-foreground truncate max-w-[200px] block">{motivo}</span>;
        },
      },
      {
        accessorKey: "estado",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
        cell: ({ row }) => {
          const estado = row.getValue("estado") as string;
          const badge = estadoBadge[estado] || estadoBadge.PENDIENTE;
          return (
            <Badge variant={badge.variant} className={badge.className}>
              {estado}
            </Badge>
          );
        },
      },
      {
        accessorKey: "fecha",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" />,
        cell: ({ row }) => {
          const d = row.getValue("fecha") as string;
          return (
            <span className="text-sm text-muted-foreground">
              {d ? new Date(d + "T00:00:00").toLocaleDateString("es-AR") : "-"}
            </span>
          );
        },
      },
      {
        accessorKey: "sucursal_nombre",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Sucursal" />,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.getValue("sucursal_nombre")}</span>
        ),
      },
      {
        id: "actions",
        header: () => <span className="text-xs font-semibold uppercase tracking-wider">Acciones</span>,
        cell: ({ row }) => {
          const d = row.original;
          const actions: RowAction[] = [
            {
              label: "Ver detalle",
              icon: <Eye className="h-4 w-4" />,
              onClick: () => router.push(`/inventario/devoluciones/${d.id}`),
            },
          ];
          if (d.estado === "PENDIENTE") {
            actions.push(
              {
                label: "Aprobar",
                icon: <Check className="h-4 w-4" />,
                onClick: () => approveMutation.mutate(d.id),
                separator: true,
              },
              {
                label: "Rechazar",
                icon: <X className="h-4 w-4" />,
                onClick: () => rejectMutation.mutate(d.id),
              },
            );
          }
          actions.push({
            label: "Eliminar",
            icon: <Trash2 className="h-4 w-4" />,
            onClick: () => setDeleteId(d.id),
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
    [router, approveMutation, rejectMutation],
  );

  return (
    <div ref={containerRef} className="space-y-5">
      <div className="dev-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Devoluciones</h1>
          <p className="text-sm text-muted-foreground">Gestion de devoluciones de productos</p>
        </div>
        <Button className="shadow-sm" asChild>
          <Link href="/inventario/devoluciones/nueva">
            <Plus className="mr-2 h-4 w-4" />Nueva Devolucion
          </Link>
        </Button>
      </div>

      {meta && (
        <div className="dev-summary flex items-center gap-3 rounded-xl border border-border/50 bg-gradient-to-r from-[var(--accent)]/5 to-transparent px-5 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
            <PackageMinus className="h-4 w-4" />
          </div>
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{meta.total}</span> devoluciones en total
          </span>
        </div>
      )}

      <DataTable
        columns={columns}
        data={devoluciones}
        page={page}
        pageSize={20}
        totalPages={meta?.totalPages || 1}
        totalItems={meta?.total}
        onPageChange={setPage}
        searchKey="numero"
        searchPlaceholder="Buscar por numero..."
        isLoading={isLoading}
        emptyIllustration={<EmptyGeneric className="w-full h-full" />}
        emptyMessage="No se encontraron devoluciones"
        emptyDescription="Crea una devolucion para comenzar."
        onRowClick={(row) => router.push(`/inventario/devoluciones/${row.original.id}`)}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar devolucion</AlertDialogTitle>
            <AlertDialogDescription>Esta accion no se puede deshacer.</AlertDialogDescription>
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

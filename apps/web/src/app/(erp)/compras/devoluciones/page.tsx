"use client";

import { useState, useMemo, useRef, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useDevolucionesProveedor,
  useDeleteDevolucionProveedor,
} from "@/hooks/queries/use-devoluciones-proveedor";
import type { DevolucionProveedorList } from "@pronto/shared/types";
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
import { Plus, PackageMinus, Trash2, Eye } from "lucide-react";
import { EmptyGeneric } from "@/components/illustrations";
import gsap from "gsap";
import Link from "next/link";

const ESTADO_COLORS: Record<string, string> = {
  PENDIENTE:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  APROBADA:
    "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
  ENVIADA:
    "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400",
  COMPLETADA:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  RECHAZADA:
    "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
};

export default function DevolucionesProveedorPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useDevolucionesProveedor({
    page,
    pageSize: 20,
  });
  const deleteMutation = useDeleteDevolucionProveedor();

  const devoluciones = data?.data || [];
  const meta = data?.meta;
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".dp-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      );
      gsap.fromTo(
        ".dp-summary",
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.15 },
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const columns = useMemo<ColumnDef<DevolucionProveedorList, unknown>[]>(
    () => [
      {
        accessorKey: "numero",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Numero" />
        ),
        cell: ({ row }) => (
          <Badge variant="outline" className="font-mono text-xs">
            {row.getValue("numero")}
          </Badge>
        ),
        enableHiding: false,
      },
      {
        accessorKey: "proveedor_nombre",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Proveedor" />
        ),
        cell: ({ row }) => (
          <span className="font-medium">
            {row.getValue("proveedor_nombre")}
          </span>
        ),
      },
      {
        accessorKey: "motivo",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Motivo" />
        ),
        cell: ({ row }) => {
          const motivo = row.getValue("motivo") as string;
          return (
            <span
              className="text-sm text-muted-foreground max-w-[200px] truncate block"
              title={motivo}
            >
              {motivo}
            </span>
          );
        },
      },
      {
        accessorKey: "fecha",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Fecha" />
        ),
        cell: ({ row }) => {
          const d = row.getValue("fecha") as string;
          return (
            <span className="text-sm text-muted-foreground">
              {d
                ? new Date(d + "T00:00:00").toLocaleDateString("es-AR")
                : "-"}
            </span>
          );
        },
      },
      {
        accessorKey: "estado",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Estado" />
        ),
        cell: ({ row }) => {
          const est = row.getValue("estado") as string;
          return (
            <Badge
              variant="secondary"
              className={`border-0 text-xs font-medium ${ESTADO_COLORS[est] || ""}`}
            >
              {est}
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
          const r = row.original;
          const actions: RowAction[] = [
            {
              label: "Ver detalle",
              icon: <Eye className="h-4 w-4" />,
              onClick: () => router.push(`/compras/devoluciones/${r.id}`),
            },
          ];
          if (r.estado === "PENDIENTE") {
            actions.push({
              label: "Eliminar",
              icon: <Trash2 className="h-4 w-4" />,
              onClick: () => setDeleteId(r.id),
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
    [],
  );

  return (
    <div ref={containerRef} className="space-y-5">
      <div className="dp-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Devoluciones a Proveedor
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestionar devoluciones de mercaderia a proveedores
          </p>
        </div>
        <Button className="shadow-sm" asChild>
          <Link href="/compras/devoluciones/nueva">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Devolucion
          </Link>
        </Button>
      </div>

      {meta && (
        <div className="dp-summary flex items-center gap-3 rounded-xl border border-border/50 bg-gradient-to-r from-[var(--accent)]/5 to-transparent px-5 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
            <PackageMinus className="h-4 w-4" />
          </div>
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{meta.total}</span>{" "}
            devoluciones en total
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
        emptyDescription="Crea una devolucion a proveedor para comenzar."
        onRowClick={(row) =>
          router.push(`/compras/devoluciones/${row.original.id}`)
        }
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar devolucion</AlertDialogTitle>
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

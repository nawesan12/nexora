"use client";

import { useState, useMemo, useRef, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { usePlantillas, useDeletePlantilla } from "@/hooks/queries/use-plantillas";
import type { PlantillaPedidoList } from "@pronto/shared/types";
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
import { Plus, ClipboardList, Trash2, Eye } from "lucide-react";
import { EmptyGeneric } from "@/components/illustrations";
import gsap from "gsap";
import Link from "next/link";

export default function PlantillasPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { data, isLoading } = usePlantillas({ page, pageSize: 20 });
  const deleteMutation = useDeletePlantilla();

  const plantillas = data?.data || [];
  const meta = data?.meta;
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".plant-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      );
      gsap.fromTo(
        ".plant-summary",
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.15 },
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const columns = useMemo<ColumnDef<PlantillaPedidoList, unknown>[]>(
    () => [
      {
        accessorKey: "nombre",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Nombre" />
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue("nombre")}</span>
        ),
        enableHiding: false,
      },
      {
        accessorKey: "cliente_nombre",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Cliente" />
        ),
        cell: ({ row }) => (
          <span className="text-sm">
            {row.getValue("cliente_nombre") || "-"}
          </span>
        ),
      },
      {
        accessorKey: "sucursal_nombre",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Sucursal" />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.getValue("sucursal_nombre") || "-"}
          </span>
        ),
      },
      {
        accessorKey: "frecuencia_dias",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Frecuencia" />
        ),
        cell: ({ row }) => {
          const d = row.getValue("frecuencia_dias") as number;
          return (
            <span className="text-sm tabular-nums">
              {d} {d === 1 ? "dia" : "dias"}
            </span>
          );
        },
      },
      {
        accessorKey: "proximo_generacion",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Proxima Generacion" />
        ),
        cell: ({ row }) => {
          const d = row.getValue("proximo_generacion") as string;
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
        accessorKey: "activa",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Estado" />
        ),
        cell: ({ row }) => {
          const activa = row.getValue("activa") as boolean;
          return (
            <Badge
              variant="secondary"
              className={`border-0 text-xs font-medium ${
                activa
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400"
              }`}
            >
              {activa ? "Activa" : "Inactiva"}
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
          const p = row.original;
          const actions: RowAction[] = [
            {
              label: "Ver detalle",
              icon: <Eye className="h-4 w-4" />,
              onClick: () => router.push(`/ventas/plantillas/${p.id}`),
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
    [],
  );

  return (
    <div ref={containerRef} className="space-y-5">
      <div className="plant-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Plantillas de Pedido
          </h1>
          <p className="text-sm text-muted-foreground">
            Plantillas recurrentes para generar pedidos automaticamente
          </p>
        </div>
        <Button className="shadow-sm" asChild>
          <Link href="/ventas/plantillas/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Plantilla
          </Link>
        </Button>
      </div>

      {meta && (
        <div className="plant-summary flex items-center gap-3 rounded-xl border border-border/50 bg-gradient-to-r from-[var(--accent)]/5 to-transparent px-5 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
            <ClipboardList className="h-4 w-4" />
          </div>
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{meta.total}</span>{" "}
            plantillas en total
          </span>
        </div>
      )}

      <DataTable
        columns={columns}
        data={plantillas}
        page={page}
        pageSize={20}
        totalPages={meta?.totalPages || 1}
        totalItems={meta?.total}
        onPageChange={setPage}
        searchKey="nombre"
        searchPlaceholder="Buscar por nombre..."
        isLoading={isLoading}
        emptyIllustration={<EmptyGeneric className="w-full h-full" />}
        emptyMessage="No se encontraron plantillas"
        emptyDescription="Crea una plantilla de pedido recurrente para comenzar."
        onRowClick={(row) =>
          router.push(`/ventas/plantillas/${row.original.id}`)
        }
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar plantilla</AlertDialogTitle>
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

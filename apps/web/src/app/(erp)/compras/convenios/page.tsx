"use client";

import { useState, useMemo, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useConvenios, useDeleteConvenio } from "@/hooks/queries/use-convenios";
import type { ConvenioProveedor } from "@pronto/shared/types";
import type { ColumnDef } from "@tanstack/react-table";
import {
  DataTable,
  DataTableColumnHeader,
  DataTableRowActions,
  type RowAction,
} from "@/components/data-table";
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
import { Plus, Eye, Trash2, FileText } from "lucide-react";
import { EmptyGeneric } from "@/components/illustrations";
import gsap from "gsap";

export default function ConveniosPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useConvenios({ page, pageSize: 20 });
  const convenios = data?.data || [];
  const meta = data?.meta;
  const deleteMutation = useDeleteConvenio();

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".conv-header", { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" });
      gsap.fromTo(".conv-content", { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.15 });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const getRowActions = (row: ConvenioProveedor): RowAction[] => [
    { label: "Ver detalle", icon: <Eye className="h-4 w-4" />, onClick: () => router.push(`/compras/convenios/${row.id}`) },
    { label: "Eliminar", icon: <Trash2 className="h-4 w-4" />, variant: "destructive", onClick: () => setDeleteTarget(row.id) },
  ];

  const columns: ColumnDef<ConvenioProveedor>[] = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(v) => row.toggleSelected(!!v)}
          />
        ),
        enableSorting: false,
        size: 40,
      },
      {
        accessorKey: "nombre",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nombre" />,
        cell: ({ row }) => (
          <Link href={`/compras/convenios/${row.original.id}`} className="font-medium text-foreground hover:underline">
            {row.original.nombre}
          </Link>
        ),
      },
      {
        accessorKey: "proveedor_nombre",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Proveedor" />,
      },
      {
        accessorKey: "fecha_inicio",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Inicio" />,
        cell: ({ row }) => row.original.fecha_inicio ? new Date(row.original.fecha_inicio + "T00:00:00").toLocaleDateString("es-AR") : "-",
      },
      {
        accessorKey: "fecha_fin",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Fin" />,
        cell: ({ row }) => row.original.fecha_fin ? new Date(row.original.fecha_fin + "T00:00:00").toLocaleDateString("es-AR") : "Indefinido",
      },
      {
        accessorKey: "activo",
        header: "Estado",
        cell: ({ row }) => (
          <Badge variant={row.original.activo ? "default" : "secondary"}>
            {row.original.activo ? "Activo" : "Inactivo"}
          </Badge>
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => <DataTableRowActions actions={getRowActions(row.original)} />,
        size: 60,
      },
    ],
    [router],
  );

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="conv-header flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
            <FileText className="h-5 w-5 text-[var(--accent)]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Convenios</h1>
            <p className="text-sm text-muted-foreground">Acuerdos de precios con proveedores</p>
          </div>
        </div>
        <Button asChild>
          <Link href="/compras/convenios/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Convenio
          </Link>
        </Button>
      </div>

      <div className="conv-content">
        {!isLoading && convenios.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <EmptyGeneric className="h-40 w-40 opacity-60" />
            <p className="text-muted-foreground">No hay convenios registrados</p>
            <Button asChild>
              <Link href="/compras/convenios/nuevo">
                <Plus className="mr-2 h-4 w-4" />
                Crear primer convenio
              </Link>
            </Button>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={convenios}
            isLoading={isLoading}
            page={page}
            totalPages={meta?.totalPages}
            totalItems={meta?.total}
            onPageChange={setPage}
          />
        )}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar convenio</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. El convenio sera eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) {
                  deleteMutation.mutate(deleteTarget);
                  setDeleteTarget(null);
                }
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

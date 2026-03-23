"use client";

import { useState, useMemo, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useTransferencias,
  useDeleteTransferencia,
} from "@/hooks/queries/use-transfers";
import { useUserStore } from "@/store/user-store";
import { hasPermission } from "@/lib/permissions";
import type { TransferenciaList } from "@pronto/shared/types";
import type { ColumnDef } from "@tanstack/react-table";
import {
  DataTable,
  DataTableColumnHeader,
  DataTableRowActions,
  type RowAction,
} from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  ArrowLeftRight,
  Download,
} from "lucide-react";
import { EmptyTransfers } from "@/components/illustrations";
import gsap from "gsap";

const TRANSFER_STATUS_LABELS: Record<string, string> = {
  PENDIENTE: "Pendiente",
  APROBADA: "Aprobada",
  EN_TRANSITO: "En Transito",
  COMPLETADA: "Completada",
  CANCELADA: "Cancelada",
};

const TRANSFER_STATUS_COLORS: Record<string, string> = {
  PENDIENTE:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  APROBADA:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  EN_TRANSITO:
    "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
  COMPLETADA:
    "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400",
  CANCELADA:
    "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
};

export default function TransferenciasPage() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const permissions = user?.permissions ?? [];
  const canCreate = hasPermission(permissions, "stock:adjust");
  const canManage = hasPermission(permissions, "stock:adjust");

  const [page, setPage] = useState(1);
  const [estado, setEstado] = useState<string>("");

  const { data, isLoading } = useTransferencias({
    page,
    pageSize: 20,
    estado: estado || undefined,
  });
  const deleteMutation = useDeleteTransferencia();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const transferencias = data?.data || [];
  const meta = data?.meta;
  const totalCount = meta?.total || 0;

  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".transferencias-header",
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
      );
      gsap.fromTo(
        ".transferencias-summary",
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, delay: 0.1, ease: "power3.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const columns = useMemo<ColumnDef<TransferenciaList, unknown>[]>(
    () => [
      {
        accessorKey: "numero",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Numero" />
        ),
        cell: ({ row }) => {
          const numero = row.getValue("numero") as string;
          return (
            <Badge
              variant="outline"
              className="font-mono text-xs border-primary/30 text-primary"
            >
              {numero}
            </Badge>
          );
        },
        enableHiding: false,
      },
      {
        accessorKey: "sucursal_origen_nombre",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Origen" />
        ),
        cell: ({ row }) => (
          <span className="text-sm font-medium">
            {row.getValue("sucursal_origen_nombre")}
          </span>
        ),
      },
      {
        accessorKey: "sucursal_destino_nombre",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Destino" />
        ),
        cell: ({ row }) => (
          <span className="text-sm font-medium">
            {row.getValue("sucursal_destino_nombre")}
          </span>
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
              className={`border-0 text-xs font-medium ${TRANSFER_STATUS_COLORS[estado] || ""}`}
            >
              {TRANSFER_STATUS_LABELS[estado] || estado}
            </Badge>
          );
        },
        filterFn: (row, id, value) => {
          return value === undefined || row.getValue(id) === value;
        },
      },
      {
        accessorKey: "items_count",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="Items"
            className="justify-end"
          />
        ),
        cell: ({ row }) => {
          const count = row.getValue("items_count") as number;
          return (
            <div className="text-right tabular-nums text-sm text-muted-foreground">
              {count} {count === 1 ? "producto" : "productos"}
            </div>
          );
        },
      },
      {
        accessorKey: "fecha_solicitud",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Fecha" />
        ),
        cell: ({ row }) => {
          const fecha = row.getValue("fecha_solicitud") as string;
          return (
            <span className="text-xs text-muted-foreground">
              {new Date(fecha).toLocaleDateString("es-AR", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
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
          const t = row.original;
          const actions: RowAction[] = [
            {
              label: "Ver detalle",
              icon: <Eye className="h-4 w-4" />,
              onClick: () =>
                router.push(`/inventario/transferencias/${t.id}`),
            },
          ];
          if (canManage && t.estado === "PENDIENTE") {
            actions.push({
              label: "Eliminar",
              icon: <Trash2 className="h-4 w-4" />,
              onClick: () => setDeleteId(t.id),
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
    [canManage, router]
  );

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="transferencias-header flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Transferencias entre Sucursales
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona el movimiento de productos entre sucursales
          </p>
        </div>
        {canCreate && (
          <Button asChild size="lg" className="shadow-sm">
            <Link href="/inventario/transferencias/nueva">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Transferencia
            </Link>
          </Button>
        )}
      </div>

      {/* Summary bar */}
      <Card className="transferencias-summary border-0 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary to-amber-500" />
        <CardContent className="py-4">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <ArrowLeftRight className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalCount}</p>
                <p className="text-xs text-muted-foreground">
                  Total transferencias
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={transferencias}
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
            options: Object.entries(TRANSFER_STATUS_LABELS).map(
              ([value, label]) => ({
                value,
                label,
              })
            ),
          },
        ]}
        isLoading={isLoading}
        emptyIllustration={<EmptyTransfers className="w-full h-full" />}
        emptyMessage="No se encontraron transferencias"
        emptyDescription="Crea una nueva transferencia para mover productos entre sucursales."
        emptyAction={{
          label: "Nueva Transferencia",
          href: "/inventario/transferencias/nueva",
        }}
        onRowClick={(row) =>
          router.push(`/inventario/transferencias/${row.original.id}`)
        }
        toolbarActions={
          canCreate ? (
            <Button asChild size="sm" className="h-9">
              <Link href="/inventario/transferencias/nueva">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Nueva Transferencia
              </Link>
            </Button>
          ) : undefined
        }
        bulkActions={
          <Button variant="ghost" size="sm" className="h-7 text-xs">
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Exportar
          </Button>
        }
      />

      {/* Delete dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar transferencia</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. La transferencia sera
              desactivada.
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

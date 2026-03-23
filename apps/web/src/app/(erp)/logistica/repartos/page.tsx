"use client";

import { useState, useMemo, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRepartos, useDeleteReparto } from "@/hooks/queries/use-logistics";
import { useUserStore } from "@/store/user-store";
import { hasPermission } from "@/lib/permissions";
import type { RepartoList } from "@pronto/shared/types";
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
  Truck,
  Download,
} from "lucide-react";
import { EmptyGeneric } from "@/components/illustrations";
import gsap from "gsap";

const ESTADO_REPARTO_LABELS: Record<string, string> = {
  PLANIFICADO: "Planificado",
  EN_CURSO: "En Curso",
  FINALIZADO: "Finalizado",
  CANCELADO: "Cancelado",
};

const ESTADO_REPARTO_COLORS: Record<string, string> = {
  PLANIFICADO:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  EN_CURSO:
    "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
  FINALIZADO:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  CANCELADO:
    "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
};

export default function RepartosPage() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const permissions = user?.permissions ?? [];
  const canManage = hasPermission(permissions, "delivery:manage");

  const [page, setPage] = useState(1);
  const [estado, setEstado] = useState<string>("");

  const { data, isLoading } = useRepartos({
    page,
    pageSize: 20,
    estado: estado || undefined,
  });
  const deleteMutation = useDeleteReparto();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const repartos = data?.data || [];
  const meta = data?.meta;

  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".repartos-header",
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
      );
      gsap.fromTo(
        ".repartos-summary-bar",
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, delay: 0.1, ease: "power3.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const totalCount = meta?.total || 0;

  const columns = useMemo<ColumnDef<RepartoList, unknown>[]>(
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
        accessorKey: "fecha",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Fecha" />
        ),
        cell: ({ row }) => {
          const fecha = row.getValue("fecha") as string;
          return (
            <span className="text-sm text-muted-foreground">
              {new Date(fecha + "T00:00:00").toLocaleDateString("es-AR", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
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
              className={`border-0 text-xs font-medium ${ESTADO_REPARTO_COLORS[est] || ""}`}
            >
              {ESTADO_REPARTO_LABELS[est] || est}
            </Badge>
          );
        },
        filterFn: (row, id, value) => {
          return value === undefined || row.getValue(id) === value;
        },
      },
      {
        accessorKey: "empleado_nombre",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Repartidor" />
        ),
        cell: ({ row }) => (
          <span className="text-sm font-medium text-foreground truncate">
            {row.getValue("empleado_nombre") as string}
          </span>
        ),
      },
      {
        accessorKey: "vehiculo_patente",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Vehiculo" />
        ),
        cell: ({ row }) => {
          const patente = row.getValue("vehiculo_patente") as string;
          return patente ? (
            <Badge variant="outline" className="font-mono text-xs">
              {patente}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground/50">-</span>
          );
        },
      },
      {
        accessorKey: "zona_nombre",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Zona" />
        ),
        cell: ({ row }) => {
          const zona = row.getValue("zona_nombre") as string;
          return zona ? (
            <span className="text-sm text-muted-foreground">{zona}</span>
          ) : (
            <span className="text-xs text-muted-foreground/50">-</span>
          );
        },
      },
      {
        accessorKey: "pedidos_count",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="#Pedidos"
            className="justify-center"
          />
        ),
        cell: ({ row }) => {
          const count = row.getValue("pedidos_count") as number;
          return (
            <div className="text-center">
              <Badge variant="secondary" className="border-0 text-xs font-medium">
                {count}
              </Badge>
            </div>
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
              onClick: () => router.push(`/logistica/repartos/${r.id}`),
            },
          ];
          if (canManage && r.estado === "PLANIFICADO") {
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
    [canManage, router],
  );

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="repartos-header flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Repartos</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona los repartos y entregas
          </p>
        </div>
        {canManage && (
          <Button asChild size="lg" className="shadow-sm">
            <Link href="/logistica/repartos/nuevo">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Reparto
            </Link>
          </Button>
        )}
      </div>

      {/* Summary bar */}
      <Card className="repartos-summary-bar border-0 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary to-amber-500" />
        <CardContent className="py-4">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalCount}</p>
                <p className="text-xs text-muted-foreground">Total repartos</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={repartos}
        page={page}
        pageSize={20}
        totalPages={meta?.totalPages || 1}
        totalItems={meta?.total}
        onPageChange={setPage}
        searchKey="empleado_nombre"
        searchPlaceholder="Buscar por repartidor..."
        filterOptions={[
          {
            key: "estado",
            label: "Estado",
            options: Object.entries(ESTADO_REPARTO_LABELS).map(
              ([value, label]) => ({
                value,
                label,
              }),
            ),
          },
        ]}
        isLoading={isLoading}
        emptyIllustration={<EmptyGeneric className="w-full h-full" />}
        emptyMessage="No se encontraron repartos"
        emptyDescription="Crea un nuevo reparto para comenzar a distribuir pedidos."
        emptyAction={{ label: "Nuevo Reparto", href: "/logistica/repartos/nuevo" }}
        enableRowSelection
        onRowClick={(row) =>
          router.push(`/logistica/repartos/${row.original.id}`)
        }
        bulkActions={
          <Button variant="ghost" size="sm" className="h-7 text-xs">
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Exportar
          </Button>
        }
        toolbarActions={
          canManage ? (
            <Button asChild size="sm" className="h-9">
              <Link href="/logistica/repartos/nuevo">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Nuevo
              </Link>
            </Button>
          ) : undefined
        }
      />

      {/* Delete dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar reparto</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. El reparto sera eliminado.
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

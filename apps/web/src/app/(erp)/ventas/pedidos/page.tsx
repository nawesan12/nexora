"use client";

import { useState, useMemo, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePedidos, useDeletePedido } from "@/hooks/queries/use-orders";
import { useUserStore } from "@/store/user-store";
import { hasPermission } from "@/lib/permissions";
import { ORDER_STATUS_LABELS } from "@nexora/shared/constants";
import type { PedidoList } from "@nexora/shared/types";
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
  Pencil,
  Trash2,
  ShoppingCart,
  Download,
} from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { EmptyOrders } from "@/components/illustrations";
import gsap from "gsap";

const STATUS_COLORS: Record<string, string> = {
  PENDIENTE_APROBACION:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  APROBADO:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  EN_PREPARACION:
    "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
  PREPARADO:
    "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-400",
  EN_REPARTO:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400",
  ENTREGADO:
    "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400",
  CANCELADO:
    "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
  RECHAZADO:
    "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400",
  NO_ENTREGADO:
    "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400",
};

const condicionPagoLabels: Record<string, string> = {
  CONTADO: "Contado",
  CUENTA_CORRIENTE: "Cta. Cte.",
  CHEQUE: "Cheque",
  TRANSFERENCIA: "Transferencia",
  OTRO: "Otro",
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(n);
}

export default function PedidosPage() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const permissions = user?.permissions ?? [];
  const canCreate = hasPermission(permissions, "orders:create");
  const canManage = hasPermission(permissions, "orders:approve");

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 300);
  const [estado, setEstado] = useState<string>("");

  const { data, isLoading } = usePedidos({
    page,
    pageSize: 20,
    search,
    estado: estado || undefined,
  });
  const deleteMutation = useDeletePedido();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const pedidos = data?.data || [];
  const meta = data?.meta;

  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".pedidos-header",
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
      );
      gsap.fromTo(
        ".pedidos-summary-bar",
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, delay: 0.1, ease: "power3.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const totalCount = meta?.total || 0;

  const columns = useMemo<ColumnDef<PedidoList, unknown>[]>(
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
        accessorKey: "cliente_nombre",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Cliente" />
        ),
        cell: ({ row }) => {
          const nombre = row.getValue("cliente_nombre") as string;
          return (
            <span className="text-sm font-medium text-foreground truncate">
              {nombre}
            </span>
          );
        },
        enableHiding: false,
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
              className={`border-0 text-xs font-medium ${STATUS_COLORS[estado] || ""}`}
            >
              {ORDER_STATUS_LABELS[estado as keyof typeof ORDER_STATUS_LABELS] ||
                estado}
            </Badge>
          );
        },
        filterFn: (row, id, value) => {
          return value === undefined || row.getValue(id) === value;
        },
      },
      {
        accessorKey: "condicion_pago",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Cond. Pago" />
        ),
        cell: ({ row }) => {
          const condicion = row.getValue("condicion_pago") as string;
          return (
            <span className="text-sm text-muted-foreground">
              {condicionPagoLabels[condicion] || condicion}
            </span>
          );
        },
      },
      {
        accessorKey: "total",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="Total"
            className="justify-end"
          />
        ),
        cell: ({ row }) => {
          const total = row.getValue("total") as number;
          return (
            <div className="text-right font-bold tabular-nums">
              {formatCurrency(total)}
            </div>
          );
        },
      },
      {
        accessorKey: "fecha_pedido",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Fecha" />
        ),
        cell: ({ row }) => {
          const fecha = row.getValue("fecha_pedido") as string;
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
          const p = row.original;
          const actions: RowAction[] = [
            {
              label: "Ver detalle",
              icon: <Eye className="h-4 w-4" />,
              onClick: () => router.push(`/ventas/pedidos/${p.id}`),
            },
          ];
          if (canManage) {
            actions.push({
              label: "Editar",
              icon: <Pencil className="h-4 w-4" />,
              onClick: () =>
                router.push(`/ventas/pedidos/${p.id}?edit=true`),
            });
            actions.push({
              label: "Eliminar",
              icon: <Trash2 className="h-4 w-4" />,
              onClick: () => setDeleteId(p.id),
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
      <div className="pedidos-header flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona los pedidos de venta
          </p>
        </div>
        {canCreate && (
          <Button asChild size="lg" className="shadow-sm">
            <Link href="/ventas/pedidos/nuevo">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Pedido
            </Link>
          </Button>
        )}
      </div>

      {/* Summary bar */}
      <Card className="pedidos-summary-bar border-0 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary to-violet-500" />
        <CardContent className="py-4">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalCount}</p>
                <p className="text-xs text-muted-foreground">Total pedidos</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={pedidos}
        page={page}
        pageSize={20}
        totalPages={meta?.totalPages || 1}
        totalItems={meta?.total}
        onPageChange={setPage}
        searchKey="cliente_nombre"
        searchPlaceholder="Buscar por numero o cliente..."
        filterOptions={[
          {
            key: "estado",
            label: "Estado",
            options: Object.entries(ORDER_STATUS_LABELS).map(
              ([value, label]) => ({
                value,
                label,
              }),
            ),
          },
        ]}
        isLoading={isLoading}
        emptyIllustration={<EmptyOrders className="w-full h-full" />}
        emptyMessage="No se encontraron pedidos"
        emptyDescription="Intenta ajustar los filtros o crea un nuevo pedido."
        emptyAction={{ label: "Nuevo Pedido", href: "/ventas/pedidos/nuevo" }}
        enableRowSelection
        onRowClick={(row) =>
          router.push(`/ventas/pedidos/${row.original.id}`)
        }
        bulkActions={
          <Button variant="ghost" size="sm" className="h-7 text-xs">
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Exportar
          </Button>
        }
        toolbarActions={
          canCreate ? (
            <Button asChild size="sm" className="h-9">
              <Link href="/ventas/pedidos/nuevo">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Nuevo Pedido
              </Link>
            </Button>
          ) : undefined
        }
      />

      {/* Delete dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar pedido</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. El pedido sera desactivado.
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

"use client";

import { useState, useMemo, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  usePromociones,
  useDeletePromocion,
} from "@/hooks/queries/use-promociones";
import { useUserStore } from "@/store/user-store";
import { hasPermission } from "@/lib/permissions";
import type { Promocion } from "@pronto/shared/types";
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
import { Plus, Pencil, Trash2, Percent } from "lucide-react";
import { EmptyGeneric } from "@/components/illustrations";
import gsap from "gsap";

const TIPO_LABELS: Record<string, string> = {
  PORCENTAJE: "Porcentaje",
  MONTO_FIJO: "Monto Fijo",
  CANTIDAD_MINIMA: "Cantidad Minima",
  COMBO: "Combo",
};

const TIPO_COLORS: Record<string, string> = {
  PORCENTAJE:
    "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400",
  MONTO_FIJO:
    "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
  CANTIDAD_MINIMA:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  COMBO:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(n);
}

export default function PromocionesPage() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const permissions = user?.permissions ?? [];
  const canManage = hasPermission(permissions, "promotions:manage");

  const [page, setPage] = useState(1);
  const { data, isLoading } = usePromociones({ page, pageSize: 20 });
  const deleteMutation = useDeletePromocion();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const promociones = data?.data || [];
  const meta = data?.meta;

  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".promos-header",
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" },
      );
      gsap.fromTo(
        ".promos-summary",
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, delay: 0.1, ease: "power3.out" },
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const columns = useMemo<ColumnDef<Promocion, unknown>[]>(
    () => [
      {
        accessorKey: "nombre",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Nombre" />
        ),
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {row.getValue("nombre")}
          </span>
        ),
        enableHiding: false,
      },
      {
        accessorKey: "tipo",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Tipo" />
        ),
        cell: ({ row }) => {
          const t = row.getValue("tipo") as string;
          return (
            <Badge
              variant="secondary"
              className={`border-0 text-xs font-medium ${TIPO_COLORS[t] || ""}`}
            >
              {TIPO_LABELS[t] || t}
            </Badge>
          );
        },
      },
      {
        accessorKey: "valor",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="Valor"
            className="justify-end"
          />
        ),
        cell: ({ row }) => {
          const tipo = row.original.tipo;
          const valor = row.getValue("valor") as number;
          return (
            <div className="text-right font-semibold text-foreground">
              {tipo === "PORCENTAJE" ? `${valor}%` : formatCurrency(valor)}
            </div>
          );
        },
      },
      {
        id: "rango",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Vigencia" />
        ),
        cell: ({ row }) => {
          const inicio = row.original.fecha_inicio;
          const fin = row.original.fecha_fin;
          return (
            <span className="text-xs text-muted-foreground">
              {new Date(inicio).toLocaleDateString("es-AR")} -{" "}
              {new Date(fin).toLocaleDateString("es-AR")}
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
                  : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
              }`}
            >
              {activa ? "Activa" : "Inactiva"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "sucursal_nombre",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Sucursal" />
        ),
        cell: ({ row }) => {
          const nombre = row.getValue("sucursal_nombre") as string;
          return nombre ? (
            <span className="text-sm text-muted-foreground">{nombre}</span>
          ) : (
            <span className="text-xs text-muted-foreground/50">Todas</span>
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
          const actions: RowAction[] = [];
          if (canManage) {
            actions.push({
              label: "Editar",
              icon: <Pencil className="h-4 w-4" />,
              onClick: () =>
                router.push(`/ventas/promociones/nueva?edit=${p.id}`),
            });
            actions.push({
              label: "Eliminar",
              icon: <Trash2 className="h-4 w-4" />,
              onClick: () => setDeleteId(p.id),
              variant: "destructive",
              separator: true,
            });
          }
          return actions.length > 0 ? (
            <div onClick={(ev) => ev.stopPropagation()}>
              <DataTableRowActions actions={actions} />
            </div>
          ) : null;
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
      <div className="promos-header flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Promociones</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona descuentos, ofertas y combos
          </p>
        </div>
        {canManage && (
          <Button asChild size="lg" className="shadow-sm">
            <Link href="/ventas/promociones/nueva">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Promocion
            </Link>
          </Button>
        )}
      </div>

      {/* Summary bar */}
      <Card className="promos-summary border-0 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-amber-500 to-primary" />
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/10">
              <Percent className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{meta?.total || 0}</p>
              <p className="text-xs text-muted-foreground">Total promociones</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={promociones}
        page={page}
        pageSize={20}
        totalPages={meta?.totalPages || 1}
        totalItems={meta?.total}
        onPageChange={setPage}
        searchKey="nombre"
        searchPlaceholder="Buscar por nombre..."
        isLoading={isLoading}
        emptyIllustration={<EmptyGeneric className="w-full h-full" />}
        emptyMessage="No se encontraron promociones"
        emptyDescription="Crea una promocion para ofrecer descuentos a tus clientes."
        emptyAction={{
          label: "Nueva Promocion",
          href: "/ventas/promociones/nueva",
        }}
        toolbarActions={
          canManage ? (
            <Button asChild size="sm" className="h-9">
              <Link href="/ventas/promociones/nueva">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Nueva
              </Link>
            </Button>
          ) : undefined
        }
      />

      {/* Delete dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar promocion</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. La promocion sera eliminada.
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

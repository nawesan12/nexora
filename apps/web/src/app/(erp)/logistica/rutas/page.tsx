"use client";

import { useState, useMemo, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRutas, useDeleteRuta } from "@/hooks/queries/use-rutas";
import { useUserStore } from "@/store/user-store";
import { hasPermission } from "@/lib/permissions";
import type { RutaList } from "@pronto/shared/types";
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
  Route,
  Download,
} from "lucide-react";
import { EmptyGeneric } from "@/components/illustrations";
import gsap from "gsap";

const DIA_SEMANA_LABELS: Record<number, string> = {
  0: "Domingo",
  1: "Lunes",
  2: "Martes",
  3: "Miercoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sabado",
};

export default function RutasPage() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const permissions = user?.permissions ?? [];
  const canManage = hasPermission(permissions, "delivery:manage");

  const [page, setPage] = useState(1);

  const { data, isLoading } = useRutas({ page, pageSize: 20 });
  const deleteMutation = useDeleteRuta();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const rutas = data?.data || [];
  const meta = data?.meta;

  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".rutas-header",
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
      );
      gsap.fromTo(
        ".rutas-summary-bar",
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, delay: 0.1, ease: "power3.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const totalCount = meta?.total || 0;

  const columns = useMemo<ColumnDef<RutaList, unknown>[]>(
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
        accessorKey: "nombre",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Nombre" />
        ),
        cell: ({ row }) => (
          <span className="text-sm font-medium text-foreground">
            {row.getValue("nombre") as string}
          </span>
        ),
        enableHiding: false,
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
        accessorKey: "dia_semana",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Dia" />
        ),
        cell: ({ row }) => {
          const dia = row.getValue("dia_semana") as number | null;
          return dia != null ? (
            <Badge variant="secondary" className="border-0 text-xs font-medium">
              {DIA_SEMANA_LABELS[dia] || String(dia)}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground/50">-</span>
          );
        },
      },
      {
        accessorKey: "paradas_count",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="#Paradas"
            className="justify-center"
          />
        ),
        cell: ({ row }) => {
          const count = row.getValue("paradas_count") as number;
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
              onClick: () => router.push(`/logistica/rutas/${r.id}`),
            },
          ];
          if (canManage) {
            actions.push({
              label: "Editar",
              icon: <Pencil className="h-4 w-4" />,
              onClick: () => router.push(`/logistica/rutas/${r.id}/editar`),
            });
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
      <div className="rutas-header flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rutas</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona las rutas de reparto planificadas
          </p>
        </div>
        {canManage && (
          <Button asChild size="lg" className="shadow-sm">
            <Link href="/logistica/rutas/nueva">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Ruta
            </Link>
          </Button>
        )}
      </div>

      {/* Summary bar */}
      <Card className="rutas-summary-bar border-0 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary to-amber-500" />
        <CardContent className="py-4">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Route className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalCount}</p>
                <p className="text-xs text-muted-foreground">Total rutas</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={rutas}
        page={page}
        pageSize={20}
        totalPages={meta?.totalPages || 1}
        totalItems={meta?.total}
        onPageChange={setPage}
        searchKey="nombre"
        searchPlaceholder="Buscar por nombre..."
        isLoading={isLoading}
        emptyIllustration={<EmptyGeneric className="w-full h-full" />}
        emptyMessage="No se encontraron rutas"
        emptyDescription="Crea una nueva ruta para planificar los recorridos de reparto."
        emptyAction={{ label: "Nueva Ruta", href: "/logistica/rutas/nueva" }}
        enableRowSelection
        onRowClick={(row) =>
          router.push(`/logistica/rutas/${row.original.id}`)
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
              <Link href="/logistica/rutas/nueva">
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
            <AlertDialogTitle>Eliminar ruta</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. La ruta sera eliminada
              permanentemente.
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

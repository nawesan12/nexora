"use client";

import { useState, useMemo, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEmpleados, useDeleteEmpleado } from "@/hooks/queries/use-employees";
import { useUserStore } from "@/store/user-store";
import { hasPermission } from "@/lib/permissions";
import type { Rol } from "@nexora/shared/constants";
import { ROLE_LABELS, ESTADO_EMPLEADO_LABELS } from "@nexora/shared/constants";
import type { Empleado } from "@nexora/shared/types";
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { DataTable, DataTableColumnHeader, DataTableRowActions, type RowAction } from "@/components/data-table";
import { EmployeeBulkActions } from "@/components/employees/employee-bulk-actions";
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
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  Users,
  UserCog,
} from "lucide-react";
import { EmptyEmployees } from "@/components/illustrations";
import { useDebounce } from "@/hooks/use-debounce";
import gsap from "gsap";

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400",
  VENDEDOR: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
  SUPERVISOR: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  FINANZAS: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  REPARTIDOR: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-400",
  JEFE_VENTAS: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400",
  DEPOSITO: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400",
  VENDEDOR_CALLE: "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400",
};

const ROLE_AVATAR_COLORS: Record<string, string> = {
  ADMIN: "bg-violet-500",
  VENDEDOR: "bg-blue-500",
  SUPERVISOR: "bg-amber-500",
  FINANZAS: "bg-emerald-500",
  REPARTIDOR: "bg-cyan-500",
  JEFE_VENTAS: "bg-rose-500",
  DEPOSITO: "bg-indigo-500",
  VENDEDOR_CALLE: "bg-sky-500",
};

const ESTADO_COLORS: Record<string, string> = {
  ACTIVO: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  LICENCIA: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  DESVINCULADO: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
};

function getInitials(nombre: string, apellido: string): string {
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
}

export { ROLE_COLORS, ROLE_AVATAR_COLORS, getInitials };

export default function EmpleadosPage() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const permissions = useUserStore((s) => s.user?.permissions ?? []);
  const canManage = hasPermission(permissions, "employees:edit");

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 300);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const { data, isLoading } = useEmpleados({
    page,
    pageSize: 20,
    search: search || undefined,
  });
  const deleteMutation = useDeleteEmpleado();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const empleados = data?.data || [];
  const meta = data?.meta;

  const selectedRows = useMemo(() => {
    return Object.keys(rowSelection)
      .filter((key) => rowSelection[key])
      .map((key) => empleados[Number(key)])
      .filter(Boolean);
  }, [rowSelection, empleados]);

  const handleClearSelection = () => setRowSelection({});

  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".emp-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      );
      gsap.fromTo(
        ".emp-summary",
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.15 },
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const columns = useMemo<ColumnDef<Empleado, unknown>[]>(
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
          <DataTableColumnHeader column={column} title="Empleado" />
        ),
        cell: ({ row }) => {
          const e = row.original;
          return (
            <div className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${ROLE_AVATAR_COLORS[e.rol] || "bg-gray-500"}`}
              >
                {getInitials(e.nombre, e.apellido)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {e.apellido}, {e.nombre}
                </p>
                {e.email && (
                  <p className="text-xs text-muted-foreground truncate">
                    {e.email}
                  </p>
                )}
              </div>
            </div>
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
          const est = row.getValue("estado") as string;
          return (
            <Badge
              variant="secondary"
              className={`border-0 text-xs font-medium ${ESTADO_COLORS[est] || ""}`}
            >
              {ESTADO_EMPLEADO_LABELS[est] || est}
            </Badge>
          );
        },
        filterFn: (row, id, value) => {
          return value === undefined || row.getValue(id) === value;
        },
      },
      {
        accessorKey: "rol",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Rol" />
        ),
        cell: ({ row }) => {
          const rol = row.getValue("rol") as string;
          return (
            <Badge
              variant="secondary"
              className={`border-0 text-xs font-medium ${ROLE_COLORS[rol] || ""}`}
            >
              {ROLE_LABELS[rol as Rol] || rol}
            </Badge>
          );
        },
        filterFn: (row, id, value) => {
          return value === undefined || row.getValue(id) === value;
        },
      },
      {
        accessorKey: "cuil",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="CUIL" />
        ),
        cell: ({ row }) => {
          const cuil = row.getValue("cuil") as string;
          return cuil ? (
            <span className="font-mono text-xs text-muted-foreground">
              {cuil}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground/50">-</span>
          );
        },
      },
      {
        accessorKey: "access_code",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Codigo" />
        ),
        cell: ({ row }) => {
          const code = row.getValue("access_code") as string;
          return code ? (
            <Badge variant="outline" className="font-mono text-xs">
              {code}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground/50">-</span>
          );
        },
      },
      {
        accessorKey: "created_at",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Creado" />
        ),
        cell: ({ row }) => {
          const date = row.getValue("created_at") as string;
          return (
            <span className="text-xs text-muted-foreground">
              {new Date(date).toLocaleDateString("es-AR")}
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
          const e = row.original;
          const actions: RowAction[] = [
            {
              label: "Ver detalle",
              icon: <Eye className="h-4 w-4" />,
              onClick: () => router.push(`/empleados/${e.id}`),
            },
          ];
          if (canManage) {
            actions.push({
              label: "Editar",
              icon: <Pencil className="h-4 w-4" />,
              onClick: () => router.push(`/empleados/${e.id}?edit=true`),
            });
            actions.push({
              label: "Eliminar",
              icon: <Trash2 className="h-4 w-4" />,
              onClick: () => setDeleteId(e.id),
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
    <div ref={containerRef} className="space-y-5">
      {/* Header */}
      <div className="emp-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Empleados
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestiona los empleados de tu empresa
          </p>
        </div>
        {canManage && (
          <Button asChild className="shadow-sm">
            <Link href="/empleados/nuevo">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Empleado
            </Link>
          </Button>
        )}
      </div>

      {/* Summary Bar */}
      {meta && (
        <div className="emp-summary flex items-center gap-3 rounded-xl border border-border/50 bg-gradient-to-r from-[var(--accent)]/5 to-transparent px-5 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
            <UserCog className="h-4 w-4" />
          </div>
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{meta.total}</span>
            {" empleados en total"}
          </span>
        </div>
      )}

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={empleados}
        page={page}
        pageSize={20}
        totalPages={meta?.totalPages || 1}
        totalItems={meta?.total}
        onPageChange={setPage}
        searchKey="nombre"
        searchPlaceholder="Buscar por nombre..."
        filterOptions={[
          {
            key: "rol",
            label: "Rol",
            options: Object.entries(ROLE_LABELS).map(([value, label]) => ({
              value,
              label,
            })),
          },
          {
            key: "estado",
            label: "Estado",
            options: Object.entries(ESTADO_EMPLEADO_LABELS).map(
              ([value, label]) => ({
                value,
                label,
              }),
            ),
          },
        ]}
        isLoading={isLoading}
        emptyIllustration={<EmptyEmployees className="w-full h-full" />}
        emptyMessage="No se encontraron empleados"
        emptyDescription="Comienza agregando tu primer empleado al sistema."
        emptyAction={{ label: "Agregar Empleado", href: "/empleados/nuevo" }}
        enableRowSelection={canManage}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        onRowClick={(row) => router.push(`/empleados/${row.original.id}`)}
        bulkActions={
          canManage && selectedRows.length > 0 ? (
            <EmployeeBulkActions
              selectedRows={selectedRows}
              onClearSelection={handleClearSelection}
            />
          ) : undefined
        }
        toolbarActions={
          canManage ? (
            <Button asChild size="sm" className="h-9">
              <Link href="/empleados/nuevo">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Nuevo
              </Link>
            </Button>
          ) : undefined
        }
      />

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar empleado</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. El empleado sera desactivado.
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

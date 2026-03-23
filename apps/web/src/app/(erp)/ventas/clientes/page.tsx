"use client";

import { useState, useMemo, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useClientes, useDeleteCliente } from "@/hooks/queries/use-clients";
import { useUserStore } from "@/store/user-store";
import { hasPermission } from "@/lib/permissions";
import type { Cliente } from "@pronto/shared/types";
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
  Card,
  CardContent,
} from "@/components/ui/card";
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
  Contact,
  Download,
} from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { EmptyClients } from "@/components/illustrations";

const reputacionLabels: Record<string, string> = {
  DEUDOR: "Deudor",
  BUENA: "Buena",
  CRITICA: "Critica",
  EXCELENTE: "Excelente",
  NORMAL: "Normal",
};

const REPUTACION_COLORS: Record<string, string> = {
  EXCELENTE:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  BUENA: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
  NORMAL: "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400",
  CRITICA:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  DEUDOR: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
};

const IVA_COLORS: Record<string, string> = {
  RESPONSABLE_INSCRIPTO:
    "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400",
  MONOTRIBUTO:
    "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400",
  EXENTO:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  NO_RESPONSABLE:
    "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400",
  CONSUMIDOR_FINAL:
    "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400",
};

const condicionIvaLabels: Record<string, string> = {
  RESPONSABLE_INSCRIPTO: "Resp. Inscripto",
  MONOTRIBUTO: "Monotributo",
  EXENTO: "Exento",
  NO_RESPONSABLE: "No Responsable",
  CONSUMIDOR_FINAL: "Cons. Final",
};

function getAvatarColor(reputacion: string): string {
  if (reputacion === "EXCELENTE" || reputacion === "BUENA")
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400";
  if (reputacion === "CRITICA")
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400";
  if (reputacion === "DEUDOR")
    return "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400";
  return "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400";
}

function getInitials(nombre: string, apellido?: string): string {
  const first = nombre?.charAt(0)?.toUpperCase() || "";
  const last = apellido?.charAt(0)?.toUpperCase() || "";
  return first + last || "?";
}

export default function ClientesPage() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const permissions = user?.permissions ?? [];
  const canManage = hasPermission(permissions, "clients:manage");

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 300);
  const [reputacion, setReputacion] = useState<string>("");
  const [condicionIva, setCondicionIva] = useState<string>("");

  const { data, isLoading } = useClientes({
    page,
    pageSize: 20,
    search,
    reputacion: reputacion || undefined,
    condicionIva: condicionIva || undefined,
  });
  const deleteMutation = useDeleteCliente();

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const clientes = data?.data || [];
  const meta = data?.meta;

  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".cli-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      );

      gsap.fromTo(
        ".cli-summary",
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.15 },
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Compute reputacion breakdown for summary
  const repCounts: Record<string, number> = {};
  if (clientes.length > 0) {
    for (const c of clientes) {
      repCounts[c.reputacion] = (repCounts[c.reputacion] || 0) + 1;
    }
  }

  const columns = useMemo<ColumnDef<Cliente, unknown>[]>(
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
          <DataTableColumnHeader column={column} title="Cliente" />
        ),
        cell: ({ row }) => {
          const c = row.original;
          const displayName = [c.apellido, c.nombre]
            .filter(Boolean)
            .join(", ") || c.nombre;
          return (
            <div className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${getAvatarColor(c.reputacion)}`}
              >
                {getInitials(c.nombre, c.apellido)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {displayName}
                </p>
                {c.razon_social && (
                  <p className="text-xs text-muted-foreground truncate">
                    {c.razon_social}
                  </p>
                )}
              </div>
            </div>
          );
        },
        enableHiding: false,
      },
      {
        accessorKey: "razon_social",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Razon Social" />
        ),
        cell: ({ row }) => {
          const razonSocial = row.getValue("razon_social") as string;
          return razonSocial ? (
            <span className="text-sm text-foreground truncate">
              {razonSocial}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground/50">&mdash;</span>
          );
        },
      },
      {
        accessorKey: "cuit",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="CUIT" />
        ),
        cell: ({ row }) => {
          const cuit = row.getValue("cuit") as string;
          return cuit ? (
            <code className="font-mono text-xs bg-muted px-2 py-1 rounded">
              {cuit}
            </code>
          ) : (
            <span className="text-xs text-muted-foreground/50">&mdash;</span>
          );
        },
      },
      {
        accessorKey: "condicion_iva",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Cond. IVA" />
        ),
        cell: ({ row }) => {
          const iva = row.getValue("condicion_iva") as string;
          return iva ? (
            <Badge
              variant="secondary"
              className={`border-0 text-xs font-medium ${IVA_COLORS[iva] || ""}`}
            >
              {condicionIvaLabels[iva] || iva}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground/50">&mdash;</span>
          );
        },
        filterFn: (row, id, value) => {
          return value === undefined || row.getValue(id) === value;
        },
      },
      {
        accessorKey: "reputacion",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Reputacion" />
        ),
        cell: ({ row }) => {
          const rep = row.getValue("reputacion") as string;
          return (
            <Badge
              variant="secondary"
              className={`border-0 text-xs font-medium ${REPUTACION_COLORS[rep] || ""}`}
            >
              {reputacionLabels[rep] || rep}
            </Badge>
          );
        },
        filterFn: (row, id, value) => {
          return value === undefined || row.getValue(id) === value;
        },
      },
      {
        accessorKey: "telefono",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Telefono" />
        ),
        cell: ({ row }) => {
          const telefono = row.getValue("telefono") as string;
          return telefono ? (
            <span className="text-sm text-muted-foreground">{telefono}</span>
          ) : (
            <span className="text-xs text-muted-foreground/50">&mdash;</span>
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
          const c = row.original;
          const actions: RowAction[] = [
            {
              label: "Ver detalle",
              icon: <Eye className="h-4 w-4" />,
              onClick: () => router.push(`/ventas/clientes/${c.id}`),
            },
          ];
          if (canManage) {
            actions.push({
              label: "Editar",
              icon: <Pencil className="h-4 w-4" />,
              onClick: () =>
                router.push(`/ventas/clientes/${c.id}?edit=true`),
            });
            actions.push({
              label: "Eliminar",
              icon: <Trash2 className="h-4 w-4" />,
              onClick: () => setDeleteId(c.id),
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
      <div className="cli-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Gestiona tu cartera de clientes
          </p>
        </div>
        {canManage && (
          <Button asChild>
            <Link href="/ventas/clientes/nuevo">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Cliente
            </Link>
          </Button>
        )}
      </div>

      {/* Summary Bar */}
      <Card className="cli-summary border-0 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary/80 to-primary/20" />
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Contact className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total clientes</p>
                <p className="text-xl font-bold">
                  {meta?.total ?? clientes.length}
                </p>
              </div>
            </div>
            {Object.entries(repCounts).map(([rep, count]) => (
              <div key={rep} className="flex items-center gap-2">
                <span
                  className={`inline-flex h-2.5 w-2.5 rounded-full ${REPUTACION_COLORS[rep]?.split(" ")[0] || "bg-gray-300"}`}
                />
                <span className="text-sm text-muted-foreground">
                  {reputacionLabels[rep] || rep}
                </span>
                <span className="text-sm font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={clientes}
        page={page}
        pageSize={20}
        totalPages={meta?.totalPages || 1}
        totalItems={meta?.total}
        onPageChange={setPage}
        searchKey="nombre"
        searchPlaceholder="Buscar por nombre, razon social o CUIT..."
        filterOptions={[
          {
            key: "reputacion",
            label: "Reputacion",
            options: [
              { value: "EXCELENTE", label: "Excelente" },
              { value: "BUENA", label: "Buena" },
              { value: "NORMAL", label: "Normal" },
              { value: "CRITICA", label: "Critica" },
              { value: "DEUDOR", label: "Deudor" },
            ],
          },
          {
            key: "condicion_iva",
            label: "Cond. IVA",
            options: [
              { value: "RESPONSABLE_INSCRIPTO", label: "Resp. Inscripto" },
              { value: "MONOTRIBUTO", label: "Monotributo" },
              { value: "EXENTO", label: "Exento" },
              { value: "NO_RESPONSABLE", label: "No Responsable" },
              { value: "CONSUMIDOR_FINAL", label: "Cons. Final" },
            ],
          },
        ]}
        isLoading={isLoading}
        emptyIllustration={<EmptyClients className="w-full h-full" />}
        emptyMessage="No se encontraron clientes"
        emptyDescription="Intenta ajustar los filtros o crea un nuevo cliente."
        emptyAction={{ label: "Nuevo Cliente", href: "/ventas/clientes/nuevo" }}
        enableRowSelection={canManage}
        onRowClick={(row) =>
          router.push(`/ventas/clientes/${row.original.id}`)
        }
        bulkActions={
          canManage ? (
            <Button variant="ghost" size="sm" className="h-7 text-xs">
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Exportar
            </Button>
          ) : undefined
        }
        toolbarActions={
          canManage ? (
            <Button asChild size="sm" className="h-9">
              <Link href="/ventas/clientes/nuevo">
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
            <AlertDialogTitle>Eliminar cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. El cliente sera desactivado.
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

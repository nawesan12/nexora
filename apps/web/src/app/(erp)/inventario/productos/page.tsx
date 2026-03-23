"use client";

import { useState, useMemo, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProductos, useDeleteProducto } from "@/hooks/queries/use-products";
import { useUserStore } from "@/store/user-store";
import { hasPermission } from "@/lib/permissions";
import type { Producto } from "@pronto/shared/types";
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
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  Package,
  Download,
} from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { EmptyProducts } from "@/components/illustrations";
import gsap from "gsap";

const formatARS = (value: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(
    value,
  );

export default function ProductosPage() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const permissions = user?.permissions ?? [];
  const canManage = hasPermission(permissions, "products:manage");

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 300);

  const { data, isLoading } = useProductos({
    page,
    pageSize: 20,
    search: search || undefined,
  });
  const deleteMutation = useDeleteProducto();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const productos = data?.data || [];
  const meta = data?.meta;

  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".prod-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      );
      gsap.fromTo(
        ".prod-summary",
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.15 },
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const columns = useMemo<ColumnDef<Producto, unknown>[]>(
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
        accessorKey: "codigo",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Codigo" />
        ),
        cell: ({ row }) => {
          const codigo = row.getValue("codigo") as string | undefined;
          return codigo ? (
            <Badge
              variant="outline"
              className="font-mono text-xs border-[var(--accent)]/30 text-[var(--accent)]"
            >
              {codigo}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground/50">—</span>
          );
        },
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
        accessorKey: "familia_nombre",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Familia" />
        ),
        cell: ({ row }) => {
          const value = row.getValue("familia_nombre") as string | undefined;
          return value ? (
            <span className="text-sm text-muted-foreground">{value}</span>
          ) : (
            <span className="text-xs text-muted-foreground/50">—</span>
          );
        },
      },
      {
        accessorKey: "categoria_nombre",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Categoria" />
        ),
        cell: ({ row }) => {
          const value = row.getValue("categoria_nombre") as string | undefined;
          return value ? (
            <span className="text-sm text-muted-foreground">{value}</span>
          ) : (
            <span className="text-xs text-muted-foreground/50">—</span>
          );
        },
      },
      {
        accessorKey: "precio_base",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="Precio"
            className="justify-end"
          />
        ),
        cell: ({ row }) => (
          <div className="text-right text-sm font-semibold tabular-nums text-foreground">
            {formatARS(row.getValue("precio_base") as number)}
          </div>
        ),
      },
      {
        accessorKey: "unidad",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Unidad" />
        ),
        cell: ({ row }) => (
          <Badge
            variant="secondary"
            className="bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
          >
            {row.getValue("unidad") as string}
          </Badge>
        ),
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
              onClick: () => router.push(`/inventario/productos/${p.id}`),
            },
          ];
          if (canManage) {
            actions.push({
              label: "Editar",
              icon: <Pencil className="h-4 w-4" />,
              onClick: () =>
                router.push(`/inventario/productos/${p.id}?edit=true`),
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
    <div ref={containerRef} className="space-y-5">
      {/* Header */}
      <div className="prod-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Productos
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestiona tu catalogo de productos
          </p>
        </div>
        {canManage && (
          <Button asChild className="shadow-sm">
            <Link href="/inventario/productos/nuevo">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Producto
            </Link>
          </Button>
        )}
      </div>

      {/* Summary Bar */}
      {meta && (
        <div className="prod-summary flex items-center gap-3 rounded-xl border border-border/50 bg-gradient-to-r from-[var(--accent)]/5 to-transparent px-5 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
            <Package className="h-4 w-4" />
          </div>
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{meta.total}</span>{" "}
            {meta.total === 1 ? "producto" : "productos"} en total
          </span>
        </div>
      )}

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={productos}
        page={page}
        pageSize={20}
        totalPages={meta?.totalPages || 1}
        totalItems={meta?.total}
        onPageChange={setPage}
        searchKey="nombre"
        searchPlaceholder="Buscar productos..."
        isLoading={isLoading}
        emptyIllustration={<EmptyProducts className="w-full h-full" />}
        emptyMessage="No se encontraron productos"
        emptyDescription="Agrega tu primer producto para empezar."
        emptyAction={{ label: "Agregar Producto", href: "/inventario/productos/nuevo" }}
        enableRowSelection={canManage}
        onRowClick={(row) =>
          router.push(`/inventario/productos/${row.original.id}`)
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
              <Link href="/inventario/productos/nuevo">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Nuevo Producto
              </Link>
            </Button>
          ) : undefined
        }
      />

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar producto</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. El producto sera desactivado.
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

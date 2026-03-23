"use client";

import { useState, useMemo, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProveedores, useDeleteProveedor } from "@/hooks/queries/use-suppliers";
import { useDebounce } from "@/hooks/use-debounce";
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
  Building2,
  Download,
} from "lucide-react";
import { EmptyGeneric } from "@/components/illustrations";
import gsap from "gsap";

const CONDICION_IVA_LABELS: Record<string, string> = {
  RESPONSABLE_INSCRIPTO: "Resp. Inscripto",
  MONOTRIBUTO: "Monotributo",
  EXENTO: "Exento",
  NO_RESPONSABLE: "No Responsable",
  CONSUMIDOR_FINAL: "Cons. Final",
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

interface Proveedor {
  id: string;
  nombre: string;
  cuit?: string;
  condicion_iva?: string;
  email?: string;
  telefono?: string;
  contacto?: string;
  direccion?: string;
  banco?: string;
  cbu?: string;
  alias?: string;
  notas?: string;
}

export default function ProveedoresPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 300);
  const [condicionIva, setCondicionIva] = useState<string>("");

  const { data, isLoading } = useProveedores({
    page,
    pageSize: 20,
    search: search || undefined,
  });
  const deleteMutation = useDeleteProveedor();

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const proveedores = data?.data || [];
  const meta = data?.meta;

  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".prov-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      );

      gsap.fromTo(
        ".prov-summary",
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.15 },
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const columns = useMemo<ColumnDef<Proveedor, unknown>[]>(
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
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {row.original.nombre?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <span className="text-sm font-medium text-foreground truncate">
              {row.getValue("nombre")}
            </span>
          </div>
        ),
        enableHiding: false,
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
              {CONDICION_IVA_LABELS[iva] || iva}
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
        accessorKey: "email",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Email" />
        ),
        cell: ({ row }) => {
          const email = row.getValue("email") as string;
          return email ? (
            <span className="text-sm text-muted-foreground">{email}</span>
          ) : (
            <span className="text-xs text-muted-foreground/50">&mdash;</span>
          );
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
        accessorKey: "contacto",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Contacto" />
        ),
        cell: ({ row }) => {
          const contacto = row.getValue("contacto") as string;
          return contacto ? (
            <span className="text-sm text-muted-foreground">{contacto}</span>
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
          const proveedor = row.original;
          const actions: RowAction[] = [
            {
              label: "Ver detalle",
              icon: <Eye className="h-4 w-4" />,
              onClick: () =>
                router.push(`/compras/proveedores/${proveedor.id}`),
            },
            {
              label: "Editar",
              icon: <Pencil className="h-4 w-4" />,
              onClick: () =>
                router.push(`/compras/proveedores/${proveedor.id}`),
            },
            {
              label: "Eliminar",
              icon: <Trash2 className="h-4 w-4" />,
              onClick: () => setDeleteId(proveedor.id),
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
    [router],
  );

  return (
    <div ref={containerRef} className="space-y-5">
      {/* Header */}
      <div className="prov-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Proveedores
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestiona tus proveedores y sus datos
          </p>
        </div>
        <Button asChild>
          <Link href="/compras/proveedores/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Proveedor
          </Link>
        </Button>
      </div>

      {/* Summary Bar */}
      {meta && (
        <div className="prov-summary flex items-center gap-3 rounded-xl border border-border/50 bg-gradient-to-r from-[var(--accent)]/5 to-transparent px-5 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
            <Building2 className="h-4 w-4" />
          </div>
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{meta.total}</span>
            {" proveedores en total"}
          </span>
        </div>
      )}

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={proveedores}
        page={page}
        pageSize={20}
        totalPages={meta?.totalPages || 1}
        totalItems={meta?.total}
        onPageChange={setPage}
        onRowClick={(row) =>
          router.push(`/compras/proveedores/${row.original.id}`)
        }
        searchKey="nombre"
        searchPlaceholder="Buscar por nombre o CUIT..."
        filterOptions={[
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
        emptyIllustration={<EmptyGeneric className="w-full h-full" />}
        emptyMessage="No se encontraron proveedores"
        emptyDescription="Crea un nuevo proveedor para comenzar."
        emptyAction={{ label: "Nuevo Proveedor", href: "/compras/proveedores/nuevo" }}
        enableRowSelection
        bulkActions={
          <Button variant="ghost" size="sm" className="h-7 text-xs">
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Exportar
          </Button>
        }
        toolbarActions={
          <Button asChild size="sm" className="h-9">
            <Link href="/compras/proveedores/nuevo">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Nuevo
            </Link>
          </Button>
        }
      />

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar proveedor</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. El proveedor sera desactivado.
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

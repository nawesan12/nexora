"use client";

import { useState, useMemo, useRef, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { useExtractos } from "@/hooks/queries/use-reconciliacion";
import type { ExtractoBancario } from "@pronto/shared/types";
import type { ColumnDef } from "@tanstack/react-table";
import {
  DataTable,
  DataTableColumnHeader,
  DataTableRowActions,
  type RowAction,
} from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeftRight, Eye } from "lucide-react";
import { EmptyGeneric } from "@/components/illustrations";
import gsap from "gsap";
import Link from "next/link";

export default function ReconciliacionPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useExtractos({ page, pageSize: 20 });

  const extractos = data?.data || [];
  const meta = data?.meta;

  const containerRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".recon-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      );
      gsap.fromTo(
        ".recon-summary",
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.15 },
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const columns = useMemo<ColumnDef<ExtractoBancario, unknown>[]>(
    () => [
      {
        accessorKey: "entidad_nombre",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Entidad Bancaria" />
        ),
        cell: ({ row }) => (
          <span className="font-medium">
            {row.getValue("entidad_nombre") || "-"}
          </span>
        ),
        enableHiding: false,
      },
      {
        accessorKey: "fecha_desde",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Desde" />
        ),
        cell: ({ row }) => {
          const d = row.getValue("fecha_desde") as string;
          return (
            <span className="text-sm text-muted-foreground">
              {d
                ? new Date(d + "T00:00:00").toLocaleDateString("es-AR")
                : "-"}
            </span>
          );
        },
      },
      {
        accessorKey: "fecha_hasta",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Hasta" />
        ),
        cell: ({ row }) => {
          const d = row.getValue("fecha_hasta") as string;
          return (
            <span className="text-sm text-muted-foreground">
              {d
                ? new Date(d + "T00:00:00").toLocaleDateString("es-AR")
                : "-"}
            </span>
          );
        },
      },
      {
        accessorKey: "archivo_nombre",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Archivo" />
        ),
        cell: ({ row }) => {
          const a = row.getValue("archivo_nombre") as string;
          return a ? (
            <span className="text-sm text-muted-foreground">{a}</span>
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
          const d = row.getValue("created_at") as string;
          return (
            <span className="text-sm text-muted-foreground">
              {d ? new Date(d).toLocaleDateString("es-AR") : "-"}
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
              onClick: () =>
                router.push(`/finanzas/reconciliacion/${e.id}`),
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
    [],
  );

  return (
    <div ref={containerRef} className="space-y-5">
      <div className="recon-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Conciliacion Bancaria
          </h1>
          <p className="text-sm text-muted-foreground">
            Extractos bancarios y conciliacion de movimientos
          </p>
        </div>
        <Button className="shadow-sm" asChild>
          <Link href="/finanzas/reconciliacion/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Extracto
          </Link>
        </Button>
      </div>

      {meta && (
        <div className="recon-summary flex items-center gap-3 rounded-xl border border-border/50 bg-gradient-to-r from-[var(--accent)]/5 to-transparent px-5 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
            <ArrowLeftRight className="h-4 w-4" />
          </div>
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{meta.total}</span>{" "}
            extractos en total
          </span>
        </div>
      )}

      <DataTable
        columns={columns}
        data={extractos}
        page={page}
        pageSize={20}
        totalPages={meta?.totalPages || 1}
        totalItems={meta?.total}
        onPageChange={setPage}
        searchKey="entidad_nombre"
        searchPlaceholder="Buscar por entidad..."
        isLoading={isLoading}
        emptyIllustration={<EmptyGeneric className="w-full h-full" />}
        emptyMessage="No se encontraron extractos"
        emptyDescription="Importa un extracto bancario para comenzar la conciliacion."
        onRowClick={(row) =>
          router.push(`/finanzas/reconciliacion/${row.original.id}`)
        }
      />
    </div>
  );
}

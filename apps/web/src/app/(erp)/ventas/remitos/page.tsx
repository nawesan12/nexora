"use client";

import { useState, useMemo, useRef, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { useRemitos, useDeleteRemito } from "@/hooks/queries/use-remitos";
import type { RemitoList } from "@pronto/shared/types";
import type { ColumnDef } from "@tanstack/react-table";
import {
  DataTable,
  DataTableColumnHeader,
  DataTableRowActions,
  type RowAction,
} from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Plus, ScrollText, Trash2, Eye } from "lucide-react";
import { EmptyGeneric } from "@/components/illustrations";
import gsap from "gsap";
import Link from "next/link";

const ESTADO_COLORS: Record<string, string> = {
  BORRADOR: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  EMITIDO: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
  ENTREGADO: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  ANULADO: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
};

export default function RemitosPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [estado, setEstado] = useState<string>("");
  const { data, isLoading } = useRemitos({ page, pageSize: 20, estado: estado || undefined });
  const deleteMutation = useDeleteRemito();

  const remitos = data?.data || [];
  const meta = data?.meta;
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".remitos-header", { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" });
      gsap.fromTo(".remitos-summary", { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.15 });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const columns = useMemo<ColumnDef<RemitoList, unknown>[]>(
    () => [
      {
        accessorKey: "numero",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Numero" />,
        cell: ({ row }) => (
          <Badge variant="outline" className="font-mono text-xs">
            {row.getValue("numero")}
          </Badge>
        ),
        enableHiding: false,
      },
      {
        accessorKey: "cliente_nombre",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Cliente" />,
        cell: ({ row }) => <span className="font-medium">{row.getValue("cliente_nombre")}</span>,
      },
      {
        accessorKey: "pedido_numero",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Pedido" />,
        cell: ({ row }) => {
          const num = row.getValue("pedido_numero") as string;
          return num ? <Badge variant="outline" className="font-mono text-xs">{num}</Badge> : <span className="text-xs text-muted-foreground/50">-</span>;
        },
      },
      {
        accessorKey: "estado",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
        cell: ({ row }) => {
          const est = row.getValue("estado") as string;
          return <Badge variant="secondary" className={`border-0 text-xs font-medium ${ESTADO_COLORS[est] || ""}`}>{est}</Badge>;
        },
      },
      {
        accessorKey: "fecha_emision",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" />,
        cell: ({ row }) => {
          const d = row.getValue("fecha_emision") as string;
          return <span className="text-sm text-muted-foreground">{d ? new Date(d + "T00:00:00").toLocaleDateString("es-AR") : "-"}</span>;
        },
      },
      {
        accessorKey: "transportista",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Transportista" />,
        cell: ({ row }) => {
          const t = row.getValue("transportista") as string;
          return t ? <span className="text-sm text-muted-foreground">{t}</span> : <span className="text-xs text-muted-foreground/50">-</span>;
        },
      },
      {
        id: "actions",
        header: () => <span className="text-xs font-semibold uppercase tracking-wider">Acciones</span>,
        cell: ({ row }) => {
          const r = row.original;
          const actions: RowAction[] = [
            { label: "Ver detalle", icon: <Eye className="h-4 w-4" />, onClick: () => router.push(`/ventas/remitos/${r.id}`) },
          ];
          if (r.estado === "BORRADOR") {
            actions.push({ label: "Eliminar", icon: <Trash2 className="h-4 w-4" />, onClick: () => setDeleteId(r.id), variant: "destructive", separator: true });
          }
          return <div onClick={(ev) => ev.stopPropagation()}><DataTableRowActions actions={actions} /></div>;
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
      <div className="remitos-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Remitos</h1>
          <p className="text-sm text-muted-foreground">Notas de remision / delivery notes</p>
        </div>
        <Button className="shadow-sm" asChild>
          <Link href="/ventas/remitos/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Remito
          </Link>
        </Button>
      </div>

      {meta && (
        <div className="remitos-summary flex items-center gap-3 rounded-xl border border-border/50 bg-gradient-to-r from-[var(--accent)]/5 to-transparent px-5 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
            <ScrollText className="h-4 w-4" />
          </div>
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{meta.total}</span> remitos en total
          </span>
        </div>
      )}

      <DataTable
        columns={columns}
        data={remitos}
        page={page}
        pageSize={20}
        totalPages={meta?.totalPages || 1}
        totalItems={meta?.total}
        onPageChange={setPage}
        searchKey="numero"
        searchPlaceholder="Buscar por numero..."
        isLoading={isLoading}
        emptyIllustration={<EmptyGeneric className="w-full h-full" />}
        emptyMessage="No se encontraron remitos"
        emptyDescription="Crea un remito para comenzar."
        toolbarActions={
          <div className="flex items-center gap-2">
            <Select value={estado} onValueChange={(v) => { setEstado(v === "ALL" ? "" : v); setPage(1); }}>
              <SelectTrigger className="h-9 w-[140px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="BORRADOR">Borrador</SelectItem>
                <SelectItem value="EMITIDO">Emitido</SelectItem>
                <SelectItem value="ENTREGADO">Entregado</SelectItem>
                <SelectItem value="ANULADO">Anulado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
        onRowClick={(row) => router.push(`/ventas/remitos/${row.original.id}`)}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar remito</AlertDialogTitle>
            <AlertDialogDescription>Esta accion no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) { deleteMutation.mutate(deleteId); setDeleteId(null); } }}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

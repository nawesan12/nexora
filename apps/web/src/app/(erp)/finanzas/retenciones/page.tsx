"use client";

import { useState, useMemo, useRef, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { useRetenciones, useDeleteRetencion, useAnularRetencion } from "@/hooks/queries/use-retenciones";
import type { Retencion } from "@pronto/shared/types";
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
import { Input } from "@/components/ui/input";
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
import { Plus, Receipt, Trash2, Eye, Ban } from "lucide-react";
import { EmptyGeneric } from "@/components/illustrations";
import gsap from "gsap";
import Link from "next/link";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n);
}

const estadoBadgeVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  EMITIDA: "default",
  APLICADA: "secondary",
  ANULADA: "destructive",
};

const estadoBadgeClass: Record<string, string> = {
  EMITIDA: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  APLICADA: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  ANULADA: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const tipoBadgeClass: Record<string, string> = {
  IIBB: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-teal-400",
  GANANCIAS: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  IVA: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  SUSS: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

export default function RetencionesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [tipo, setTipo] = useState<string>("");
  const [entidadTipo, setEntidadTipo] = useState<string>("");
  const [periodo, setPeriodo] = useState<string>("");

  const { data, isLoading } = useRetenciones({
    page,
    pageSize: 20,
    tipo: tipo || undefined,
    entidad_tipo: entidadTipo || undefined,
    periodo: periodo || undefined,
  });
  const deleteMutation = useDeleteRetencion();
  const anularMutation = useAnularRetencion();

  const retenciones = data?.data || [];
  const meta = data?.meta;
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [anularId, setAnularId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".ret-header", { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" });
      gsap.fromTo(".ret-summary", { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.15 });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const columns = useMemo<ColumnDef<Retencion, unknown>[]>(
    () => [
      {
        accessorKey: "tipo",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo" />,
        cell: ({ row }) => {
          const t = row.getValue("tipo") as string;
          return <Badge variant="outline" className={tipoBadgeClass[t] || ""}>{t}</Badge>;
        },
        enableHiding: false,
      },
      {
        accessorKey: "entidad_nombre",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Entidad" />,
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div>
              <span className="font-medium">{r.entidad_nombre || "-"}</span>
              <span className="ml-2 text-xs text-muted-foreground">({r.entidad_tipo})</span>
            </div>
          );
        },
      },
      {
        accessorKey: "numero_certificado",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nro Certificado" />,
        cell: ({ row }) => {
          const n = row.getValue("numero_certificado") as string;
          return n ? <span className="font-mono text-xs">{n}</span> : <span className="text-xs text-muted-foreground/50">-</span>;
        },
      },
      {
        accessorKey: "fecha",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" />,
        cell: ({ row }) => {
          const d = row.getValue("fecha") as string;
          return <span className="text-sm text-muted-foreground">{d ? new Date(d + "T00:00:00").toLocaleDateString("es-AR") : "-"}</span>;
        },
      },
      {
        accessorKey: "base_imponible",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Base Imp." />,
        cell: ({ row }) => <span className="tabular-nums">{formatCurrency(row.getValue("base_imponible") as number)}</span>,
      },
      {
        accessorKey: "alicuota",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Alicuota" />,
        cell: ({ row }) => <span className="tabular-nums">{(row.getValue("alicuota") as number).toFixed(2)}%</span>,
      },
      {
        accessorKey: "monto",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Monto" />,
        cell: ({ row }) => <span className="font-semibold tabular-nums">{formatCurrency(row.getValue("monto") as number)}</span>,
      },
      {
        accessorKey: "estado",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
        cell: ({ row }) => {
          const e = row.getValue("estado") as string;
          return <Badge variant={estadoBadgeVariant[e] || "outline"} className={estadoBadgeClass[e] || ""}>{e}</Badge>;
        },
      },
      {
        id: "actions",
        header: () => <span className="text-xs font-semibold uppercase tracking-wider">Acciones</span>,
        cell: ({ row }) => {
          const r = row.original;
          const actions: RowAction[] = [
            { label: "Ver detalle", icon: <Eye className="h-4 w-4" />, onClick: () => router.push(`/finanzas/retenciones/${r.id}`) },
          ];
          if (r.estado === "EMITIDA") {
            actions.push({ label: "Anular", icon: <Ban className="h-4 w-4" />, onClick: () => setAnularId(r.id), variant: "destructive", separator: true });
          }
          actions.push({ label: "Eliminar", icon: <Trash2 className="h-4 w-4" />, onClick: () => setDeleteId(r.id), variant: "destructive", separator: r.estado !== "EMITIDA" });
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
      <div className="ret-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Retenciones</h1>
          <p className="text-sm text-muted-foreground">Gestion de retenciones impositivas</p>
        </div>
        <Button className="shadow-sm" asChild>
          <Link href="/finanzas/retenciones/nueva"><Plus className="mr-2 h-4 w-4" />Nueva Retencion</Link>
        </Button>
      </div>

      {meta && (
        <div className="ret-summary flex items-center gap-3 rounded-xl border border-border/50 bg-gradient-to-r from-[var(--accent)]/5 to-transparent px-5 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]"><Receipt className="h-4 w-4" /></div>
          <span className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">{meta.total}</span> retenciones en total</span>
        </div>
      )}

      <DataTable
        columns={columns}
        data={retenciones}
        page={page}
        pageSize={20}
        totalPages={meta?.totalPages || 1}
        totalItems={meta?.total}
        onPageChange={setPage}
        searchKey="entidad_nombre"
        searchPlaceholder="Buscar por entidad..."
        isLoading={isLoading}
        emptyIllustration={<EmptyGeneric className="w-full h-full" />}
        emptyMessage="No se encontraron retenciones"
        emptyDescription="Registra una retencion para comenzar."
        toolbarActions={
          <div className="flex items-center gap-2">
            <Select value={tipo} onValueChange={(v) => { setTipo(v === "ALL" ? "" : v); setPage(1); }}>
              <SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="IIBB">IIBB</SelectItem>
                <SelectItem value="GANANCIAS">Ganancias</SelectItem>
                <SelectItem value="IVA">IVA</SelectItem>
                <SelectItem value="SUSS">SUSS</SelectItem>
              </SelectContent>
            </Select>
            <Select value={entidadTipo} onValueChange={(v) => { setEntidadTipo(v === "ALL" ? "" : v); setPage(1); }}>
              <SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder="Entidad" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="CLIENTE">Cliente</SelectItem>
                <SelectItem value="PROVEEDOR">Proveedor</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="month"
              className="h-9 w-[160px]"
              value={periodo}
              onChange={(e) => { setPeriodo(e.target.value); setPage(1); }}
              placeholder="Periodo"
            />
          </div>
        }
        onRowClick={(row) => router.push(`/finanzas/retenciones/${row.original.id}`)}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Eliminar retencion</AlertDialogTitle><AlertDialogDescription>Esta accion no se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) { deleteMutation.mutate(deleteId); setDeleteId(null); } }}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!anularId} onOpenChange={() => setAnularId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Anular retencion</AlertDialogTitle><AlertDialogDescription>La retencion pasara a estado ANULADA. Esta accion no se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (anularId) { anularMutation.mutate(anularId); setAnularId(null); } }}>Anular</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

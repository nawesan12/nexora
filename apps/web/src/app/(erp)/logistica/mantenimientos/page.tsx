"use client";

import { useState, useMemo, useRef, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { useMantenimientos, useDeleteMantenimiento } from "@/hooks/queries/use-mantenimientos";
import { useVehiculos } from "@/hooks/queries/use-logistics";
import type { MantenimientoVehiculo } from "@pronto/shared/types";
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
import { Plus, Wrench, Trash2, Eye } from "lucide-react";
import { EmptyGeneric } from "@/components/illustrations";
import gsap from "gsap";
import Link from "next/link";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n);
}

export default function MantenimientosPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [vehiculoId, setVehiculoId] = useState<string>("");
  const { data, isLoading } = useMantenimientos({ page, pageSize: 20, vehiculo_id: vehiculoId || undefined });
  const { data: vehiculosData } = useVehiculos({ page: 1, pageSize: 100 });
  const deleteMutation = useDeleteMantenimiento();

  const mantenimientos = data?.data || [];
  const meta = data?.meta;
  const vehiculos = vehiculosData?.data || [];
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".mant-header", { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" });
      gsap.fromTo(".mant-summary", { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.15 });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const columns = useMemo<ColumnDef<MantenimientoVehiculo, unknown>[]>(
    () => [
      {
        accessorKey: "vehiculo_patente",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Vehiculo" />,
        cell: ({ row }) => (
          <Badge variant="outline" className="font-mono text-xs">{row.getValue("vehiculo_patente")}</Badge>
        ),
        enableHiding: false,
      },
      {
        accessorKey: "tipo",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo" />,
        cell: ({ row }) => <span className="font-medium">{row.getValue("tipo")}</span>,
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
        accessorKey: "proximo_fecha",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Proximo" />,
        cell: ({ row }) => {
          const d = row.getValue("proximo_fecha") as string;
          return d ? <span className="text-sm text-muted-foreground">{new Date(d + "T00:00:00").toLocaleDateString("es-AR")}</span> : <span className="text-xs text-muted-foreground/50">-</span>;
        },
      },
      {
        accessorKey: "costo",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Costo" />,
        cell: ({ row }) => {
          const c = row.getValue("costo") as number;
          return c ? <span className="font-semibold tabular-nums">{formatCurrency(c)}</span> : <span className="text-xs text-muted-foreground/50">-</span>;
        },
      },
      {
        accessorKey: "proveedor",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Proveedor" />,
        cell: ({ row }) => {
          const p = row.getValue("proveedor") as string;
          return p ? <span className="text-sm text-muted-foreground">{p}</span> : <span className="text-xs text-muted-foreground/50">-</span>;
        },
      },
      {
        id: "actions",
        header: () => <span className="text-xs font-semibold uppercase tracking-wider">Acciones</span>,
        cell: ({ row }) => {
          const m = row.original;
          const actions: RowAction[] = [
            { label: "Ver detalle", icon: <Eye className="h-4 w-4" />, onClick: () => router.push(`/logistica/mantenimientos/${m.id}`) },
            { label: "Eliminar", icon: <Trash2 className="h-4 w-4" />, onClick: () => setDeleteId(m.id), variant: "destructive", separator: true },
          ];
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
      <div className="mant-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Mantenimientos</h1>
          <p className="text-sm text-muted-foreground">Registro de mantenimiento de vehiculos</p>
        </div>
        <Button className="shadow-sm" asChild>
          <Link href="/logistica/mantenimientos/nuevo"><Plus className="mr-2 h-4 w-4" />Nuevo Mantenimiento</Link>
        </Button>
      </div>

      {meta && (
        <div className="mant-summary flex items-center gap-3 rounded-xl border border-border/50 bg-gradient-to-r from-[var(--accent)]/5 to-transparent px-5 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]"><Wrench className="h-4 w-4" /></div>
          <span className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">{meta.total}</span> registros en total</span>
        </div>
      )}

      <DataTable
        columns={columns}
        data={mantenimientos}
        page={page}
        pageSize={20}
        totalPages={meta?.totalPages || 1}
        totalItems={meta?.total}
        onPageChange={setPage}
        searchKey="tipo"
        searchPlaceholder="Buscar por tipo..."
        isLoading={isLoading}
        emptyIllustration={<EmptyGeneric className="w-full h-full" />}
        emptyMessage="No se encontraron mantenimientos"
        emptyDescription="Registra un mantenimiento para comenzar."
        toolbarActions={
          <Select value={vehiculoId} onValueChange={(v) => { setVehiculoId(v === "ALL" ? "" : v); setPage(1); }}>
            <SelectTrigger className="h-9 w-[160px]"><SelectValue placeholder="Vehiculo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              {vehiculos.map((v) => (<SelectItem key={v.id} value={v.id}>{v.patente}</SelectItem>))}
            </SelectContent>
          </Select>
        }
        onRowClick={(row) => router.push(`/logistica/mantenimientos/${row.original.id}`)}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Eliminar mantenimiento</AlertDialogTitle><AlertDialogDescription>Esta accion no se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) { deleteMutation.mutate(deleteId); setDeleteId(null); } }}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

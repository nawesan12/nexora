"use client";

import { useState, useMemo, useRef, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { useVisitas, useDeleteVisita } from "@/hooks/queries/use-visitas";
import { useEmpleados } from "@/hooks/queries/use-employees";
import type { VisitaCliente } from "@pronto/shared/types";
import type { ColumnDef } from "@tanstack/react-table";
import {
  DataTable,
  DataTableColumnHeader,
  DataTableRowActions,
  type RowAction,
} from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Plus, MapPin, Trash2, Eye } from "lucide-react";
import { EmptyGeneric } from "@/components/illustrations";
import gsap from "gsap";
import Link from "next/link";

const resultadoColors: Record<string, string> = {
  PENDIENTE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  REALIZADA: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  NO_ATENDIDO: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  REPROGRAMADA: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  CANCELADA: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

const resultadoLabels: Record<string, string> = {
  PENDIENTE: "Pendiente",
  REALIZADA: "Realizada",
  NO_ATENDIDO: "No Atendido",
  REPROGRAMADA: "Reprogramada",
  CANCELADA: "Cancelada",
};

export default function VisitasPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [vendedorId, setVendedorId] = useState<string>("");
  const [resultado, setResultado] = useState<string>("");
  const [fechaDesde, setFechaDesde] = useState<string>("");
  const [fechaHasta, setFechaHasta] = useState<string>("");

  const { data, isLoading } = useVisitas({
    page,
    pageSize: 20,
    vendedor_id: vendedorId || undefined,
    fecha_desde: fechaDesde || undefined,
    fecha_hasta: fechaHasta || undefined,
    resultado: resultado || undefined,
  });
  const { data: empleadosData } = useEmpleados({ page: 1, pageSize: 200, rol: "VENDEDOR" });
  const deleteMutation = useDeleteVisita();

  const visitas = data?.data || [];
  const meta = data?.meta;
  const empleados = empleadosData?.data || [];
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".visita-header", { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" });
      gsap.fromTo(".visita-summary", { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.15 });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const columns = useMemo<ColumnDef<VisitaCliente, unknown>[]>(
    () => [
      {
        accessorKey: "vendedor_nombre",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Vendedor" />,
        cell: ({ row }) => <span className="font-medium">{row.getValue("vendedor_nombre")}</span>,
      },
      {
        accessorKey: "cliente_nombre",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Cliente" />,
        cell: ({ row }) => <span className="text-sm">{row.getValue("cliente_nombre")}</span>,
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
        accessorKey: "hora_inicio",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Hora" />,
        cell: ({ row }) => {
          const h = row.getValue("hora_inicio") as string;
          return h ? <span className="text-sm font-mono">{h}</span> : <span className="text-xs text-muted-foreground/50">-</span>;
        },
      },
      {
        accessorKey: "duracion_minutos",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Duracion" />,
        cell: ({ row }) => {
          const d = row.getValue("duracion_minutos") as number;
          return d ? <span className="text-sm">{d} min</span> : <span className="text-xs text-muted-foreground/50">-</span>;
        },
      },
      {
        accessorKey: "resultado",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Resultado" />,
        cell: ({ row }) => {
          const r = row.getValue("resultado") as string;
          return (
            <Badge variant="secondary" className={resultadoColors[r] || "bg-gray-100 text-gray-800"}>
              {resultadoLabels[r] || r}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: () => <span className="text-xs font-semibold uppercase tracking-wider">Acciones</span>,
        cell: ({ row }) => {
          const v = row.original;
          const actions: RowAction[] = [
            { label: "Ver detalle", icon: <Eye className="h-4 w-4" />, onClick: () => router.push(`/ventas/vendedor/visitas/${v.id}`) },
            { label: "Eliminar", icon: <Trash2 className="h-4 w-4" />, onClick: () => setDeleteId(v.id), variant: "destructive", separator: true },
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
      <div className="visita-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Visitas a Clientes</h1>
          <p className="text-sm text-muted-foreground">Registro y seguimiento de visitas comerciales</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/ventas/vendedor/rutas-visita"><MapPin className="mr-2 h-4 w-4" />Mapa de Rutas</Link>
          </Button>
          <Button className="shadow-sm" asChild>
            <Link href="/ventas/vendedor/visitas/nueva"><Plus className="mr-2 h-4 w-4" />Nueva Visita</Link>
          </Button>
        </div>
      </div>

      {meta && (
        <div className="visita-summary flex items-center gap-3 rounded-xl border border-border/50 bg-gradient-to-r from-[var(--accent)]/5 to-transparent px-5 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]"><MapPin className="h-4 w-4" /></div>
          <span className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">{meta.total}</span> visitas en total</span>
        </div>
      )}

      <DataTable
        columns={columns}
        data={visitas}
        page={page}
        pageSize={20}
        totalPages={meta?.totalPages || 1}
        totalItems={meta?.total}
        onPageChange={setPage}
        searchKey="cliente_nombre"
        searchPlaceholder="Buscar por cliente..."
        isLoading={isLoading}
        emptyIllustration={<EmptyGeneric className="w-full h-full" />}
        emptyMessage="No se encontraron visitas"
        emptyDescription="Registra una visita para comenzar."
        toolbarActions={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={vendedorId} onValueChange={(v) => { setVendedorId(v === "ALL" ? "" : v); setPage(1); }}>
              <SelectTrigger className="h-9 w-[160px]"><SelectValue placeholder="Vendedor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                {empleados.map((e) => (<SelectItem key={e.id} value={e.id}>{e.nombre} {e.apellido}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={resultado} onValueChange={(v) => { setResultado(v === "ALL" ? "" : v); setPage(1); }}>
              <SelectTrigger className="h-9 w-[150px]"><SelectValue placeholder="Resultado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                {Object.entries(resultadoLabels).map(([k, label]) => (
                  <SelectItem key={k} value={k}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              className="h-9 w-[140px]"
              value={fechaDesde}
              onChange={(e) => { setFechaDesde(e.target.value); setPage(1); }}
              placeholder="Desde"
            />
            <Input
              type="date"
              className="h-9 w-[140px]"
              value={fechaHasta}
              onChange={(e) => { setFechaHasta(e.target.value); setPage(1); }}
              placeholder="Hasta"
            />
          </div>
        }
        onRowClick={(row) => router.push(`/ventas/vendedor/visitas/${row.original.id}`)}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Eliminar visita</AlertDialogTitle><AlertDialogDescription>Esta accion no se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) { deleteMutation.mutate(deleteId); setDeleteId(null); } }}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

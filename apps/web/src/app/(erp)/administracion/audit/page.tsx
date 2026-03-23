"use client";

import { useState, useMemo, useRef, useLayoutEffect } from "react";
import { useAuditLog } from "@/hooks/queries/use-audit";
import type { AuditLogEntry } from "@pronto/shared/types";
import type { ColumnDef } from "@tanstack/react-table";
import {
  DataTable,
  DataTableColumnHeader,
} from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollText } from "lucide-react";
import { EmptyGeneric } from "@/components/illustrations";
import gsap from "gsap";

const ACCION_COLORS: Record<string, string> = {
  CREATE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  UPDATE: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
};

export default function AuditPage() {
  const [page, setPage] = useState(1);
  const [entidad, setEntidad] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const { data, isLoading } = useAuditLog({
    page,
    pageSize: 20,
    entidad: entidad || undefined,
    desde: desde || undefined,
    hasta: hasta || undefined,
  });

  const entries = data?.data || [];
  const meta = data?.meta;
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".audit-header", { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" });
      gsap.fromTo(".audit-summary", { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.15 });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const columns = useMemo<ColumnDef<AuditLogEntry, unknown>[]>(
    () => [
      {
        accessorKey: "created_at",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" />,
        cell: ({ row }) => {
          const d = row.getValue("created_at") as string;
          return <span className="text-sm text-muted-foreground">{new Date(d).toLocaleString("es-AR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>;
        },
      },
      {
        accessorKey: "usuario_nombre",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Usuario" />,
        cell: ({ row }) => <span className="font-medium">{row.getValue("usuario_nombre") || "-"}</span>,
      },
      {
        accessorKey: "accion",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Accion" />,
        cell: ({ row }) => {
          const a = row.getValue("accion") as string;
          return <Badge variant="secondary" className={`border-0 text-xs font-medium ${ACCION_COLORS[a] || ""}`}>{a}</Badge>;
        },
      },
      {
        accessorKey: "entidad",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Entidad" />,
        cell: ({ row }) => <span className="text-sm">{row.getValue("entidad")}</span>,
      },
      {
        accessorKey: "entidad_id",
        header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
        cell: ({ row }) => {
          const id = row.getValue("entidad_id") as string;
          return id ? <span className="font-mono text-xs text-muted-foreground">{id.substring(0, 8)}...</span> : <span className="text-xs text-muted-foreground/50">-</span>;
        },
      },
    ],
    [],
  );

  return (
    <div ref={containerRef} className="space-y-5">
      <div className="audit-header space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Audit Log</h1>
        <p className="text-sm text-muted-foreground">Registro de cambios en el sistema</p>
      </div>

      {meta && (
        <div className="audit-summary flex items-center gap-3 rounded-xl border border-border/50 bg-gradient-to-r from-[var(--accent)]/5 to-transparent px-5 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]"><ScrollText className="h-4 w-4" /></div>
          <span className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">{meta.total}</span> registros</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Filtrar por entidad..."
          value={entidad}
          onChange={(e) => { setEntidad(e.target.value); setPage(1); }}
          className="h-9 w-[180px]"
        />
        <Input
          type="date"
          value={desde}
          onChange={(e) => { setDesde(e.target.value); setPage(1); }}
          className="h-9 w-[160px]"
          placeholder="Desde"
        />
        <Input
          type="date"
          value={hasta}
          onChange={(e) => { setHasta(e.target.value); setPage(1); }}
          className="h-9 w-[160px]"
          placeholder="Hasta"
        />
      </div>

      <DataTable
        columns={columns}
        data={entries}
        page={page}
        pageSize={20}
        totalPages={meta?.totalPages || 1}
        totalItems={meta?.total}
        onPageChange={setPage}
        isLoading={isLoading}
        emptyIllustration={<EmptyGeneric className="w-full h-full" />}
        emptyMessage="No se encontraron registros"
        emptyDescription="El audit log esta vacio."
        onRowClick={(row) => setSelected(row.original)}
      />

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Detalle del Cambio</SheetTitle>
          </SheetHeader>
          {selected && (
            <div className="space-y-4 mt-4">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Accion</p>
                <Badge variant="secondary" className={`border-0 text-xs font-medium ${ACCION_COLORS[selected.accion] || ""}`}>{selected.accion}</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Entidad</p>
                <p className="text-sm">{selected.entidad} <span className="font-mono text-xs text-muted-foreground">{selected.entidad_id}</span></p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Usuario</p>
                <p className="text-sm">{selected.usuario_nombre || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Fecha</p>
                <p className="text-sm">{new Date(selected.created_at).toLocaleString("es-AR")}</p>
              </div>
              {selected.datos_anteriores && (
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Datos Anteriores</p>
                  <pre className="rounded-lg bg-muted p-3 text-xs overflow-x-auto">{JSON.stringify(selected.datos_anteriores, null, 2)}</pre>
                </div>
              )}
              {selected.datos_nuevos && (
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Datos Nuevos</p>
                  <pre className="rounded-lg bg-muted p-3 text-xs overflow-x-auto">{JSON.stringify(selected.datos_nuevos, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

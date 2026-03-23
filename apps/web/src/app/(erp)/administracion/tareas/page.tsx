"use client";

import { useState, useMemo, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTasks, useDeleteTask } from "@/hooks/queries/use-tasks";
import type { Task } from "@pronto/shared/types";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Eye, Trash2, CheckSquare } from "lucide-react";
import { EmptyGeneric } from "@/components/illustrations";
import gsap from "gsap";

const PRIORIDAD_COLORS: Record<string, string> = {
  URGENTE:
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
  ALTA: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
  MEDIA:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  BAJA: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800",
};

const ESTADO_COLORS: Record<string, string> = {
  PENDIENTE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  EN_PROGRESO: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  COMPLETADA: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  CANCELADA: "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400",
};

const ESTADO_LABELS: Record<string, string> = {
  PENDIENTE: "Pendiente",
  EN_PROGRESO: "En Progreso",
  COMPLETADA: "Completada",
  CANCELADA: "Cancelada",
};

export default function TareasPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useTasks({ page, pageSize: 20 });
  const deleteMutation = useDeleteTask();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const tasks = data?.data || [];
  const meta = data?.meta;

  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".tasks-header",
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
      );
      gsap.fromTo(
        ".tasks-summary",
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, delay: 0.1, ease: "power3.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const columns = useMemo<ColumnDef<Task, unknown>[]>(
    () => [
      {
        accessorKey: "titulo",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Titulo" />
        ),
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {row.getValue("titulo") as string}
          </span>
        ),
        enableHiding: false,
      },
      {
        accessorKey: "prioridad",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Prioridad" />
        ),
        cell: ({ row }) => {
          const p = row.getValue("prioridad") as string;
          return (
            <Badge
              variant="outline"
              className={`text-xs border ${PRIORIDAD_COLORS[p] || ""}`}
            >
              {p}
            </Badge>
          );
        },
      },
      {
        accessorKey: "estado",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Estado" />
        ),
        cell: ({ row }) => {
          const e = row.getValue("estado") as string;
          return (
            <Badge
              variant="secondary"
              className={`text-xs border-0 ${ESTADO_COLORS[e] || ""}`}
            >
              {ESTADO_LABELS[e] || e}
            </Badge>
          );
        },
      },
      {
        accessorKey: "asignado_nombre",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Asignado a" />
        ),
        cell: ({ row }) => {
          const nombre = row.getValue("asignado_nombre") as string;
          return nombre ? (
            <span className="text-sm text-muted-foreground">{nombre}</span>
          ) : (
            <span className="text-xs text-muted-foreground/50">Sin asignar</span>
          );
        },
      },
      {
        accessorKey: "fecha_limite",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Fecha limite" />
        ),
        cell: ({ row }) => {
          const fecha = row.getValue("fecha_limite") as string;
          if (!fecha)
            return (
              <span className="text-xs text-muted-foreground/50">-</span>
            );
          const d = new Date(fecha);
          const isOverdue = d < new Date() && row.original.estado !== "COMPLETADA" && row.original.estado !== "CANCELADA";
          return (
            <span
              className={`text-sm ${isOverdue ? "text-red-600 dark:text-red-400 font-medium" : "text-muted-foreground"}`}
            >
              {d.toLocaleDateString("es-AR")}
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
          const t = row.original;
          const actions: RowAction[] = [
            {
              label: "Ver detalle",
              icon: <Eye className="h-4 w-4" />,
              onClick: () =>
                router.push(`/administracion/tareas/${t.id}`),
            },
            {
              label: "Eliminar",
              icon: <Trash2 className="h-4 w-4" />,
              onClick: () => setDeleteId(t.id),
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
    [router]
  );

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="tasks-header flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tareas</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona las tareas del equipo
          </p>
        </div>
        <Button asChild size="lg" className="shadow-sm">
          <Link href="/administracion/tareas/nueva">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Tarea
          </Link>
        </Button>
      </div>

      {meta && (
        <div className="tasks-summary flex items-center gap-3 rounded-xl border border-border/50 bg-gradient-to-r from-[var(--accent)]/5 to-transparent px-5 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
            <CheckSquare className="h-4 w-4" />
          </div>
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{meta.total}</span>{" "}
            tareas
          </span>
        </div>
      )}

      <DataTable
        columns={columns}
        data={tasks}
        page={page}
        pageSize={20}
        totalPages={meta?.totalPages || 1}
        totalItems={meta?.total}
        onPageChange={setPage}
        searchKey="titulo"
        searchPlaceholder="Buscar por titulo..."
        isLoading={isLoading}
        emptyIllustration={<EmptyGeneric className="w-full h-full" />}
        emptyMessage="No se encontraron tareas"
        emptyDescription="Crea una nueva tarea para organizar el trabajo del equipo."
        emptyAction={{
          label: "Nueva Tarea",
          href: "/administracion/tareas/nueva",
        }}
        onRowClick={(row) =>
          router.push(`/administracion/tareas/${row.original.id}`)
        }
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar tarea</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer.
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

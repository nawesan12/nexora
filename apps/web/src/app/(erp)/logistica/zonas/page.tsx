"use client";

import { useState, useMemo, useRef, useLayoutEffect } from "react";
import {
  useZonas,
  useCreateZona,
  useUpdateZona,
  useDeleteZona,
} from "@/hooks/queries/use-logistics";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { zonaSchema, type ZonaInput } from "@nexora/shared/schemas";
import type { Zona } from "@nexora/shared/types";
import type { ColumnDef } from "@tanstack/react-table";
import {
  DataTable,
  DataTableColumnHeader,
  DataTableRowActions,
  type RowAction,
} from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
  Pencil,
  Trash2,
  MapPin,
} from "lucide-react";
import { EmptyGeneric } from "@/components/illustrations";
import gsap from "gsap";

export default function ZonasPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useZonas({ page, pageSize: 20 });
  const createMutation = useCreateZona();
  const updateMutation = useUpdateZona();
  const deleteMutation = useDeleteZona();

  const zonas = data?.data || [];
  const meta = data?.meta;

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<ZonaInput>({
    resolver: zodResolver(zonaSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
      sucursal_id: "",
    },
  });

  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".zonas-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      );
      gsap.fromTo(
        ".zonas-summary",
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.15 },
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    form.reset({
      nombre: "",
      descripcion: "",
      sucursal_id: "",
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (z: Zona) => {
    setEditingId(z.id);
    form.reset({
      nombre: z.nombre,
      descripcion: z.descripcion || "",
      sucursal_id: z.sucursal_id || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = (data: ZonaInput) => {
    const payload = {
      ...data,
      descripcion: data.descripcion || undefined,
      sucursal_id: data.sucursal_id || undefined,
    };
    if (editingId) {
      updateMutation.mutate(
        { id: editingId, data: payload },
        {
          onSuccess: () => {
            setDialogOpen(false);
            setEditingId(null);
            form.reset();
          },
        },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          setDialogOpen(false);
          form.reset();
        },
      });
    }
  };

  const columns = useMemo<ColumnDef<Zona, unknown>[]>(
    () => [
      {
        accessorKey: "nombre",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Nombre" />
        ),
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {row.getValue("nombre")}
          </span>
        ),
        enableHiding: false,
      },
      {
        accessorKey: "descripcion",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Descripcion" />
        ),
        cell: ({ row }) => {
          const desc = row.getValue("descripcion") as string;
          return desc ? (
            <span className="text-sm text-muted-foreground line-clamp-1">
              {desc}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground/50">-</span>
          );
        },
      },
      {
        accessorKey: "sucursal_nombre",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Sucursal" />
        ),
        cell: ({ row }) => {
          const nombre = row.getValue("sucursal_nombre") as string;
          return nombre ? (
            <span className="text-sm text-muted-foreground">{nombre}</span>
          ) : (
            <span className="text-xs text-muted-foreground/50">-</span>
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
          const z = row.original;
          const actions: RowAction[] = [
            {
              label: "Editar",
              icon: <Pencil className="h-4 w-4" />,
              onClick: () => handleOpenEdit(z),
            },
            {
              label: "Eliminar",
              icon: <Trash2 className="h-4 w-4" />,
              onClick: () => setDeleteId(z.id),
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
    [],
  );

  return (
    <div ref={containerRef} className="space-y-5">
      {/* Header */}
      <div className="zonas-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Zonas de Reparto
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestiona las zonas de distribucion
          </p>
        </div>
        <Button className="shadow-sm" onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Zona
        </Button>
      </div>

      {/* Summary Bar */}
      {meta && (
        <div className="zonas-summary flex items-center gap-3 rounded-xl border border-border/50 bg-gradient-to-r from-[var(--accent)]/5 to-transparent px-5 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
            <MapPin className="h-4 w-4" />
          </div>
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{meta.total}</span>
            {" zonas en total"}
          </span>
        </div>
      )}

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={zonas}
        page={page}
        pageSize={20}
        totalPages={meta?.totalPages || 1}
        totalItems={meta?.total}
        onPageChange={setPage}
        searchKey="nombre"
        searchPlaceholder="Buscar por nombre..."
        isLoading={isLoading}
        emptyIllustration={<EmptyGeneric className="w-full h-full" />}
        emptyMessage="No se encontraron zonas"
        emptyDescription="Crea una zona de reparto para comenzar."
        emptyAction={{
          label: "Nueva Zona",
          onClick: handleOpenCreate,
        }}
        toolbarActions={
          <Button size="sm" className="h-9" onClick={handleOpenCreate}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Nueva
          </Button>
        }
      />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Zona" : "Nueva Zona"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Zona Norte" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="descripcion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripcion</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descripcion de la zona..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sucursal_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sucursal ID</FormLabel>
                    <FormControl>
                      <Input placeholder="UUID de sucursal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Guardando..."
                    : editingId
                      ? "Actualizar"
                      : "Crear"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar zona</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. La zona sera eliminada.
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

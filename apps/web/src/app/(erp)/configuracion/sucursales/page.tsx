"use client";

import { useState, useMemo, useRef, useLayoutEffect } from "react";
import {
  useBranches,
  useCreateBranch,
  useUpdateBranch,
  useDeleteBranch,
} from "@/hooks/queries/use-branches";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sucursalSchema, type SucursalInput } from "@nexora/shared/schemas";
import type { Branch } from "@nexora/shared/types";
import type { ColumnDef } from "@tanstack/react-table";
import {
  DataTable,
  DataTableColumnHeader,
  DataTableRowActions,
  type RowAction,
} from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { EmptyGeneric } from "@/components/illustrations";
import gsap from "gsap";

export default function SucursalesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useBranches();
  const createMutation = useCreateBranch();
  const updateMutation = useUpdateBranch();
  const deleteMutation = useDeleteBranch();

  const branches = data?.data || [];
  const meta = data?.meta;

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<SucursalInput>({
    resolver: zodResolver(sucursalSchema),
    defaultValues: { nombre: "", direccion: "", telefono: "" },
  });

  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".sucursales-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      );
      gsap.fromTo(
        ".sucursales-summary",
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.15 },
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    form.reset({ nombre: "", direccion: "", telefono: "" });
    setDialogOpen(true);
  };

  const handleOpenEdit = (b: Branch) => {
    setEditingId(b.id);
    form.reset({
      nombre: b.nombre,
      direccion: b.direccion || "",
      telefono: b.telefono || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = (data: SucursalInput) => {
    if (editingId) {
      updateMutation.mutate(
        { id: editingId, data },
        { onSuccess: () => { setDialogOpen(false); setEditingId(null); } },
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => { setDialogOpen(false); },
      });
    }
  };

  const columns = useMemo<ColumnDef<Branch, unknown>[]>(
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
        accessorKey: "direccion",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Direccion" />
        ),
        cell: ({ row }) => {
          const val = row.getValue("direccion") as string;
          return val ? (
            <span className="text-sm text-muted-foreground">{val}</span>
          ) : (
            <span className="text-xs text-muted-foreground/50">-</span>
          );
        },
      },
      {
        accessorKey: "telefono",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Telefono" />
        ),
        cell: ({ row }) => {
          const val = row.getValue("telefono") as string;
          return val ? (
            <span className="text-sm text-muted-foreground">{val}</span>
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
          const b = row.original;
          const actions: RowAction[] = [
            {
              label: "Editar",
              icon: <Pencil className="h-4 w-4" />,
              onClick: () => handleOpenEdit(b),
            },
            {
              label: "Eliminar",
              icon: <Trash2 className="h-4 w-4" />,
              onClick: () => setDeleteId(b.id),
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
      <div className="sucursales-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Sucursales
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestiona las sucursales de tu empresa
          </p>
        </div>
        <Button className="shadow-sm" onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Sucursal
        </Button>
      </div>

      {meta && (
        <div className="sucursales-summary flex items-center gap-3 rounded-xl border border-border/50 bg-gradient-to-r from-[var(--accent)]/5 to-transparent px-5 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
            <Building2 className="h-4 w-4" />
          </div>
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{meta.total}</span>
            {" sucursales en total"}
          </span>
        </div>
      )}

      <DataTable
        columns={columns}
        data={branches}
        page={page}
        pageSize={20}
        totalPages={meta?.totalPages || 1}
        totalItems={meta?.total}
        onPageChange={setPage}
        searchKey="nombre"
        searchPlaceholder="Buscar por nombre..."
        isLoading={isLoading}
        emptyIllustration={<EmptyGeneric className="w-full h-full" />}
        emptyMessage="No se encontraron sucursales"
        emptyDescription="Agrega una sucursal para comenzar."
        emptyAction={{ label: "Nueva Sucursal", onClick: handleOpenCreate }}
        toolbarActions={
          <Button size="sm" className="h-9" onClick={handleOpenCreate}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Nueva
          </Button>
        }
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Sucursal" : "Nueva Sucursal"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Sucursal Centro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="direccion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Direccion</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Av. Rivadavia 1234" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="telefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefono</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: 011-4567-8901" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending
                    ? "Guardando..."
                    : editingId ? "Actualizar" : "Crear"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar sucursal</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. La sucursal sera eliminada.
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

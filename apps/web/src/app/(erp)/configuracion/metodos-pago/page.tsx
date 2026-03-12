"use client";

import { useState, useMemo, useRef, useLayoutEffect } from "react";
import {
  useMetodosPago,
  useCreateMetodoPago,
  useUpdateMetodoPago,
  useDeleteMetodoPago,
} from "@/hooks/queries/use-finance";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { metodoPagoSchema, type MetodoPagoInput } from "@nexora/shared/schemas";
import type { MetodoPago } from "@nexora/shared/types";
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
import { Plus, Pencil, Trash2, CreditCard } from "lucide-react";
import { EmptyGeneric } from "@/components/illustrations";
import gsap from "gsap";

export default function MetodosPagoPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMetodosPago({ page, pageSize: 20 });
  const createMutation = useCreateMetodoPago();
  const updateMutation = useUpdateMetodoPago();
  const deleteMutation = useDeleteMetodoPago();

  const metodos = data?.data || [];
  const meta = data?.meta;

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<MetodoPagoInput>({
    resolver: zodResolver(metodoPagoSchema),
    defaultValues: { nombre: "", tipo: "", comision_porcentaje: 0, descuento_porcentaje: 0, sucursal_id: "" },
  });

  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".mp-header", { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" });
      gsap.fromTo(".mp-summary", { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.15 });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    form.reset({ nombre: "", tipo: "", comision_porcentaje: 0, descuento_porcentaje: 0, sucursal_id: "" });
    setDialogOpen(true);
  };

  const handleOpenEdit = (mp: MetodoPago) => {
    setEditingId(mp.id);
    form.reset({
      nombre: mp.nombre,
      tipo: mp.tipo,
      comision_porcentaje: mp.comision_porcentaje,
      descuento_porcentaje: mp.descuento_porcentaje,
      sucursal_id: mp.sucursal_id,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (data: MetodoPagoInput) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data }, { onSuccess: () => { setDialogOpen(false); setEditingId(null); } });
    } else {
      createMutation.mutate(data, { onSuccess: () => { setDialogOpen(false); } });
    }
  };

  const columns = useMemo<ColumnDef<MetodoPago, unknown>[]>(() => [
    {
      accessorKey: "nombre",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nombre" />,
      cell: ({ row }) => <span className="font-medium">{row.getValue("nombre")}</span>,
      enableHiding: false,
    },
    {
      accessorKey: "tipo",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo" />,
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.getValue("tipo")}</span>,
    },
    {
      accessorKey: "comision_porcentaje",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Comision %" className="justify-end" />,
      cell: ({ row }) => <div className="text-right tabular-nums">{row.getValue("comision_porcentaje")}%</div>,
    },
    {
      accessorKey: "descuento_porcentaje",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Descuento %" className="justify-end" />,
      cell: ({ row }) => <div className="text-right tabular-nums">{row.getValue("descuento_porcentaje")}%</div>,
    },
    {
      id: "actions",
      header: () => <span className="text-xs font-semibold uppercase tracking-wider">Acciones</span>,
      cell: ({ row }) => {
        const mp = row.original;
        const actions: RowAction[] = [
          { label: "Editar", icon: <Pencil className="h-4 w-4" />, onClick: () => handleOpenEdit(mp) },
          { label: "Eliminar", icon: <Trash2 className="h-4 w-4" />, onClick: () => setDeleteId(mp.id), variant: "destructive", separator: true },
        ];
        return <div onClick={(ev) => ev.stopPropagation()}><DataTableRowActions actions={actions} /></div>;
      },
      enableSorting: false,
      enableHiding: false,
      size: 60,
    },
  ], []);

  return (
    <div ref={containerRef} className="space-y-5">
      <div className="mp-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Metodos de Pago</h1>
          <p className="text-sm text-muted-foreground">Define los metodos de pago disponibles</p>
        </div>
        <Button className="shadow-sm" onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Metodo
        </Button>
      </div>

      {meta && (
        <div className="mp-summary flex items-center gap-3 rounded-xl border border-border/50 bg-gradient-to-r from-[var(--accent)]/5 to-transparent px-5 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
            <CreditCard className="h-4 w-4" />
          </div>
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{meta.total}</span> metodos de pago
          </span>
        </div>
      )}

      <DataTable columns={columns} data={metodos} page={page} pageSize={20} totalPages={meta?.totalPages || 1} totalItems={meta?.total} onPageChange={setPage} searchKey="nombre" searchPlaceholder="Buscar por nombre..." isLoading={isLoading} emptyIllustration={<EmptyGeneric className="w-full h-full" />} emptyMessage="No se encontraron metodos de pago" emptyDescription="Agrega un metodo de pago." emptyAction={{ label: "Nuevo Metodo", onClick: handleOpenCreate }} />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Editar Metodo de Pago" : "Nuevo Metodo de Pago"}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="nombre" render={({ field }) => (
                  <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input placeholder="Ej: Efectivo" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="tipo" render={({ field }) => (
                  <FormItem><FormLabel>Tipo</FormLabel><FormControl><Input placeholder="Ej: EFECTIVO" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="comision_porcentaje" render={({ field }) => (
                  <FormItem><FormLabel>Comision (%)</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="descuento_porcentaje" render={({ field }) => (
                  <FormItem><FormLabel>Descuento (%)</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="sucursal_id" render={({ field }) => (
                <FormItem><FormLabel>Sucursal ID</FormLabel><FormControl><Input placeholder="UUID de sucursal" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? "Guardando..." : editingId ? "Actualizar" : "Crear"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Eliminar metodo de pago</AlertDialogTitle><AlertDialogDescription>Esta accion no se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) { deleteMutation.mutate(deleteId); setDeleteId(null); } }}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

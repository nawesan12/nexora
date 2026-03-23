"use client";

import { useState, useMemo, useRef, useLayoutEffect } from "react";
import {
  useEntidadesBancarias,
  useCreateEntidadBancaria,
  useUpdateEntidadBancaria,
  useDeleteEntidadBancaria,
} from "@/hooks/queries/use-finance";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { entidadBancariaSchema, type EntidadBancariaInput } from "@pronto/shared/schemas";
import type { EntidadBancaria } from "@pronto/shared/types";
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
import { Plus, Pencil, Trash2, Landmark } from "lucide-react";
import { EmptyGeneric } from "@/components/illustrations";
import gsap from "gsap";

export default function EntidadesBancariasPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useEntidadesBancarias({ page, pageSize: 20 });
  const createMutation = useCreateEntidadBancaria();
  const updateMutation = useUpdateEntidadBancaria();
  const deleteMutation = useDeleteEntidadBancaria();

  const entidades = data?.data || [];
  const meta = data?.meta;

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<EntidadBancariaInput>({
    resolver: zodResolver(entidadBancariaSchema),
    defaultValues: { nombre: "", sucursal_banco: "", numero_cuenta: "", cbu: "", alias: "", sucursal_id: "" },
  });

  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".eb-header", { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" });
      gsap.fromTo(".eb-summary", { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.15 });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    form.reset({ nombre: "", sucursal_banco: "", numero_cuenta: "", cbu: "", alias: "", sucursal_id: "" });
    setDialogOpen(true);
  };

  const handleOpenEdit = (eb: EntidadBancaria) => {
    setEditingId(eb.id);
    form.reset({
      nombre: eb.nombre,
      sucursal_banco: eb.sucursal_banco || "",
      numero_cuenta: eb.numero_cuenta || "",
      cbu: eb.cbu || "",
      alias: eb.alias || "",
      sucursal_id: eb.sucursal_id,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (data: EntidadBancariaInput) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data }, { onSuccess: () => { setDialogOpen(false); setEditingId(null); } });
    } else {
      createMutation.mutate(data, { onSuccess: () => { setDialogOpen(false); } });
    }
  };

  const columns = useMemo<ColumnDef<EntidadBancaria, unknown>[]>(() => [
    {
      accessorKey: "nombre",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nombre" />,
      cell: ({ row }) => <span className="font-medium">{row.getValue("nombre")}</span>,
      enableHiding: false,
    },
    {
      accessorKey: "sucursal_banco",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Sucursal Banco" />,
      cell: ({ row }) => {
        const val = row.getValue("sucursal_banco") as string;
        return val ? <span className="text-sm text-muted-foreground">{val}</span> : <span className="text-xs text-muted-foreground/50">-</span>;
      },
    },
    {
      accessorKey: "cbu",
      header: ({ column }) => <DataTableColumnHeader column={column} title="CBU" />,
      cell: ({ row }) => {
        const val = row.getValue("cbu") as string;
        return val ? <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs">{val}</code> : <span className="text-xs text-muted-foreground/50">-</span>;
      },
    },
    {
      accessorKey: "alias",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Alias" />,
      cell: ({ row }) => {
        const val = row.getValue("alias") as string;
        return val ? <span className="text-sm text-muted-foreground">{val}</span> : <span className="text-xs text-muted-foreground/50">-</span>;
      },
    },
    {
      id: "actions",
      header: () => <span className="text-xs font-semibold uppercase tracking-wider">Acciones</span>,
      cell: ({ row }) => {
        const eb = row.original;
        const actions: RowAction[] = [
          { label: "Editar", icon: <Pencil className="h-4 w-4" />, onClick: () => handleOpenEdit(eb) },
          { label: "Eliminar", icon: <Trash2 className="h-4 w-4" />, onClick: () => setDeleteId(eb.id), variant: "destructive", separator: true },
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
      <div className="eb-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Entidades Bancarias</h1>
          <p className="text-sm text-muted-foreground">Gestiona las cuentas y entidades bancarias</p>
        </div>
        <Button className="shadow-sm" onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Entidad
        </Button>
      </div>

      {meta && (
        <div className="eb-summary flex items-center gap-3 rounded-xl border border-border/50 bg-gradient-to-r from-[var(--accent)]/5 to-transparent px-5 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
            <Landmark className="h-4 w-4" />
          </div>
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{meta.total}</span> entidades bancarias
          </span>
        </div>
      )}

      <DataTable columns={columns} data={entidades} page={page} pageSize={20} totalPages={meta?.totalPages || 1} totalItems={meta?.total} onPageChange={setPage} searchKey="nombre" searchPlaceholder="Buscar por nombre..." isLoading={isLoading} emptyIllustration={<EmptyGeneric className="w-full h-full" />} emptyMessage="No se encontraron entidades bancarias" emptyDescription="Agrega una entidad bancaria." emptyAction={{ label: "Nueva Entidad", onClick: handleOpenCreate }} />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Editar Entidad Bancaria" : "Nueva Entidad Bancaria"}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField control={form.control} name="nombre" render={({ field }) => (
                <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input placeholder="Ej: Banco Nacion" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="sucursal_banco" render={({ field }) => (
                  <FormItem><FormLabel>Sucursal del Banco</FormLabel><FormControl><Input placeholder="Ej: Centro" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="numero_cuenta" render={({ field }) => (
                  <FormItem><FormLabel>Numero de Cuenta</FormLabel><FormControl><Input placeholder="Ej: 1234567890" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="cbu" render={({ field }) => (
                  <FormItem><FormLabel>CBU</FormLabel><FormControl><Input placeholder="22 digitos" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="alias" render={({ field }) => (
                  <FormItem><FormLabel>Alias</FormLabel><FormControl><Input placeholder="Ej: mi.alias.banco" {...field} /></FormControl><FormMessage /></FormItem>
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
          <AlertDialogHeader><AlertDialogTitle>Eliminar entidad bancaria</AlertDialogTitle><AlertDialogDescription>Esta accion no se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) { deleteMutation.mutate(deleteId); setDeleteId(null); } }}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

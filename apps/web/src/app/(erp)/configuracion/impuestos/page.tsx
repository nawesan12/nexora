"use client";

import { useState, useMemo, useRef, useLayoutEffect } from "react";
import {
  useConfigImpuestos,
  useCreateConfigImpuesto,
  useUpdateConfigImpuesto,
  useDeleteConfigImpuesto,
} from "@/hooks/queries/use-orders";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { configuracionImpuestoSchema, type ConfiguracionImpuestoInput } from "@pronto/shared/schemas";
import type { ConfiguracionImpuesto } from "@pronto/shared/types";
import type { ColumnDef } from "@tanstack/react-table";
import {
  DataTable,
  DataTableColumnHeader,
  DataTableRowActions,
  type RowAction,
} from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { Plus, Pencil, Trash2, Calculator } from "lucide-react";
import { EmptyGeneric } from "@/components/illustrations";
import gsap from "gsap";

const TIPO_LABELS: Record<string, string> = {
  IVA: "IVA",
  IIBB: "IIBB",
  PERCEPCION_IVA: "Percepcion IVA",
  PERCEPCION_IIBB: "Percepcion IIBB",
  OTRO: "Otro",
};

export default function ImpuestosPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useConfigImpuestos();
  const createMutation = useCreateConfigImpuesto();
  const updateMutation = useUpdateConfigImpuesto();
  const deleteMutation = useDeleteConfigImpuesto();

  const impuestos = (data as ConfiguracionImpuesto[] | undefined) || [];

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<ConfiguracionImpuestoInput>({
    resolver: zodResolver(configuracionImpuestoSchema),
    defaultValues: { nombre: "", tipo: "IVA", porcentaje: 0, aplicar_por_defecto: false },
  });

  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".impuestos-header", { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" });
      gsap.fromTo(".impuestos-summary", { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.15 });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    form.reset({ nombre: "", tipo: "IVA", porcentaje: 0, aplicar_por_defecto: false });
    setDialogOpen(true);
  };

  const handleOpenEdit = (imp: ConfiguracionImpuesto) => {
    setEditingId(imp.id);
    form.reset({
      nombre: imp.nombre,
      tipo: imp.tipo as ConfiguracionImpuestoInput["tipo"],
      porcentaje: imp.porcentaje,
      aplicar_por_defecto: imp.aplicar_por_defecto,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (data: ConfiguracionImpuestoInput) => {
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

  const columns = useMemo<ColumnDef<ConfiguracionImpuesto, unknown>[]>(
    () => [
      {
        accessorKey: "nombre",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nombre" />,
        cell: ({ row }) => <span className="font-medium">{row.getValue("nombre")}</span>,
        enableHiding: false,
      },
      {
        accessorKey: "tipo",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo" />,
        cell: ({ row }) => {
          const tipo = row.getValue("tipo") as string;
          return <Badge variant="outline" className="text-xs">{TIPO_LABELS[tipo] || tipo}</Badge>;
        },
      },
      {
        accessorKey: "porcentaje",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Porcentaje" className="justify-end" />,
        cell: ({ row }) => <div className="text-right tabular-nums font-medium">{row.getValue("porcentaje")}%</div>,
      },
      {
        accessorKey: "aplicar_por_defecto",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Por defecto" />,
        cell: ({ row }) => (
          <Badge variant={row.getValue("aplicar_por_defecto") ? "default" : "secondary"} className="text-xs">
            {row.getValue("aplicar_por_defecto") ? "Si" : "No"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: () => <span className="text-xs font-semibold uppercase tracking-wider">Acciones</span>,
        cell: ({ row }) => {
          const imp = row.original;
          const actions: RowAction[] = [
            { label: "Editar", icon: <Pencil className="h-4 w-4" />, onClick: () => handleOpenEdit(imp) },
            { label: "Eliminar", icon: <Trash2 className="h-4 w-4" />, onClick: () => setDeleteId(imp.id), variant: "destructive", separator: true },
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
      <div className="impuestos-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Impuestos</h1>
          <p className="text-sm text-muted-foreground">Configura los impuestos aplicables a pedidos y facturas</p>
        </div>
        <Button className="shadow-sm" onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Impuesto
        </Button>
      </div>

      {impuestos.length > 0 && (
        <div className="impuestos-summary flex items-center gap-3 rounded-xl border border-border/50 bg-gradient-to-r from-[var(--accent)]/5 to-transparent px-5 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
            <Calculator className="h-4 w-4" />
          </div>
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{impuestos.length}</span>
            {" impuestos configurados"}
          </span>
        </div>
      )}

      <DataTable
        columns={columns}
        data={impuestos}
        page={page}
        pageSize={50}
        totalPages={1}
        totalItems={impuestos.length}
        onPageChange={setPage}
        searchKey="nombre"
        searchPlaceholder="Buscar por nombre..."
        isLoading={isLoading}
        emptyIllustration={<EmptyGeneric className="w-full h-full" />}
        emptyMessage="No se encontraron impuestos"
        emptyDescription="Configura un impuesto para comenzar."
        emptyAction={{ label: "Nuevo Impuesto", onClick: handleOpenCreate }}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Impuesto" : "Nuevo Impuesto"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField control={form.control} name="nombre" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl><Input placeholder="Ej: IVA 21%" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="tipo" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {Object.entries(TIPO_LABELS).map(([val, label]) => (
                          <SelectItem key={val} value={val}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="porcentaje" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Porcentaje (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="21" {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="aplicar_por_defecto" render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Aplicar por defecto</FormLabel>
                    <p className="text-xs text-muted-foreground">Se agregara automaticamente a nuevos pedidos</p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
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
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar impuesto</AlertDialogTitle>
            <AlertDialogDescription>Esta accion no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) { deleteMutation.mutate(deleteId); setDeleteId(null); } }}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

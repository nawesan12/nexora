"use client";

import { useState, useRef, useLayoutEffect } from "react";
import {
  useConversions,
  useCreateConversion,
  useUpdateConversion,
  useDeleteConversion,
} from "@/hooks/queries/use-conversions";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { conversionSchema, type ConversionInput } from "@pronto/shared/schemas";
import type { ConversionUnidad } from "@pronto/shared/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, ArrowLeftRight } from "lucide-react";
import { EmptyGeneric } from "@/components/illustrations";
import gsap from "gsap";

const UNITS = ["KG", "UNIDAD", "LITRO", "METRO", "CAJA", "BOLSA", "PACK"] as const;

const unitLabels: Record<string, string> = {
  KG: "Kilogramo",
  UNIDAD: "Unidad",
  LITRO: "Litro",
  METRO: "Metro",
  CAJA: "Caja",
  BOLSA: "Bolsa",
  PACK: "Pack",
};

export default function ConversionesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useConversions({ page, pageSize: 50 });
  const createMutation = useCreateConversion();
  const updateMutation = useUpdateConversion();
  const deleteMutation = useDeleteConversion();

  const conversions = data?.data || [];
  const meta = data?.meta;

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ConversionUnidad | null>(null);

  const form = useForm<ConversionInput>({
    resolver: zodResolver(conversionSchema),
    defaultValues: { from_unit: "KG", to_unit: "UNIDAD", factor: 1 },
  });

  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (containerRef.current) {
      gsap.from(containerRef.current, { opacity: 0, y: 20, duration: 0.4 });
    }
  }, []);

  function openCreate() {
    setEditingItem(null);
    form.reset({ from_unit: "KG", to_unit: "UNIDAD", factor: 1 });
    setDialogOpen(true);
  }

  function openEdit(item: ConversionUnidad) {
    setEditingItem(item);
    form.reset({
      from_unit: item.from_unit as ConversionInput["from_unit"],
      to_unit: item.to_unit as ConversionInput["to_unit"],
      factor: item.factor,
    });
    setDialogOpen(true);
  }

  async function onSubmit(values: ConversionInput) {
    if (editingItem) {
      await updateMutation.mutateAsync({ id: editingItem.id, factor: values.factor });
    } else {
      await createMutation.mutateAsync(values);
    }
    setDialogOpen(false);
    form.reset();
  }

  async function onDelete() {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
      setDeleteId(null);
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Conversiones de Unidad</h1>
          <p className="text-muted-foreground">
            Configura factores de conversion entre unidades de medida.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Conversion
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : conversions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <EmptyGeneric className="mb-4 h-32 w-32 opacity-60" />
          <h3 className="text-lg font-medium">Sin conversiones</h3>
          <p className="text-sm text-muted-foreground">
            Agrega tu primera conversion de unidad para comenzar.
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unidad Origen</TableHead>
                <TableHead className="text-center">
                  <ArrowLeftRight className="mx-auto h-4 w-4" />
                </TableHead>
                <TableHead>Unidad Destino</TableHead>
                <TableHead className="text-right">Factor</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conversions.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Badge variant="outline">{c.from_unit}</Badge>
                    <span className="ml-2 text-sm text-muted-foreground">
                      {unitLabels[c.from_unit] || c.from_unit}
                    </span>
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">→</TableCell>
                  <TableCell>
                    <Badge variant="outline">{c.to_unit}</Badge>
                    <span className="ml-2 text-sm text-muted-foreground">
                      {unitLabels[c.to_unit] || c.to_unit}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium">{c.factor}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(c.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Pagina {meta.page} de {meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </Button>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Editar Conversion" : "Nueva Conversion"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="from_unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidad Origen</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!!editingItem}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar unidad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {UNITS.map((u) => (
                          <SelectItem key={u} value={u}>
                            {u} - {unitLabels[u]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="to_unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidad Destino</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!!editingItem}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar unidad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {UNITS.map((u) => (
                          <SelectItem key={u} value={u}>
                            {u} - {unitLabels[u]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="factor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Factor de Conversion</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        min="0.000001"
                        placeholder="Ej: 0.5"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                    {form.watch("from_unit") && form.watch("to_unit") && field.value > 0 && (
                      <p className="text-xs text-muted-foreground">
                        1 {form.watch("from_unit")} = {field.value} {form.watch("to_unit")}
                      </p>
                    )}
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Guardando..." : editingItem ? "Actualizar" : "Crear"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar conversion</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. La conversion sera eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

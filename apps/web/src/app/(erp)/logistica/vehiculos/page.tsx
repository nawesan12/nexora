"use client";

import { useState, useMemo, useRef, useLayoutEffect } from "react";
import {
  useVehiculos,
  useCreateVehiculo,
  useUpdateVehiculo,
  useDeleteVehiculo,
} from "@/hooks/queries/use-logistics";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { vehiculoSchema, type VehiculoInput } from "@nexora/shared/schemas";
import type { Vehiculo } from "@nexora/shared/types";
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
  Truck,
} from "lucide-react";
import { EmptyGeneric } from "@/components/illustrations";
import gsap from "gsap";

export default function VehiculosPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useVehiculos({ page, pageSize: 20 });
  const createMutation = useCreateVehiculo();
  const updateMutation = useUpdateVehiculo();
  const deleteMutation = useDeleteVehiculo();

  const vehiculos = data?.data || [];
  const meta = data?.meta;

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<VehiculoInput>({
    resolver: zodResolver(vehiculoSchema),
    defaultValues: {
      marca: "",
      modelo: "",
      patente: "",
      anio: 0,
      capacidad_kg: 0,
      capacidad_volumen: 0,
      sucursal_id: "",
    },
  });

  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".vehiculos-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      );
      gsap.fromTo(
        ".vehiculos-summary",
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.15 },
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    form.reset({
      marca: "",
      modelo: "",
      patente: "",
      anio: 0,
      capacidad_kg: 0,
      capacidad_volumen: 0,
      sucursal_id: "",
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (v: Vehiculo) => {
    setEditingId(v.id);
    form.reset({
      marca: v.marca,
      modelo: v.modelo,
      patente: v.patente,
      anio: v.anio || 0,
      capacidad_kg: v.capacidad_kg || 0,
      capacidad_volumen: v.capacidad_volumen || 0,
      sucursal_id: v.sucursal_id || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = (data: VehiculoInput) => {
    const payload = {
      ...data,
      anio: data.anio || undefined,
      capacidad_kg: data.capacidad_kg || undefined,
      capacidad_volumen: data.capacidad_volumen || undefined,
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

  const columns = useMemo<ColumnDef<Vehiculo, unknown>[]>(
    () => [
      {
        accessorKey: "patente",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Patente" />
        ),
        cell: ({ row }) => (
          <Badge variant="outline" className="font-mono text-xs">
            {row.getValue("patente")}
          </Badge>
        ),
        enableHiding: false,
      },
      {
        accessorKey: "marca",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Marca" />
        ),
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {row.getValue("marca")}
          </span>
        ),
      },
      {
        accessorKey: "modelo",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Modelo" />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.getValue("modelo")}
          </span>
        ),
      },
      {
        accessorKey: "anio",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Ano" />
        ),
        cell: ({ row }) => {
          const anio = row.getValue("anio") as number;
          return anio ? (
            <span className="text-sm text-muted-foreground">{anio}</span>
          ) : (
            <span className="text-xs text-muted-foreground/50">-</span>
          );
        },
      },
      {
        accessorKey: "capacidad_kg",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Capacidad Kg" />
        ),
        cell: ({ row }) => {
          const cap = row.getValue("capacidad_kg") as number;
          return cap ? (
            <span className="text-sm tabular-nums text-muted-foreground">
              {cap.toLocaleString("es-AR")} kg
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
          const v = row.original;
          const actions: RowAction[] = [
            {
              label: "Editar",
              icon: <Pencil className="h-4 w-4" />,
              onClick: () => handleOpenEdit(v),
            },
            {
              label: "Eliminar",
              icon: <Trash2 className="h-4 w-4" />,
              onClick: () => setDeleteId(v.id),
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
      <div className="vehiculos-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Vehiculos
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestiona la flota de vehiculos
          </p>
        </div>
        <Button className="shadow-sm" onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Vehiculo
        </Button>
      </div>

      {/* Summary Bar */}
      {meta && (
        <div className="vehiculos-summary flex items-center gap-3 rounded-xl border border-border/50 bg-gradient-to-r from-[var(--accent)]/5 to-transparent px-5 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
            <Truck className="h-4 w-4" />
          </div>
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{meta.total}</span>
            {" vehiculos en total"}
          </span>
        </div>
      )}

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={vehiculos}
        page={page}
        pageSize={20}
        totalPages={meta?.totalPages || 1}
        totalItems={meta?.total}
        onPageChange={setPage}
        searchKey="patente"
        searchPlaceholder="Buscar por patente..."
        isLoading={isLoading}
        emptyIllustration={<EmptyGeneric className="w-full h-full" />}
        emptyMessage="No se encontraron vehiculos"
        emptyDescription="Agrega un vehiculo para comenzar."
        emptyAction={{
          label: "Nuevo Vehiculo",
          onClick: handleOpenCreate,
        }}
        toolbarActions={
          <Button size="sm" className="h-9" onClick={handleOpenCreate}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Nuevo
          </Button>
        }
      />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Vehiculo" : "Nuevo Vehiculo"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="marca"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marca</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Ford" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="modelo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modelo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Transit" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="patente"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Patente</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: AB123CD" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="anio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ano</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Ej: 2024"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? Number(e.target.value) : 0,
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="capacidad_kg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacidad (Kg)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Ej: 3500"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? Number(e.target.value) : 0,
                            )
                          }
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
              </div>
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
            <AlertDialogTitle>Eliminar vehiculo</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. El vehiculo sera eliminado.
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

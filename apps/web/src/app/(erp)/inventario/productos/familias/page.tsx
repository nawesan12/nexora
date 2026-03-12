"use client";

import { useState, useRef, useLayoutEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  familiaProductoSchema,
  categoriaProductoSchema,
  type FamiliaProductoInput,
  type CategoriaProductoInput,
} from "@nexora/shared/schemas";
import {
  useFamilias,
  useCreateFamilia,
  useUpdateFamilia,
  useDeleteFamilia,
  useCategoriasByFamilia,
  useCreateCategoria,
  useUpdateCategoria,
  useDeleteCategoria,
} from "@/hooks/queries/use-products";
import { useUserStore } from "@/store/user-store";
import { hasPermission } from "@/lib/permissions";
import type { FamiliaProducto, CategoriaProducto } from "@nexora/shared/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Plus, Pencil, Trash2, FolderOpen, Tag, Layers } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { EmptyGeneric } from "@/components/illustrations";
import { cn } from "@/lib/utils";
import gsap from "gsap";

export default function FamiliasCategoriasPage() {
  const user = useUserStore((s) => s.user);
  const permissions = user?.permissions ?? [];
  const canManage = hasPermission(permissions, "products:manage");

  const { data: familiasData } = useFamilias(1, 100);
  const familias = familiasData?.data || [];

  const [selectedFamiliaId, setSelectedFamiliaId] = useState<string>("");
  const { data: categorias } = useCategoriasByFamilia(selectedFamiliaId);

  // Familia dialog state
  const [familiaDialog, setFamiliaDialog] = useState(false);
  const [editingFamilia, setEditingFamilia] = useState<FamiliaProducto | null>(
    null,
  );
  const [deleteFamiliaId, setDeleteFamiliaId] = useState<string | null>(null);

  // Categoria dialog state
  const [categoriaDialog, setCategoriaDialog] = useState(false);
  const [editingCategoria, setEditingCategoria] =
    useState<CategoriaProducto | null>(null);
  const [deleteCategoriaId, setDeleteCategoriaId] = useState<string | null>(
    null,
  );

  const createFamilia = useCreateFamilia();
  const updateFamilia = useUpdateFamilia();
  const deleteFamiliaMut = useDeleteFamilia();

  const createCategoria = useCreateCategoria();
  const updateCategoria = useUpdateCategoria();
  const deleteCategoriaMut = useDeleteCategoria();

  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".fam-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      );

      gsap.fromTo(
        ".fam-card",
        { y: 15, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.4,
          stagger: 0.1,
          ease: "power2.out",
          delay: 0.2,
        },
      );
    }, containerRef);

    return () => ctx.revert();
  }, [familias, categorias]);

  return (
    <div ref={containerRef} className="space-y-5">
      {/* Header */}
      <div className="fam-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Familias y Categorias
          </h1>
          <p className="text-sm text-muted-foreground">
            Organiza tus productos en familias y categorias
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Familias */}
        <Card className="fam-card border-0 shadow-sm">
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Familias</h3>
                <p className="text-xs text-muted-foreground">
                  Grupos principales de productos
                </p>
              </div>
            </div>
            {canManage && (
              <Button
                size="sm"
                variant="outline"
                className="shadow-sm"
                onClick={() => {
                  setEditingFamilia(null);
                  setFamiliaDialog(true);
                }}
              >
                <Plus className="mr-1 h-4 w-4" />
                Nueva
              </Button>
            )}
          </div>
          <CardContent className="pt-0">
            {familias.length === 0 ? (
              <EmptyState
                illustration={<EmptyGeneric className="w-full h-full" />}
                title="No hay familias creadas"
                size="sm"
              />
            ) : (
              <div className="space-y-2">
                {familias.map((f) => (
                  <div
                    key={f.id}
                    className={cn(
                      "flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-all hover:bg-muted/30",
                      selectedFamiliaId === f.id
                        ? "border-[var(--accent)]/40 bg-[var(--accent)]/5"
                        : "border-border/50",
                    )}
                    onClick={() => setSelectedFamiliaId(f.id)}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg",
                          selectedFamiliaId === f.id
                            ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        <FolderOpen className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{f.nombre}</p>
                        {f.descripcion && (
                          <p className="text-xs text-muted-foreground">
                            {f.descripcion}
                          </p>
                        )}
                      </div>
                    </div>
                    {canManage && (
                      <div className="flex gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingFamilia(f);
                            setFamiliaDialog(true);
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteFamiliaId(f.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Categorias */}
        <Card className="fam-card border-0 shadow-sm">
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Tag className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Categorias</h3>
                <p className="text-xs text-muted-foreground">
                  {selectedFamiliaId
                    ? `Categorias de "${familias.find((f) => f.id === selectedFamiliaId)?.nombre}"`
                    : "Selecciona una familia para ver sus categorias"}
                </p>
              </div>
            </div>
            {canManage && selectedFamiliaId && (
              <Button
                size="sm"
                variant="outline"
                className="shadow-sm"
                onClick={() => {
                  setEditingCategoria(null);
                  setCategoriaDialog(true);
                }}
              >
                <Plus className="mr-1 h-4 w-4" />
                Nueva
              </Button>
            )}
          </div>
          <CardContent className="pt-0">
            {!selectedFamiliaId ? (
              <EmptyState
                illustration={<EmptyGeneric className="w-full h-full" />}
                title="Selecciona una familia del panel izquierdo"
                size="sm"
              />
            ) : !categorias || categorias.length === 0 ? (
              <EmptyState
                illustration={<EmptyGeneric className="w-full h-full" />}
                title="No hay categorias en esta familia"
                size="sm"
              />
            ) : (
              <div className="space-y-2">
                {categorias.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-lg border border-border/50 p-3 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <Tag className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{c.nombre}</p>
                        {c.descripcion && (
                          <p className="text-xs text-muted-foreground">
                            {c.descripcion}
                          </p>
                        )}
                      </div>
                    </div>
                    {canManage && (
                      <div className="flex gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setEditingCategoria(c);
                            setCategoriaDialog(true);
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteCategoriaId(c.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Familia Dialog */}
      <FamiliaDialog
        open={familiaDialog}
        onOpenChange={setFamiliaDialog}
        familia={editingFamilia}
        onSubmit={(data) => {
          if (editingFamilia) {
            updateFamilia.mutate(
              { id: editingFamilia.id, data },
              { onSuccess: () => setFamiliaDialog(false) },
            );
          } else {
            createFamilia.mutate(data, {
              onSuccess: () => setFamiliaDialog(false),
            });
          }
        }}
        isPending={createFamilia.isPending || updateFamilia.isPending}
      />

      {/* Categoria Dialog */}
      <CategoriaDialog
        open={categoriaDialog}
        onOpenChange={setCategoriaDialog}
        categoria={editingCategoria}
        familiaId={selectedFamiliaId}
        onSubmit={(data) => {
          if (editingCategoria) {
            updateCategoria.mutate(
              { id: editingCategoria.id, data },
              { onSuccess: () => setCategoriaDialog(false) },
            );
          } else {
            createCategoria.mutate(data, {
              onSuccess: () => setCategoriaDialog(false),
            });
          }
        }}
        isPending={createCategoria.isPending || updateCategoria.isPending}
      />

      {/* Delete Familia Confirm */}
      <AlertDialog
        open={!!deleteFamiliaId}
        onOpenChange={() => setDeleteFamiliaId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar familia</AlertDialogTitle>
            <AlertDialogDescription>
              Se desactivara esta familia y sus categorias asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteFamiliaId) {
                  deleteFamiliaMut.mutate(deleteFamiliaId);
                  if (selectedFamiliaId === deleteFamiliaId)
                    setSelectedFamiliaId("");
                  setDeleteFamiliaId(null);
                }
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Categoria Confirm */}
      <AlertDialog
        open={!!deleteCategoriaId}
        onOpenChange={() => setDeleteCategoriaId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar categoria</AlertDialogTitle>
            <AlertDialogDescription>
              Se desactivara esta categoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteCategoriaId) {
                  deleteCategoriaMut.mutate(deleteCategoriaId);
                  setDeleteCategoriaId(null);
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

function FamiliaDialog({
  open,
  onOpenChange,
  familia,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  familia: FamiliaProducto | null;
  onSubmit: (data: FamiliaProductoInput) => void;
  isPending: boolean;
}) {
  const form = useForm<FamiliaProductoInput>({
    resolver: zodResolver(familiaProductoSchema),
    defaultValues: {
      nombre: familia?.nombre || "",
      descripcion: familia?.descripcion || "",
    },
  });

  // Reset form when dialog opens with different data
  const prevFamilia = useState(familia)[0];
  if (prevFamilia !== familia) {
    form.reset({
      nombre: familia?.nombre || "",
      descripcion: familia?.descripcion || "",
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {familia ? "Editar Familia" : "Nueva Familia"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre de la familia" {...field} />
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
                    <Input placeholder="Descripcion opcional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function CategoriaDialog({
  open,
  onOpenChange,
  categoria,
  familiaId,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoria: CategoriaProducto | null;
  familiaId: string;
  onSubmit: (data: CategoriaProductoInput) => void;
  isPending: boolean;
}) {
  const form = useForm<CategoriaProductoInput>({
    resolver: zodResolver(categoriaProductoSchema),
    defaultValues: {
      nombre: categoria?.nombre || "",
      descripcion: categoria?.descripcion || "",
      familia_id: categoria?.familia_id || familiaId,
    },
  });

  const prevCategoria = useState(categoria)[0];
  if (prevCategoria !== categoria) {
    form.reset({
      nombre: categoria?.nombre || "",
      descripcion: categoria?.descripcion || "",
      familia_id: categoria?.familia_id || familiaId,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {categoria ? "Editar Categoria" : "Nueva Categoria"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre de la categoria" {...field} />
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
                    <Input placeholder="Descripcion opcional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

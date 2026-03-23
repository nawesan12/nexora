"use client";

import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { devolucionSchema, type DevolucionInput } from "@pronto/shared/schemas";
import { useCreateDevolucion } from "@/hooks/queries/use-devoluciones";
import { useClientes } from "@/hooks/queries/use-clients";
import { useBranches } from "@/hooks/queries/use-branches";
import { useProductos } from "@/hooks/queries/use-products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, PackageMinus, Loader2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

export default function NuevaDevolucionPage() {
  const router = useRouter();
  const createMutation = useCreateDevolucion();
  const { data: clientesData } = useClientes({ page: 1, pageSize: 200 });
  const { data: branchesData } = useBranches();
  const { data: productosData } = useProductos({ page: 1, pageSize: 200 });

  const clientes = clientesData?.data || [];
  const branches = branchesData?.data || [];
  const productos = productosData?.data || [];

  const form = useForm<DevolucionInput>({
    resolver: zodResolver(devolucionSchema),
    defaultValues: {
      pedido_id: "",
      cliente_id: "",
      sucursal_id: "",
      motivo: "",
      fecha: new Date().toISOString().split("T")[0],
      observaciones: "",
      items: [{ producto_id: "", cantidad: 1, motivo_item: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const onSubmit = form.handleSubmit((data) => {
    createMutation.mutate(data, {
      onSuccess: (result) => {
        const id = (result as unknown as Record<string, unknown>)?.id;
        router.push(id ? `/inventario/devoluciones/${id}` : "/inventario/devoluciones");
      },
    });
  });

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/inventario/devoluciones"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Devoluciones
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
            <PackageMinus className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Nueva Devolucion</h1>
            <p className="text-sm text-muted-foreground">Registra una devolucion de productos</p>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informacion General</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cliente_id">Cliente *</Label>
              <Select
                value={form.watch("cliente_id")}
                onValueChange={(v) => form.setValue("cliente_id", v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre} {c.apellido || ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.cliente_id && (
                <p className="text-xs text-destructive">{form.formState.errors.cliente_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sucursal_id">Sucursal *</Label>
              <Select
                value={form.watch("sucursal_id")}
                onValueChange={(v) => form.setValue("sucursal_id", v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar sucursal" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.sucursal_id && (
                <p className="text-xs text-destructive">{form.formState.errors.sucursal_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha *</Label>
              <Input type="date" {...form.register("fecha")} />
              {form.formState.errors.fecha && (
                <p className="text-xs text-destructive">{form.formState.errors.fecha.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pedido_id">Pedido (opcional)</Label>
              <Input placeholder="ID del pedido relacionado" {...form.register("pedido_id")} />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="motivo">Motivo *</Label>
              <Textarea
                placeholder="Motivo de la devolucion (min. 5 caracteres)"
                {...form.register("motivo")}
                rows={2}
              />
              {form.formState.errors.motivo && (
                <p className="text-xs text-destructive">{form.formState.errors.motivo.message}</p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                placeholder="Notas adicionales (opcional)"
                {...form.register("observaciones")}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Productos</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ producto_id: "", cantidad: 1, motivo_item: "" })}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Agregar Producto
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {form.formState.errors.items?.message && (
              <p className="text-xs text-destructive">{form.formState.errors.items.message}</p>
            )}

            {fields.map((field, index) => (
              <div key={field.id} className="space-y-3">
                {index > 0 && <Separator />}
                <div className="grid gap-3 sm:grid-cols-[1fr_100px_1fr_40px] items-end">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Producto *</Label>
                    <Select
                      value={form.watch(`items.${index}.producto_id`)}
                      onValueChange={(v) =>
                        form.setValue(`items.${index}.producto_id`, v, { shouldValidate: true })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar producto" />
                      </SelectTrigger>
                      <SelectContent>
                        {productos.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.codigo ? `[${p.codigo}] ` : ""}{p.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.items?.[index]?.producto_id && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.items[index]?.producto_id?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Cantidad *</Label>
                    <Input
                      type="number"
                      min={1}
                      {...form.register(`items.${index}.cantidad`, { valueAsNumber: true })}
                    />
                    {form.formState.errors.items?.[index]?.cantidad && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.items[index]?.cantidad?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Motivo del item</Label>
                    <Input
                      placeholder="Motivo especifico (opcional)"
                      {...form.register(`items.${index}.motivo_item`)}
                    />
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => fields.length > 1 && remove(index)}
                    disabled={fields.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear Devolucion
          </Button>
        </div>
      </form>
    </div>
  );
}

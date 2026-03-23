"use client";

import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  plantillaPedidoSchema,
  type PlantillaPedidoInput,
} from "@pronto/shared/schemas";
import { useCreatePlantilla } from "@/hooks/queries/use-plantillas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ClipboardList, Loader2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useUserStore } from "@/store/user-store";

export default function NuevaPlantillaPage() {
  const router = useRouter();
  const createMutation = useCreatePlantilla();
  const user = useUserStore((s) => s.user);
  const sucursales = user?.sucursales || [];

  const form = useForm<PlantillaPedidoInput>({
    resolver: zodResolver(plantillaPedidoSchema),
    defaultValues: {
      nombre: "",
      cliente_id: "",
      sucursal_id: user?.sucursal_actual?.id || sucursales[0]?.id || "",
      frecuencia_dias: 7,
      proximo_generacion: new Date().toISOString().split("T")[0],
      activa: true,
      items: [{ producto_id: "", cantidad: 1, precio: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const onSubmit = form.handleSubmit((data) => {
    createMutation.mutate(data, {
      onSuccess: () => router.push("/ventas/plantillas"),
    });
  });

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/ventas/plantillas"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Plantillas
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Nueva Plantilla
            </h1>
            <p className="text-sm text-muted-foreground">
              Crear una plantilla de pedido recurrente
            </p>
          </div>
        </div>
      </div>

      <Card className="max-w-2xl border-0 shadow-sm">
        <CardContent className="pt-6">
          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Datos de la Plantilla
              </h3>
              <Separator className="mt-2 mb-4" />
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    {...form.register("nombre")}
                    placeholder="Ej: Pedido semanal - Cliente A"
                  />
                  {form.formState.errors.nombre && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.nombre.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cliente_id">ID del Cliente</Label>
                  <Input
                    id="cliente_id"
                    {...form.register("cliente_id")}
                    placeholder="UUID del cliente"
                  />
                  {form.formState.errors.cliente_id && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.cliente_id.message}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Sucursal</Label>
                    <Select
                      value={form.watch("sucursal_id")}
                      onValueChange={(v) => form.setValue("sucursal_id", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar sucursal" />
                      </SelectTrigger>
                      <SelectContent>
                        {sucursales.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.sucursal_id && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.sucursal_id.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="frecuencia_dias">
                      Frecuencia (dias)
                    </Label>
                    <Input
                      id="frecuencia_dias"
                      type="number"
                      min={1}
                      {...form.register("frecuencia_dias", {
                        valueAsNumber: true,
                      })}
                    />
                    {form.formState.errors.frecuencia_dias && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.frecuencia_dias.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="proximo_generacion">
                      Proxima Generacion
                    </Label>
                    <Input
                      id="proximo_generacion"
                      type="date"
                      {...form.register("proximo_generacion")}
                    />
                    {form.formState.errors.proximo_generacion && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.proximo_generacion.message}
                      </p>
                    )}
                  </div>
                  <div className="flex items-end space-x-2 pb-1">
                    <Checkbox
                      id="activa"
                      checked={form.watch("activa")}
                      onCheckedChange={(v) =>
                        form.setValue("activa", v === true)
                      }
                    />
                    <Label htmlFor="activa" className="cursor-pointer">
                      Activa
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                  Productos
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({ producto_id: "", cantidad: 1, precio: 0 })
                  }
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Agregar
                </Button>
              </div>
              <Separator className="mt-2 mb-4" />
              {form.formState.errors.items?.message && (
                <p className="text-sm text-destructive mb-3">
                  {form.formState.errors.items.message}
                </p>
              )}
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid grid-cols-[1fr_80px_100px_40px] items-end gap-2 rounded-lg border border-border/50 p-3"
                  >
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">
                        Producto ID
                      </Label>
                      <Input
                        {...form.register(`items.${index}.producto_id`)}
                        placeholder="UUID del producto"
                        className="h-9 text-sm"
                      />
                      {form.formState.errors.items?.[index]?.producto_id && (
                        <p className="text-xs text-destructive">
                          {
                            form.formState.errors.items[index]?.producto_id
                              ?.message
                          }
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">
                        Cant.
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        {...form.register(`items.${index}.cantidad`, {
                          valueAsNumber: true,
                        })}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">
                        Precio
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        {...form.register(`items.${index}.precio`, {
                          valueAsNumber: true,
                        })}
                        className="h-9 text-sm"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground hover:text-destructive"
                      onClick={() => fields.length > 1 && remove(index)}
                      disabled={fields.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" type="button" asChild>
                <Link href="/ventas/plantillas">Cancelar</Link>
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Crear Plantilla
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

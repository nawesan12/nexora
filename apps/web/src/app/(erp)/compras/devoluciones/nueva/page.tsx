"use client";

import { useState, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateDevolucionProveedor } from "@/hooks/queries/use-devoluciones-proveedor";
import { useProveedores } from "@/hooks/queries/use-suppliers";
import { useUserStore } from "@/store/user-store";
import { useDebounce } from "@/hooks/use-debounce";
import {
  devolucionProveedorSchema,
  type DevolucionProveedorInput,
} from "@pronto/shared/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, PackageMinus, Plus, Trash2 } from "lucide-react";
import { ProductSearchCombobox } from "@/components/orders/product-search-combobox";
import gsap from "gsap";

export default function NuevaDevolucionProveedorPage() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const sucursalId = user?.sucursal_actual?.id || "";
  const createMutation = useCreateDevolucionProveedor();
  const containerRef = useRef<HTMLDivElement>(null);

  const [proveedorSearch, setProveedorSearch] = useState("");
  const proveedorDebounced = useDebounce(proveedorSearch, 300);
  const { data: proveedoresData } = useProveedores({
    search: proveedorDebounced || undefined,
    pageSize: 10,
  });
  const proveedores = proveedoresData?.data || [];

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DevolucionProveedorInput>({
    resolver: zodResolver(devolucionProveedorSchema),
    defaultValues: {
      proveedor_id: "",
      orden_compra_id: "",
      sucursal_id: sucursalId,
      motivo: "",
      fecha: new Date().toISOString().split("T")[0],
      observaciones: "",
      items: [{ producto_id: "", cantidad: 1, motivo_item: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".dp-form-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      );
      gsap.fromTo(
        ".dp-form-card",
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.1 },
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const onSubmit = async (data: DevolucionProveedorInput) => {
    try {
      await createMutation.mutateAsync(data);
      router.push("/compras/devoluciones");
    } catch {
      // handled by hook
    }
  };

  return (
    <div ref={containerRef} className="space-y-5">
      <div className="dp-form-header flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/compras/devoluciones">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Nueva Devolucion a Proveedor
          </h1>
          <p className="text-sm text-muted-foreground">
            Registrar una devolucion de mercaderia a un proveedor
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="dp-form-card space-y-5 max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <PackageMinus className="h-5 w-5 text-[var(--accent)]" />
                Datos de la Devolucion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Proveedor *</Label>
                  <Controller
                    control={control}
                    name="proveedor_id"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar proveedor" />
                        </SelectTrigger>
                        <SelectContent>
                          <div className="px-2 pb-2">
                            <Input
                              placeholder="Buscar proveedor..."
                              value={proveedorSearch}
                              onChange={(e) =>
                                setProveedorSearch(e.target.value)
                              }
                              className="h-8"
                            />
                          </div>
                          {proveedores.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.proveedor_id && (
                    <p className="text-xs text-destructive">
                      {errors.proveedor_id.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha">Fecha *</Label>
                  <Input
                    id="fecha"
                    type="date"
                    {...register("fecha")}
                  />
                  {errors.fecha && (
                    <p className="text-xs text-destructive">
                      {errors.fecha.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="motivo">Motivo *</Label>
                <Textarea
                  id="motivo"
                  placeholder="Motivo de la devolucion..."
                  {...register("motivo")}
                />
                {errors.motivo && (
                  <p className="text-xs text-destructive">
                    {errors.motivo.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea
                  id="observaciones"
                  placeholder="Notas adicionales..."
                  {...register("observaciones")}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Productos a devolver</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid gap-3 rounded-lg border border-border/50 p-3 sm:grid-cols-12"
                >
                  <div className="sm:col-span-5 space-y-1">
                    <Label className="text-xs">Producto *</Label>
                    <ProductSearchCombobox
                      onSelect={(product) => {
                        setValue(
                          `items.${index}.producto_id`,
                          product.id,
                        );
                      }}
                    />
                    <input
                      type="hidden"
                      {...register(`items.${index}.producto_id`)}
                    />
                    {errors.items?.[index]?.producto_id && (
                      <p className="text-xs text-destructive">
                        {errors.items[index].producto_id?.message}
                      </p>
                    )}
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-xs">Cantidad *</Label>
                    <Input
                      type="number"
                      min="1"
                      {...register(`items.${index}.cantidad`, {
                        valueAsNumber: true,
                      })}
                    />
                    {errors.items?.[index]?.cantidad && (
                      <p className="text-xs text-destructive">
                        {errors.items[index].cantidad?.message}
                      </p>
                    )}
                  </div>
                  <div className="sm:col-span-4 space-y-1">
                    <Label className="text-xs">Motivo item</Label>
                    <Input
                      placeholder="Motivo especifico..."
                      {...register(`items.${index}.motivo_item`)}
                    />
                  </div>
                  <div className="sm:col-span-1 flex items-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => {
                        if (fields.length > 1) remove(index);
                      }}
                      disabled={fields.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {errors.items?.root && (
                <p className="text-xs text-destructive">
                  {errors.items.root.message}
                </p>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({ producto_id: "", cantidad: 1, motivo_item: "" })
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar Producto
              </Button>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" asChild>
              <Link href="/compras/devoluciones">Cancelar</Link>
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || createMutation.isPending}
            >
              {createMutation.isPending
                ? "Guardando..."
                : "Crear Devolucion"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

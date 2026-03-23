"use client";

import { useState, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { useCreateConvenio } from "@/hooks/queries/use-convenios";
import { useProveedores } from "@/hooks/queries/use-suppliers";
import { useDebounce } from "@/hooks/use-debounce";
import { ProductSearchCombobox } from "@/components/orders/product-search-combobox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, FileText, Plus, Trash2 } from "lucide-react";
import gsap from "gsap";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n);
}

interface FormItem {
  producto_id: string;
  producto_nombre: string;
  precio_convenido: number;
  cantidad_minima: number;
  descuento_porcentaje: number;
}

interface ConvenioFormValues {
  proveedor_id: string;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
  items: FormItem[];
}

export default function NuevoConvenioPage() {
  const router = useRouter();
  const createMutation = useCreateConvenio();
  const containerRef = useRef<HTMLDivElement>(null);

  const [proveedorSearch, setProveedorSearch] = useState("");
  const proveedorDebounced = useDebounce(proveedorSearch, 300);
  const { data: proveedoresData } = useProveedores({
    search: proveedorDebounced || undefined,
    pageSize: 10,
  });
  const proveedores = proveedoresData?.data || [];

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<ConvenioFormValues>({
    defaultValues: {
      proveedor_id: "",
      nombre: "",
      fecha_inicio: new Date().toISOString().slice(0, 10),
      fecha_fin: "",
      activo: true,
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchItems = watch("items");

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".conv-form", { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: "power2.out" });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const onSubmit = async (values: ConvenioFormValues) => {
    await createMutation.mutateAsync({
      proveedor_id: values.proveedor_id,
      nombre: values.nombre,
      fecha_inicio: values.fecha_inicio,
      fecha_fin: values.fecha_fin || undefined,
      activo: values.activo,
      items: values.items.map((item) => ({
        producto_id: item.producto_id,
        precio_convenido: Number(item.precio_convenido),
        cantidad_minima: Number(item.cantidad_minima) || 1,
        descuento_porcentaje: Number(item.descuento_porcentaje) || 0,
      })),
    });
    router.push("/compras/convenios");
  };

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="conv-form flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/compras/convenios"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
            <FileText className="h-5 w-5 text-[var(--accent)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Nuevo Convenio</h1>
            <p className="text-sm text-muted-foreground">Acuerdo de precios con proveedor</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* General info */}
        <Card className="conv-form border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Informacion General</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Proveedor *</Label>
                <Controller
                  control={control}
                  name="proveedor_id"
                  rules={{ required: "Proveedor requerido" }}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar proveedor..." />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="p-2">
                          <Input
                            placeholder="Buscar..."
                            value={proveedorSearch}
                            onChange={(e) => setProveedorSearch(e.target.value)}
                            className="mb-2"
                          />
                        </div>
                        {proveedores.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.proveedor_id && <p className="text-xs text-destructive">{errors.proveedor_id.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Nombre del Convenio *</Label>
                <Input {...register("nombre", { required: "Nombre requerido" })} placeholder="Ej: Precios especiales Q2 2026" />
                {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Fecha Inicio *</Label>
                <Input type="date" {...register("fecha_inicio", { required: "Fecha requerida" })} />
              </div>
              <div className="space-y-2">
                <Label>Fecha Fin</Label>
                <Input type="date" {...register("fecha_fin")} />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Controller
                  control={control}
                  name="activo"
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
                <Label>Activo</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card className="conv-form border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Productos del Convenio</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ producto_id: "", producto_nombre: "", precio_convenido: 0, cantidad_minima: 1, descuento_porcentaje: 0 })}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Agregar Producto
            </Button>
          </CardHeader>
          <CardContent>
            {fields.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No hay productos. Agrega al menos un producto al convenio.
              </p>
            ) : (
              <div className="space-y-3">
                {/* Header */}
                <div className="grid grid-cols-[1fr_140px_100px_100px_40px] gap-3 text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
                  <span>Producto</span>
                  <span>Precio Convenido</span>
                  <span>Cant. Minima</span>
                  <span>Desc. %</span>
                  <span />
                </div>
                <Separator />
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-[1fr_140px_100px_100px_40px] gap-3 items-center">
                    <Controller
                      control={control}
                      name={`items.${index}.producto_id`}
                      rules={{ required: true }}
                      render={({ field: f }) => (
                        <ProductSearchCombobox
                          value={f.value}
                          onSelect={(prod) => {
                            f.onChange(prod.id);
                          }}
                        />
                      )}
                    />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...register(`items.${index}.precio_convenido`, { required: true, valueAsNumber: true })}
                    />
                    <Input
                      type="number"
                      min="1"
                      placeholder="1"
                      {...register(`items.${index}.cantidad_minima`, { valueAsNumber: true })}
                    />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="0"
                      {...register(`items.${index}.descuento_porcentaje`, { valueAsNumber: true })}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="conv-form flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/compras/convenios">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Guardando..." : "Crear Convenio"}
          </Button>
        </div>
      </form>
    </div>
  );
}

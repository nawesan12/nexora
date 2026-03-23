"use client";

import { useState, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateFacturaProveedor } from "@/hooks/queries/use-facturas-proveedor";
import { useProveedores } from "@/hooks/queries/use-suppliers";
import { useUserStore } from "@/store/user-store";
import { useDebounce } from "@/hooks/use-debounce";
import {
  facturaProveedorSchema,
  type FacturaProveedorInput,
} from "@pronto/shared/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(n);
}

const TIPOS = [
  { value: "FACTURA_A", label: "Factura A" },
  { value: "FACTURA_B", label: "Factura B" },
  { value: "FACTURA_C", label: "Factura C" },
  { value: "NOTA_CREDITO", label: "Nota de Credito" },
  { value: "NOTA_DEBITO", label: "Nota de Debito" },
];

export default function NuevaFacturaProveedorPage() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const sucursalId = user?.sucursal_actual?.id || "";
  const createMutation = useCreateFacturaProveedor();
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
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FacturaProveedorInput>({
    resolver: zodResolver(facturaProveedorSchema),
    defaultValues: {
      numero: "",
      proveedor_id: "",
      orden_compra_id: "",
      sucursal_id: sucursalId,
      tipo: "FACTURA_A",
      fecha_emision: new Date().toISOString().split("T")[0],
      fecha_vencimiento: "",
      observaciones: "",
      items: [
        { producto_id: "", descripcion: "", cantidad: 1, precio_unitario: 0 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchItems = watch("items");
  const subtotal = watchItems.reduce(
    (acc, item) => acc + (item.cantidad || 0) * (item.precio_unitario || 0),
    0,
  );

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".fp-form-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      );
      gsap.fromTo(
        ".fp-form-card",
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.1 },
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const onSubmit = async (data: FacturaProveedorInput) => {
    try {
      await createMutation.mutateAsync(data);
      router.push("/compras/facturas");
    } catch {
      // handled by hook
    }
  };

  return (
    <div ref={containerRef} className="space-y-5">
      <div className="fp-form-header flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/compras/facturas">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Nueva Factura de Proveedor
          </h1>
          <p className="text-sm text-muted-foreground">
            Registrar una factura recibida de un proveedor
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="fp-form-card grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-5">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-[var(--accent)]" />
                  Datos de la Factura
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="numero">Numero de Factura *</Label>
                    <Input
                      id="numero"
                      placeholder="Ej: 0001-00001234"
                      {...register("numero")}
                    />
                    {errors.numero && (
                      <p className="text-xs text-destructive">
                        {errors.numero.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo *</Label>
                    <Controller
                      control={control}
                      name="tipo"
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {TIPOS.map((t) => (
                              <SelectItem key={t.value} value={t.value}>
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.tipo && (
                      <p className="text-xs text-destructive">
                        {errors.tipo.message}
                      </p>
                    )}
                  </div>
                </div>

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
                    <Label htmlFor="sucursal_id">Sucursal *</Label>
                    <Input
                      id="sucursal_id"
                      {...register("sucursal_id")}
                      readOnly
                      className="bg-muted"
                    />
                    {errors.sucursal_id && (
                      <p className="text-xs text-destructive">
                        {errors.sucursal_id.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fecha_emision">Fecha Emision *</Label>
                    <Input
                      id="fecha_emision"
                      type="date"
                      {...register("fecha_emision")}
                    />
                    {errors.fecha_emision && (
                      <p className="text-xs text-destructive">
                        {errors.fecha_emision.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fecha_vencimiento">
                      Fecha Vencimiento
                    </Label>
                    <Input
                      id="fecha_vencimiento"
                      type="date"
                      {...register("fecha_vencimiento")}
                    />
                  </div>
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
                <CardTitle className="text-lg">Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid gap-3 rounded-lg border border-border/50 p-3 sm:grid-cols-12"
                  >
                    <div className="sm:col-span-5 space-y-1">
                      <Label className="text-xs">Descripcion *</Label>
                      <Input
                        placeholder="Descripcion del item"
                        {...register(`items.${index}.descripcion`)}
                      />
                      {errors.items?.[index]?.descripcion && (
                        <p className="text-xs text-destructive">
                          {errors.items[index].descripcion?.message}
                        </p>
                      )}
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <Label className="text-xs">Cantidad *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        {...register(`items.${index}.cantidad`, {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <Label className="text-xs">Precio Unit. *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        {...register(`items.${index}.precio_unitario`, {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <Label className="text-xs">Subtotal</Label>
                      <div className="flex h-9 items-center rounded-md border border-border bg-muted px-3 text-sm font-medium">
                        {formatCurrency(
                          (watchItems[index]?.cantidad || 0) *
                            (watchItems[index]?.precio_unitario || 0),
                        )}
                      </div>
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
                    append({
                      producto_id: "",
                      descripcion: "",
                      cantidad: 1,
                      precio_unitario: 0,
                    })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Item
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-5">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle className="text-lg">Resumen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-[var(--accent)]">
                    {formatCurrency(subtotal)}
                  </span>
                </div>

                <Separator />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || createMutation.isPending}
                >
                  {createMutation.isPending
                    ? "Guardando..."
                    : "Guardar Factura"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

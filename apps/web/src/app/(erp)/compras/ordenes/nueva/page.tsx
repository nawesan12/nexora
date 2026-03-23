"use client";

import { useState, useRef, useLayoutEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { useCreateOrdenCompra } from "@/hooks/queries/use-purchases";
import { useProveedores } from "@/hooks/queries/use-suppliers";
import { useDebounce } from "@/hooks/use-debounce";
import { useUserStore } from "@/store/user-store";
import type { OrdenCompraInput } from "@pronto/shared/schemas";
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
import {
  ArrowLeft,
  ClipboardList,
  Plus,
  Trash2,
} from "lucide-react";
import gsap from "gsap";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(n);
}

interface FormItem {
  producto_id: string;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: number;
  descuento_porcentaje: number;
}

interface FormImpuesto {
  tipo: string;
  nombre: string;
  porcentaje: number;
}

interface OrdenCompraFormValues {
  proveedor_id: string;
  condicion_pago: string;
  fecha_entrega_estimada: string;
  observaciones: string;
  descuento_porcentaje: number;
  items: FormItem[];
  impuestos: FormImpuesto[];
}

export default function NuevaOrdenCompraPage() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const sucursalId = user?.sucursal_actual?.id || "";
  const createMutation = useCreateOrdenCompra();
  const containerRef = useRef<HTMLDivElement>(null);

  const [proveedorSearch, setProveedorSearch] = useState("");
  const proveedorDebounced = useDebounce(proveedorSearch, 300);
  const { data: proveedoresData } = useProveedores({
    search: proveedorDebounced || undefined,
    pageSize: 10,
  });
  const proveedores = proveedoresData?.data || [];

  const form = useForm<OrdenCompraFormValues>({
    defaultValues: {
      proveedor_id: "",
      condicion_pago: "CONTADO",
      fecha_entrega_estimada: "",
      observaciones: "",
      descuento_porcentaje: 0,
      items: [
        {
          producto_id: "",
          producto_nombre: "",
          cantidad: 1,
          precio_unitario: 0,
          descuento_porcentaje: 0,
        },
      ],
      impuestos: [
        { tipo: "IVA", nombre: "IVA 21%", porcentaje: 21 },
      ],
    },
  });

  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const {
    fields: impuestoFields,
    append: appendImpuesto,
    remove: removeImpuesto,
  } = useFieldArray({
    control: form.control,
    name: "impuestos",
  });

  const watchedItems = form.watch("items");
  const watchedImpuestos = form.watch("impuestos");
  const watchedDescuento = form.watch("descuento_porcentaje");

  const calculations = useMemo(() => {
    const subtotal = watchedItems.reduce((sum, item) => {
      const lineSubtotal =
        item.cantidad *
        item.precio_unitario *
        (1 - (item.descuento_porcentaje || 0) / 100);
      return sum + lineSubtotal;
    }, 0);

    const descuentoPorcentaje = watchedDescuento || 0;
    const descuentoMonto = subtotal * (descuentoPorcentaje / 100);
    const baseImponible = subtotal - descuentoMonto;

    const impuestosCalculados = watchedImpuestos.map((imp) => ({
      tipo: imp.tipo,
      nombre: imp.nombre,
      porcentaje: imp.porcentaje,
      monto: baseImponible * ((imp.porcentaje || 0) / 100),
    }));

    const totalImpuestos = impuestosCalculados.reduce(
      (sum, imp) => sum + imp.monto,
      0,
    );

    const total = baseImponible + totalImpuestos;

    return {
      subtotal,
      descuentoPorcentaje,
      descuentoMonto,
      baseImponible,
      impuestosCalculados,
      totalImpuestos,
      total,
    };
  }, [watchedItems, watchedImpuestos, watchedDescuento]);

  const onSubmit = useCallback(
    (values: OrdenCompraFormValues) => {
      const payload: OrdenCompraInput = {
        proveedor_id: values.proveedor_id,
        sucursal_id: sucursalId,
        condicion_pago: values.condicion_pago as OrdenCompraInput["condicion_pago"],
        fecha_entrega_estimada: values.fecha_entrega_estimada || undefined,
        observaciones: values.observaciones || undefined,
        descuento_porcentaje: values.descuento_porcentaje || 0,
        items: values.items.map((item) => ({
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          descuento_porcentaje: item.descuento_porcentaje || 0,
        })),
        impuestos: values.impuestos.map((imp) => ({
          tipo: imp.tipo as OrdenCompraInput["impuestos"][number]["tipo"],
          nombre: imp.nombre,
          porcentaje: imp.porcentaje,
        })),
      };

      createMutation.mutate(payload, {
        onSuccess: (result) => {
          router.push(`/compras/ordenes/${result.id}`);
        },
      });
    },
    [createMutation, router, sucursalId],
  );

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".nueva-orden-header",
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" },
      );
      gsap.fromTo(
        ".nueva-orden-form",
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, delay: 0.15, ease: "power3.out" },
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="nueva-orden-header space-y-4">
        <Link
          href="/compras/ordenes"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Ordenes de Compra
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <ClipboardList className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Nueva Orden de Compra
            </h1>
            <p className="text-muted-foreground mt-0.5">
              Crea una nueva orden de compra a proveedor
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="nueva-orden-form"
      >
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Header section */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Datos generales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="proveedor_id">Proveedor</Label>
                    <Controller
                      control={form.control}
                      name="proveedor_id"
                      rules={{ required: "Selecciona un proveedor" }}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar proveedor" />
                          </SelectTrigger>
                          <SelectContent>
                            <div className="p-2">
                              <Input
                                placeholder="Buscar proveedor..."
                                value={proveedorSearch}
                                onChange={(e) =>
                                  setProveedorSearch(e.target.value)
                                }
                                className="h-8"
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => e.stopPropagation()}
                              />
                            </div>
                            {proveedores.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.nombre}
                              </SelectItem>
                            ))}
                            {proveedores.length === 0 && (
                              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                                No se encontraron proveedores
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {form.formState.errors.proveedor_id && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.proveedor_id.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="condicion_pago">Condicion de pago</Label>
                    <Controller
                      control={form.control}
                      name="condicion_pago"
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar condicion" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CONTADO">Contado</SelectItem>
                            <SelectItem value="CUENTA_CORRIENTE">
                              Cuenta Corriente
                            </SelectItem>
                            <SelectItem value="CHEQUE">Cheque</SelectItem>
                            <SelectItem value="TRANSFERENCIA">
                              Transferencia
                            </SelectItem>
                            <SelectItem value="OTRO">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fecha_entrega_estimada">
                      Fecha de entrega estimada
                    </Label>
                    <Input
                      type="date"
                      {...form.register("fecha_entrega_estimada")}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Products section */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold">
                  Productos ({itemFields.length})
                </CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    appendItem({
                      producto_id: "",
                      producto_nombre: "",
                      cantidad: 1,
                      precio_unitario: 0,
                      descuento_porcentaje: 0,
                    })
                  }
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Agregar
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Table header */}
                  <div className="hidden sm:grid sm:grid-cols-12 sm:gap-3 text-xs font-medium uppercase tracking-wider text-muted-foreground px-1">
                    <div className="col-span-4">Producto ID</div>
                    <div className="col-span-2 text-right">Cantidad</div>
                    <div className="col-span-2 text-right">Precio Unit.</div>
                    <div className="col-span-1 text-right">Dto%</div>
                    <div className="col-span-2 text-right">Subtotal</div>
                    <div className="col-span-1" />
                  </div>

                  {itemFields.map((field, index) => {
                    const item = watchedItems[index];
                    const lineSubtotal = item
                      ? item.cantidad *
                        item.precio_unitario *
                        (1 - (item.descuento_porcentaje || 0) / 100)
                      : 0;

                    return (
                      <div
                        key={field.id}
                        className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-center rounded-lg border border-border/50 p-3 sm:border-0 sm:p-0"
                      >
                        <div className="col-span-4">
                          <Label className="sm:hidden text-xs text-muted-foreground">
                            Producto ID
                          </Label>
                          <Input
                            placeholder="ID del producto"
                            {...form.register(`items.${index}.producto_id`, {
                              required: true,
                            })}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label className="sm:hidden text-xs text-muted-foreground">
                            Cantidad
                          </Label>
                          <Input
                            type="number"
                            min={1}
                            step={1}
                            className="text-right"
                            {...form.register(`items.${index}.cantidad`, {
                              valueAsNumber: true,
                              required: true,
                              min: 1,
                            })}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label className="sm:hidden text-xs text-muted-foreground">
                            Precio Unit.
                          </Label>
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            className="text-right"
                            {...form.register(
                              `items.${index}.precio_unitario`,
                              {
                                valueAsNumber: true,
                                required: true,
                                min: 0,
                              },
                            )}
                          />
                        </div>
                        <div className="col-span-1">
                          <Label className="sm:hidden text-xs text-muted-foreground">
                            Dto%
                          </Label>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            step={0.01}
                            className="text-right"
                            {...form.register(
                              `items.${index}.descuento_porcentaje`,
                              {
                                valueAsNumber: true,
                                min: 0,
                                max: 100,
                              },
                            )}
                          />
                        </div>
                        <div className="col-span-2 flex items-center justify-end">
                          <span className="font-medium tabular-nums text-sm">
                            {formatCurrency(lineSubtotal)}
                          </span>
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => removeItem(index)}
                            disabled={itemFields.length <= 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Taxes section */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold">
                  Impuestos ({impuestoFields.length})
                </CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    appendImpuesto({
                      tipo: "IVA",
                      nombre: "",
                      porcentaje: 0,
                    })
                  }
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Agregar
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {impuestoFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-center"
                    >
                      <div className="col-span-3">
                        <Controller
                          control={form.control}
                          name={`impuestos.${index}.tipo`}
                          render={({ field: selectField }) => (
                            <Select
                              value={selectField.value}
                              onValueChange={selectField.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Tipo" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="IVA">IVA</SelectItem>
                                <SelectItem value="IIBB">IIBB</SelectItem>
                                <SelectItem value="PERCEPCION_IVA">
                                  Percepcion IVA
                                </SelectItem>
                                <SelectItem value="PERCEPCION_IIBB">
                                  Percepcion IIBB
                                </SelectItem>
                                <SelectItem value="OTRO">Otro</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <div className="col-span-5">
                        <Input
                          placeholder="Nombre (ej: IVA 21%)"
                          {...form.register(`impuestos.${index}.nombre`, {
                            required: true,
                          })}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step={0.01}
                          placeholder="%"
                          className="text-right"
                          {...form.register(`impuestos.${index}.porcentaje`, {
                            valueAsNumber: true,
                            required: true,
                            min: 0,
                            max: 100,
                          })}
                        />
                      </div>
                      <div className="col-span-2 flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removeImpuesto(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Notes section */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Observaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Notas adicionales sobre la orden de compra..."
                  rows={4}
                  {...form.register("observaciones")}
                />
              </CardContent>
            </Card>
          </div>

          {/* Summary sidebar */}
          <div className="space-y-4">
            <Card className="border-0 shadow-sm sticky top-6">
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Resumen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">
                    {formatCurrency(calculations.subtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Descuento (%)</span>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    className="h-8 w-20 text-right text-sm"
                    {...form.register("descuento_porcentaje", {
                      valueAsNumber: true,
                      min: 0,
                      max: 100,
                    })}
                  />
                </div>

                {calculations.descuentoMonto > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Descuento ({calculations.descuentoPorcentaje}%)
                    </span>
                    <span className="tabular-nums text-red-600">
                      -{formatCurrency(calculations.descuentoMonto)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base imponible</span>
                  <span className="tabular-nums">
                    {formatCurrency(calculations.baseImponible)}
                  </span>
                </div>

                {calculations.impuestosCalculados.length > 0 && (
                  <>
                    <Separator />
                    {calculations.impuestosCalculados.map((imp, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="text-muted-foreground">
                          {imp.nombre || imp.tipo} ({imp.porcentaje}%)
                        </span>
                        <span className="tabular-nums">
                          {formatCurrency(imp.monto)}
                        </span>
                      </div>
                    ))}
                  </>
                )}

                <Separator />

                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Total impuestos
                  </span>
                  <span className="tabular-nums">
                    {formatCurrency(calculations.totalImpuestos)}
                  </span>
                </div>

                <Separator />

                <div className="flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span className="tabular-nums">
                    {formatCurrency(calculations.total)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending
                ? "Creando..."
                : "Crear Orden de Compra"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

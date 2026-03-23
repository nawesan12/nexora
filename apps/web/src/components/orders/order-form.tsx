"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { pedidoSchema, type PedidoInput } from "@pronto/shared/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus } from "lucide-react";
import { useClientes } from "@/hooks/queries/use-clients";
import { useDirecciones } from "@/hooks/queries/use-clients";
import { useConfigImpuestos } from "@/hooks/queries/use-orders";
import { useUserStore } from "@/store/user-store";
import { OrderItemRow } from "./order-item-row";
import { OrderTaxSection } from "./order-tax-section";
import { OrderSummary } from "./order-summary";
import type { PedidoDetail } from "@pronto/shared/types";

const CONDICION_PAGO_LABELS: Record<string, string> = {
  CONTADO: "Contado",
  CUENTA_CORRIENTE: "Cuenta Corriente",
  CHEQUE: "Cheque",
  TRANSFERENCIA: "Transferencia",
  OTRO: "Otro",
};

interface ItemState {
  producto_id: string;
  producto_nombre?: string;
  producto_unidad?: string;
  cantidad: number;
  precio_unitario: number;
  descuento_porcentaje: number;
}

import type { ImpuestoItemInput } from "@pronto/shared/schemas";

type TaxState = ImpuestoItemInput;

interface Props {
  defaultValues?: PedidoDetail;
  onSubmit: (data: PedidoInput) => void;
  isLoading: boolean;
}

export function OrderForm({ defaultValues, onSubmit, isLoading }: Props) {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const sucursalId = user?.sucursal_actual?.id || user?.sucursales?.[0]?.id || "";

  const { data: clientesData } = useClientes({ pageSize: 100 });
  const clientes = clientesData?.data || [];

  const { data: configImpuestos } = useConfigImpuestos();
  const defaultTaxes = configImpuestos?.filter((t) => t.aplicar_por_defecto) || [];

  const form = useForm<PedidoInput>({
    resolver: zodResolver(pedidoSchema),
    defaultValues: {
      cliente_id: defaultValues?.cliente_id || "",
      direccion_id: defaultValues?.direccion_id || "",
      sucursal_id: defaultValues?.sucursal_id || sucursalId,
      empleado_id: defaultValues?.empleado_id || "",
      condicion_pago: (defaultValues?.condicion_pago as PedidoInput["condicion_pago"]) || "CONTADO",
      fecha_entrega_estimada: defaultValues?.fecha_entrega_estimada || "",
      descuento_porcentaje: defaultValues?.descuento_porcentaje || 0,
      observaciones: defaultValues?.observaciones || "",
      observaciones_internas: defaultValues?.observaciones_internas || "",
      items: [],
      impuestos: [],
    },
  });

  const clienteId = form.watch("cliente_id");
  const { data: direccionesData } = useDirecciones(clienteId);
  const direcciones = direccionesData || [];

  const [items, setItems] = useState<ItemState[]>(
    defaultValues?.items?.map((i) => ({
      producto_id: i.producto_id,
      producto_nombre: i.producto_nombre,
      producto_unidad: i.producto_unidad,
      cantidad: i.cantidad,
      precio_unitario: i.precio_unitario,
      descuento_porcentaje: i.descuento_porcentaje,
    })) || [],
  );

  const [taxes, setTaxes] = useState<TaxState[]>(
    defaultValues?.impuestos?.map((i) => ({
      tipo: i.tipo as TaxState["tipo"],
      nombre: i.nombre,
      porcentaje: i.porcentaje,
    })) ||
      defaultTaxes.map((t) => ({
        tipo: t.tipo as TaxState["tipo"],
        nombre: t.nombre,
        porcentaje: t.porcentaje,
      })),
  );

  const descuentoPorcentaje = form.watch("descuento_porcentaje") || 0;

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => {
      const lineTotal = item.cantidad * item.precio_unitario;
      const lineDiscount = lineTotal * (item.descuento_porcentaje / 100);
      return sum + (lineTotal - lineDiscount);
    }, 0);
    const descuentoMonto = subtotal * (descuentoPorcentaje / 100);
    const baseImponible = subtotal - descuentoMonto;
    const impuestos = taxes.map((t) => ({
      nombre: t.nombre,
      porcentaje: t.porcentaje,
      monto: baseImponible * (t.porcentaje / 100),
    }));
    const totalImpuestos = impuestos.reduce((sum, i) => sum + i.monto, 0);
    const total = baseImponible + totalImpuestos;
    return { subtotal, descuentoMonto, baseImponible, impuestos, totalImpuestos, total };
  }, [items, taxes, descuentoPorcentaje]);

  const addItem = () => {
    setItems([
      ...items,
      { producto_id: "", cantidad: 1, precio_unitario: 0, descuento_porcentaje: 0 },
    ]);
  };

  const updateItem = useCallback((index: number, data: Partial<ItemState>) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...data };
      return updated;
    });
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit({
      ...data,
      items: items.map((i) => ({
        producto_id: i.producto_id,
        cantidad: i.cantidad,
        precio_unitario: i.precio_unitario,
        descuento_porcentaje: i.descuento_porcentaje,
      })),
      impuestos: taxes,
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Header */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Datos del pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="cliente_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cliente</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar cliente" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clientes.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {[c.apellido, c.nombre].filter(Boolean).join(", ") || c.nombre}
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
                    name="direccion_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dirección de entrega</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ""}
                          disabled={!clienteId}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar dirección" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {direcciones.map((d) => (
                              <SelectItem key={d.id} value={d.id}>
                                {d.calle}
                                {d.numero ? ` ${d.numero}` : ""}
                                {d.ciudad ? `, ${d.ciudad}` : ""}
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
                    name="condicion_pago"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Condición de pago</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(CONDICION_PAGO_LABELS).map(([v, l]) => (
                              <SelectItem key={v} value={v}>
                                {l}
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
                    name="fecha_entrega_estimada"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha entrega estimada</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="descuento_porcentaje"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descuento general (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step="0.01"
                          {...field}
                          className="max-w-[200px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Items */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Productos</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="mr-1 h-3 w-3" />
                  Agregar
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {items.length > 0 && (
                  <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground">
                    <div className="col-span-4">Producto</div>
                    <div className="col-span-2">Cantidad</div>
                    <div className="col-span-2">Precio</div>
                    <div className="col-span-1">Dto%</div>
                    <div className="col-span-2 text-right">Subtotal</div>
                    <div className="col-span-1" />
                  </div>
                )}
                {items.map((item, i) => (
                  <OrderItemRow
                    key={i}
                    item={item}
                    index={i}
                    onChange={updateItem}
                    onRemove={removeItem}
                  />
                ))}
                {items.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Agregue productos al pedido
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Taxes */}
            <Card>
              <CardContent className="pt-6">
                <OrderTaxSection taxes={taxes} onChange={setTaxes} />
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="observaciones"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observaciones (visibles al cliente)</FormLabel>
                      <FormControl>
                        <Textarea rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="observaciones_internas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observaciones internas</FormLabel>
                      <FormControl>
                        <Textarea rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Summary sidebar */}
          <div className="space-y-4">
            <OrderSummary
              subtotal={totals.subtotal}
              descuentoPorcentaje={descuentoPorcentaje}
              descuentoMonto={totals.descuentoMonto}
              baseImponible={totals.baseImponible}
              impuestos={totals.impuestos}
              totalImpuestos={totals.totalImpuestos}
              total={totals.total}
            />

            <div className="flex flex-col gap-2">
              <Button type="submit" disabled={isLoading || items.length === 0}>
                {isLoading
                  ? "Guardando..."
                  : defaultValues
                    ? "Actualizar pedido"
                    : "Crear pedido"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/ventas/pedidos")}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}

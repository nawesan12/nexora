"use client";

import { useState, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { repartoSchema, type RepartoInput } from "@nexora/shared/schemas";
import { useCreateReparto } from "@/hooks/queries/use-logistics";
import { useVehiculos, useZonas } from "@/hooks/queries/use-logistics";
import { useEmpleados } from "@/hooks/queries/use-employees";
import { usePedidos } from "@/hooks/queries/use-orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { ArrowLeft, Truck, Package } from "lucide-react";
import gsap from "gsap";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(n);
}

export default function NuevoRepartoPage() {
  const router = useRouter();
  const createMutation = useCreateReparto();
  const containerRef = useRef<HTMLDivElement>(null);

  const form = useForm<RepartoInput>({
    resolver: zodResolver(repartoSchema),
    defaultValues: {
      fecha: new Date().toISOString().slice(0, 10),
      empleado_id: "",
      vehiculo_id: "",
      zona_id: "",
      sucursal_id: "",
      observaciones: "",
      pedido_ids: [],
    },
  });

  const { data: vehiculosData } = useVehiculos({ page: 1, pageSize: 100 });
  const { data: zonasData } = useZonas({ page: 1, pageSize: 100 });
  const { data: empleadosData } = useEmpleados({
    page: 1,
    pageSize: 100,
    rol: "REPARTIDOR",
    estado: "ACTIVO",
  });
  const { data: pedidosData } = usePedidos({
    page: 1,
    pageSize: 100,
    estado: "PREPARADO",
  });

  const vehiculos = vehiculosData?.data || [];
  const zonas = zonasData?.data || [];
  const empleados = empleadosData?.data || [];
  const pedidosDisponibles = pedidosData?.data || [];

  const selectedPedidoIds = form.watch("pedido_ids");

  const handleTogglePedido = (pedidoId: string) => {
    const current = form.getValues("pedido_ids");
    if (current.includes(pedidoId)) {
      form.setValue(
        "pedido_ids",
        current.filter((id) => id !== pedidoId),
        { shouldValidate: true },
      );
    } else {
      form.setValue("pedido_ids", [...current, pedidoId], {
        shouldValidate: true,
      });
    }
  };

  const onSubmit = (data: RepartoInput) => {
    const payload = {
      ...data,
      vehiculo_id: data.vehiculo_id || undefined,
      zona_id: data.zona_id || undefined,
      observaciones: data.observaciones || undefined,
    };
    createMutation.mutate(payload, {
      onSuccess: () => {
        router.push("/logistica/repartos");
      },
    });
  };

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".nuevo-reparto-header",
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
      );
      gsap.fromTo(
        ".nuevo-reparto-form",
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, delay: 0.15, ease: "power3.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="nuevo-reparto-header space-y-4">
        <Link
          href="/logistica/repartos"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Repartos
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Truck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nuevo Reparto</h1>
            <p className="text-muted-foreground mt-0.5">
              Planifica un nuevo reparto de entregas
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="nuevo-reparto-form">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Datos del reparto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-5 sm:grid-cols-2">
                  {/* Fecha */}
                  <FormField
                    control={form.control}
                    name="fecha"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Repartidor */}
                  <FormField
                    control={form.control}
                    name="empleado_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Repartidor</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar repartidor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {empleados.map((emp) => (
                              <SelectItem key={emp.id} value={emp.id}>
                                {emp.apellido}, {emp.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Vehiculo */}
                  <FormField
                    control={form.control}
                    name="vehiculo_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vehiculo</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar vehiculo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {vehiculos.map((v) => (
                              <SelectItem key={v.id} value={v.id}>
                                {v.marca} {v.modelo} - {v.patente}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Zona */}
                  <FormField
                    control={form.control}
                    name="zona_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zona</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar zona" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {zonas.map((z) => (
                              <SelectItem key={z.id} value={z.id}>
                                {z.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Sucursal */}
                  <FormField
                    control={form.control}
                    name="sucursal_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sucursal</FormLabel>
                        <FormControl>
                          <Input placeholder="ID de sucursal" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Observaciones */}
                <div className="mt-5">
                  <FormField
                    control={form.control}
                    name="observaciones"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observaciones</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Notas adicionales para el reparto..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pedidos picker */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Pedidos a entregar
                  </CardTitle>
                  {selectedPedidoIds.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedPedidoIds.length} seleccionados
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {form.formState.errors.pedido_ids && (
                  <p className="text-sm text-destructive mb-3">
                    {form.formState.errors.pedido_ids.message}
                  </p>
                )}
                {pedidosDisponibles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Package className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">
                      No hay pedidos preparados
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Los pedidos en estado "Preparado" apareceran aqui
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {pedidosDisponibles.map((p) => (
                      <div
                        key={p.id}
                        className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                          selectedPedidoIds.includes(p.id)
                            ? "border-primary/50 bg-primary/5"
                            : "border-border hover:border-border/80 hover:bg-muted/50"
                        }`}
                        onClick={() => handleTogglePedido(p.id)}
                      >
                        <Checkbox
                          checked={selectedPedidoIds.includes(p.id)}
                          onCheckedChange={() => handleTogglePedido(p.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="font-mono text-xs border-primary/30 text-primary"
                            >
                              {p.numero}
                            </Badge>
                            <span className="text-sm font-medium truncate">
                              {p.cliente_nombre}
                            </span>
                          </div>
                        </div>
                        <span className="text-sm font-semibold tabular-nums">
                          {formatCurrency(p.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/logistica/repartos")}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creando..." : "Crear Reparto"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

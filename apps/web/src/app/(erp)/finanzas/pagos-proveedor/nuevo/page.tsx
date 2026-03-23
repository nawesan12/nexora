"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { pagoProveedorSchema, tipoPagoValues, type PagoProveedorInput } from "@pronto/shared/schemas";
import { useCreatePagoProveedor } from "@/hooks/queries/use-payments";
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
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, FileCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import { useUserStore } from "@/store/user-store";

export default function NuevoPagoProveedorPage() {
  const router = useRouter();
  const createMutation = useCreatePagoProveedor();
  const user = useUserStore((s) => s.user);
  const sucursales = user?.sucursales || [];

  const form = useForm<PagoProveedorInput>({
    resolver: zodResolver(pagoProveedorSchema),
    defaultValues: {
      proveedor_id: "",
      sucursal_id: user?.sucursal_actual?.id || "",
      tipo: undefined,
      monto: 0,
      fecha_pago: new Date().toISOString().split("T")[0],
      referencia: "",
      metodo_pago_id: "",
      caja_id: "",
      observaciones: "",
      aplicaciones: [{ orden_compra_id: "", monto_aplicado: 0 }],
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    createMutation.mutate(data, {
      onSuccess: () => router.push("/finanzas/pagos-proveedor"),
    });
  });

  return (
    <div className="space-y-5">
      <div>
        <Link href="/finanzas/pagos-proveedor" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground mb-3">
          <ArrowLeft className="h-3.5 w-3.5" />Pagos a Proveedores
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]"><FileCheck className="h-5 w-5" /></div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Nuevo Pago a Proveedor</h1>
            <p className="text-sm text-muted-foreground">Registrar un pago a proveedor</p>
          </div>
        </div>
      </div>

      <Card className="max-w-lg border-0 shadow-sm">
        <CardContent className="pt-6">
          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Datos del Pago</h3>
              <Separator className="mt-2 mb-4" />
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="proveedor_id">ID del Proveedor</Label>
                  <Input id="proveedor_id" {...form.register("proveedor_id")} placeholder="UUID del proveedor" />
                  {form.formState.errors.proveedor_id && <p className="text-sm text-destructive">{form.formState.errors.proveedor_id.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select value={form.watch("tipo") || ""} onValueChange={(v) => form.setValue("tipo", v as any)}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>{tipoPagoValues.map((v) => (<SelectItem key={v} value={v}>{v}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monto">Monto</Label>
                    <Input id="monto" type="number" step="0.01" {...form.register("monto", { valueAsNumber: true })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fecha_pago">Fecha</Label>
                    <Input id="fecha_pago" type="date" {...form.register("fecha_pago")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Sucursal</Label>
                    <Select value={form.watch("sucursal_id") || ""} onValueChange={(v) => form.setValue("sucursal_id", v)}>
                      <SelectTrigger><SelectValue placeholder="Sucursal" /></SelectTrigger>
                      <SelectContent>{sucursales.map((s) => (<SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="referencia">Referencia</Label>
                  <Input id="referencia" {...form.register("referencia")} placeholder="Nro. transferencia..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="observaciones">Observaciones</Label>
                  <Textarea id="observaciones" {...form.register("observaciones")} rows={2} />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground">Aplicar a Orden de Compra</h3>
              <Separator className="mt-2 mb-4" />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>ID Orden Compra</Label>
                  <Input {...form.register("aplicaciones.0.orden_compra_id")} placeholder="UUID de la OC" />
                </div>
                <div className="space-y-2">
                  <Label>Monto Aplicado</Label>
                  <Input type="number" step="0.01" {...form.register("aplicaciones.0.monto_aplicado", { valueAsNumber: true })} />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" type="button" asChild><Link href="/finanzas/pagos-proveedor">Cancelar</Link></Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar Pago
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { metaVentaSchema, tipoMetaValues, type MetaVentaInput } from "@pronto/shared/schemas";
import { useCreateMetaVenta } from "@/hooks/queries/use-metas-venta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Target, Loader2 } from "lucide-react";
import Link from "next/link";
import { useUserStore } from "@/store/user-store";

export default function NuevaMetaVentaPage() {
  const router = useRouter();
  const createMutation = useCreateMetaVenta();
  const user = useUserStore((s) => s.user);
  const sucursales = user?.sucursales || [];

  const form = useForm<MetaVentaInput>({
    resolver: zodResolver(metaVentaSchema),
    defaultValues: {
      nombre: "",
      tipo: undefined,
      empleado_id: "",
      sucursal_id: "",
      monto_objetivo: 0,
      fecha_inicio: new Date().toISOString().split("T")[0],
      fecha_fin: "",
    },
  });

  const tipo = form.watch("tipo");

  const onSubmit = form.handleSubmit((data) => {
    createMutation.mutate(data, {
      onSuccess: () => router.push("/administracion/metas-venta"),
    });
  });

  return (
    <div className="space-y-5">
      <div>
        <Link href="/administracion/metas-venta" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground mb-3">
          <ArrowLeft className="h-3.5 w-3.5" />Metas de Venta
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]"><Target className="h-5 w-5" /></div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Nueva Meta de Venta</h1>
            <p className="text-sm text-muted-foreground">Definir un objetivo comercial</p>
          </div>
        </div>
      </div>

      <Card className="max-w-lg border-0 shadow-sm">
        <CardContent className="pt-6">
          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Datos de la Meta</h3>
              <Separator className="mt-2 mb-4" />
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input id="nombre" {...form.register("nombre")} placeholder="Ej: Meta Q1 2026 - Zona Norte" />
                  {form.formState.errors.nombre && <p className="text-sm text-destructive">{form.formState.errors.nombre.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select value={form.watch("tipo") || ""} onValueChange={(v) => form.setValue("tipo", v as any)}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                      <SelectContent>
                        {tipoMetaValues.map((v) => (<SelectItem key={v} value={v}>{v}</SelectItem>))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.tipo && <p className="text-sm text-destructive">{form.formState.errors.tipo.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monto_objetivo">Monto Objetivo</Label>
                    <Input id="monto_objetivo" type="number" step="0.01" {...form.register("monto_objetivo", { valueAsNumber: true })} />
                    {form.formState.errors.monto_objetivo && <p className="text-sm text-destructive">{form.formState.errors.monto_objetivo.message}</p>}
                  </div>
                </div>
                {tipo === "EMPLEADO" && (
                  <div className="space-y-2">
                    <Label htmlFor="empleado_id">ID del Empleado</Label>
                    <Input id="empleado_id" {...form.register("empleado_id")} placeholder="UUID del empleado" />
                  </div>
                )}
                {tipo === "SUCURSAL" && (
                  <div className="space-y-2">
                    <Label>Sucursal</Label>
                    <Select value={form.watch("sucursal_id") || ""} onValueChange={(v) => form.setValue("sucursal_id", v)}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar sucursal" /></SelectTrigger>
                      <SelectContent>
                        {sucursales.map((s) => (<SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground">Periodo</h3>
              <Separator className="mt-2 mb-4" />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fecha_inicio">Desde</Label>
                  <Input id="fecha_inicio" type="date" {...form.register("fecha_inicio")} />
                  {form.formState.errors.fecha_inicio && <p className="text-sm text-destructive">{form.formState.errors.fecha_inicio.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha_fin">Hasta</Label>
                  <Input id="fecha_fin" type="date" {...form.register("fecha_fin")} />
                  {form.formState.errors.fecha_fin && <p className="text-sm text-destructive">{form.formState.errors.fecha_fin.message}</p>}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" type="button" asChild><Link href="/administracion/metas-venta">Cancelar</Link></Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear Meta
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

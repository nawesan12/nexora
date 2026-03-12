"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { presupuestoSchema, type PresupuestoInput } from "@nexora/shared/schemas";
import { useCreatePresupuesto } from "@/hooks/queries/use-finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NuevoPresupuestoPage() {
  const router = useRouter();
  const createMutation = useCreatePresupuesto();

  const form = useForm<PresupuestoInput>({
    resolver: zodResolver(presupuestoSchema),
    defaultValues: {
      nombre: "",
      monto_asignado: 0,
      periodo: "",
      fecha_inicio: new Date().toISOString().split("T")[0],
      fecha_fin: "",
      estado: "BORRADOR",
      sucursal_id: "",
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    createMutation.mutate(data, {
      onSuccess: () => router.push("/finanzas/presupuestos"),
    });
  });

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/finanzas/presupuestos"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Presupuestos
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Nuevo Presupuesto
            </h1>
            <p className="text-sm text-muted-foreground">
              Define un nuevo presupuesto para controlar gastos
            </p>
          </div>
        </div>
      </div>

      <Card className="max-w-lg border-0 shadow-sm">
        <CardContent className="pt-6">
          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Identificación</h3>
              <Separator className="mt-2 mb-4" />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    {...form.register("nombre")}
                    placeholder="Ej: Presupuesto Marketing Q1"
                  />
                  {form.formState.errors.nombre && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.nombre.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monto_asignado">Monto Asignado</Label>
                  <Input
                    id="monto_asignado"
                    type="number"
                    step="0.01"
                    {...form.register("monto_asignado", { valueAsNumber: true })}
                  />
                  {form.formState.errors.monto_asignado && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.monto_asignado.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="periodo">Período (opcional)</Label>
                  <Input
                    id="periodo"
                    {...form.register("periodo")}
                    placeholder="Ej: Q1 2026"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground">Vigencia</h3>
              <Separator className="mt-2 mb-4" />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fecha_inicio">Fecha Inicio</Label>
                  <Input
                    id="fecha_inicio"
                    type="date"
                    {...form.register("fecha_inicio")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha_fin">Fecha Fin</Label>
                  <Input
                    id="fecha_fin"
                    type="date"
                    {...form.register("fecha_fin")}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground">Asignación</h3>
              <Separator className="mt-2 mb-4" />
              <div className="space-y-2">
                <Label htmlFor="sucursal_id">Sucursal ID</Label>
                <Input
                  id="sucursal_id"
                  {...form.register("sucursal_id")}
                  placeholder="ID de la sucursal"
                />
                {form.formState.errors.sucursal_id && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.sucursal_id.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" type="button" asChild>
                <Link href="/finanzas/presupuestos">Cancelar</Link>
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Crear Presupuesto
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

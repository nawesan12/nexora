"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cajaSchema, type CajaInput } from "@nexora/shared/schemas";
import { useCreateCaja } from "@/hooks/queries/use-finance";
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
import { ArrowLeft, Wallet, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NuevaCajaPage() {
  const router = useRouter();
  const createMutation = useCreateCaja();

  const form = useForm<CajaInput>({
    resolver: zodResolver(cajaSchema),
    defaultValues: { nombre: "", tipo: "EFECTIVO", sucursal_id: "", saldo: 0 },
  });

  const onSubmit = form.handleSubmit((data) => {
    createMutation.mutate(data, {
      onSuccess: () => router.push("/finanzas/cajas"),
    });
  });

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/finanzas/cajas"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Cajas
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Nueva Caja
            </h1>
            <p className="text-sm text-muted-foreground">
              Configura una nueva caja de efectivo o banco
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
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    {...form.register("nombre")}
                    placeholder="Ej: Caja Principal"
                  />
                  {form.formState.errors.nombre && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.nombre.message}
                    </p>
                  )}
                </div>

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
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground">Configuración</h3>
              <Separator className="mt-2 mb-4" />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select
                    value={form.watch("tipo")}
                    onValueChange={(v) => form.setValue("tipo", v as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                      <SelectItem value="BANCO">Banco</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="saldo">Saldo Inicial</Label>
                  <Input
                    id="saldo"
                    type="number"
                    step="0.01"
                    {...form.register("saldo", { valueAsNumber: true })}
                  />
                  {form.formState.errors.saldo && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.saldo.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" type="button" asChild>
                <Link href="/finanzas/cajas">Cancelar</Link>
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Crear Caja
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

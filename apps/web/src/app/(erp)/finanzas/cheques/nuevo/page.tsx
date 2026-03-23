"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { chequeSchema, type ChequeInput } from "@pronto/shared/schemas";
import { useCreateCheque } from "@/hooks/queries/use-finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CreditCard, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NuevoChequePage() {
  const router = useRouter();
  const createMutation = useCreateCheque();

  const form = useForm<ChequeInput>({
    resolver: zodResolver(chequeSchema),
    defaultValues: {
      numero: "",
      monto: 0,
      fecha_emision: "",
      fecha_vencimiento: "",
      banco: "",
      emisor: "",
      receptor: "",
      entidad_bancaria_id: "",
      sucursal_id: "",
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    createMutation.mutate(data, {
      onSuccess: () => router.push("/finanzas/cheques"),
    });
  });

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/finanzas/cheques"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Cheques
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Nuevo Cheque
            </h1>
            <p className="text-sm text-muted-foreground">
              Registra un nuevo cheque en el sistema
            </p>
          </div>
        </div>
      </div>

      <Card className="max-w-lg border-0 shadow-sm">
        <CardContent className="pt-6">
          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Datos del Cheque</h3>
              <Separator className="mt-2 mb-4" />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="numero">Número</Label>
                  <Input
                    id="numero"
                    {...form.register("numero")}
                    placeholder="Nro. de cheque"
                  />
                  {form.formState.errors.numero && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.numero.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monto">Monto</Label>
                  <Input
                    id="monto"
                    type="number"
                    step="0.01"
                    {...form.register("monto", { valueAsNumber: true })}
                  />
                  {form.formState.errors.monto && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.monto.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground">Fechas</h3>
              <Separator className="mt-2 mb-4" />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fecha_emision">Emisión</Label>
                  <Input
                    id="fecha_emision"
                    type="date"
                    {...form.register("fecha_emision")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha_vencimiento">Vencimiento</Label>
                  <Input
                    id="fecha_vencimiento"
                    type="date"
                    {...form.register("fecha_vencimiento")}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground">Partes</h3>
              <Separator className="mt-2 mb-4" />
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="banco">Banco</Label>
                  <Input
                    id="banco"
                    {...form.register("banco")}
                    placeholder="Nombre del banco"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emisor">Emisor</Label>
                    <Input
                      id="emisor"
                      {...form.register("emisor")}
                      placeholder="Nombre del emisor"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="receptor">Receptor</Label>
                    <Input
                      id="receptor"
                      {...form.register("receptor")}
                      placeholder="Nombre del receptor"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground">Asignación</h3>
              <Separator className="mt-2 mb-4" />
              <div className="grid gap-4 sm:grid-cols-2">
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
                <div className="space-y-2">
                  <Label htmlFor="entidad_bancaria_id">Entidad Bancaria ID</Label>
                  <Input
                    id="entidad_bancaria_id"
                    {...form.register("entidad_bancaria_id")}
                    placeholder="Opcional"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" type="button" asChild>
                <Link href="/finanzas/cheques">Cancelar</Link>
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Registrar Cheque
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

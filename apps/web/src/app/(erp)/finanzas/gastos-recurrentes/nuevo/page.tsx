"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { gastoRecurrenteSchema, type GastoRecurrenteInput } from "@pronto/shared/schemas";
import { useCreateGastoRecurrente } from "@/hooks/queries/use-finance";
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
import { ArrowLeft, RefreshCw, Loader2 } from "lucide-react";
import Link from "next/link";

const categorias = [
  { value: "OPERATIVO", label: "Operativo" },
  { value: "ADMINISTRATIVO", label: "Administrativo" },
  { value: "LOGISTICA", label: "Logística" },
  { value: "COMERCIAL", label: "Comercial" },
  { value: "IMPOSITIVO", label: "Impositivo" },
];

const frecuencias = [
  { value: "DIARIA", label: "Diaria" },
  { value: "SEMANAL", label: "Semanal" },
  { value: "QUINCENAL", label: "Quincenal" },
  { value: "MENSUAL", label: "Mensual" },
  { value: "BIMESTRAL", label: "Bimestral" },
  { value: "TRIMESTRAL", label: "Trimestral" },
  { value: "SEMESTRAL", label: "Semestral" },
  { value: "ANUAL", label: "Anual" },
];

export default function NuevoGastoRecurrentePage() {
  const router = useRouter();
  const createMutation = useCreateGastoRecurrente();

  const form = useForm<GastoRecurrenteInput>({
    resolver: zodResolver(gastoRecurrenteSchema),
    defaultValues: {
      concepto: "",
      monto: 0,
      categoria: "OPERATIVO",
      frecuencia: "MENSUAL",
      proxima_fecha: new Date().toISOString().split("T")[0],
      sucursal_id: "",
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    createMutation.mutate(data, {
      onSuccess: () => router.push("/finanzas/gastos-recurrentes"),
    });
  });

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/finanzas/gastos-recurrentes"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Gastos Recurrentes
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
            <RefreshCw className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Nuevo Gasto Recurrente
            </h1>
            <p className="text-sm text-muted-foreground">
              Configura un gasto que se repite periódicamente
            </p>
          </div>
        </div>
      </div>

      <Card className="max-w-lg border-0 shadow-sm">
        <CardContent className="pt-6">
          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Detalle</h3>
              <Separator className="mt-2 mb-4" />
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="concepto">Concepto</Label>
                  <Input
                    id="concepto"
                    {...form.register("concepto")}
                    placeholder="Descripción del gasto recurrente"
                  />
                  {form.formState.errors.concepto && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.concepto.message}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                  <div className="space-y-2">
                    <Label htmlFor="categoria">Categoría</Label>
                    <Select
                      value={form.watch("categoria")}
                      onValueChange={(v) => form.setValue("categoria", v as GastoRecurrenteInput["categoria"])}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categorias.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground">Programación</h3>
              <Separator className="mt-2 mb-4" />
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="frecuencia">Frecuencia</Label>
                    <Select
                      value={form.watch("frecuencia")}
                      onValueChange={(v) => form.setValue("frecuencia", v as GastoRecurrenteInput["frecuencia"])}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {frecuencias.map((f) => (
                          <SelectItem key={f.value} value={f.value}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.frecuencia && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.frecuencia.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="proxima_fecha">Próxima Fecha</Label>
                    <Input
                      id="proxima_fecha"
                      type="date"
                      {...form.register("proxima_fecha")}
                    />
                    {form.formState.errors.proxima_fecha && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.proxima_fecha.message}
                      </p>
                    )}
                  </div>
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

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" type="button" asChild>
                <Link href="/finanzas/gastos-recurrentes">Cancelar</Link>
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Crear Gasto Recurrente
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

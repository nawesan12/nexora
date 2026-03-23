"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { retencionSchema, type RetencionInput } from "@pronto/shared/schemas";
import { useCreateRetencion } from "@/hooks/queries/use-retenciones";
import { useClientes } from "@/hooks/queries/use-clients";
import { useProveedores } from "@/hooks/queries/use-suppliers";
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
import { ArrowLeft, Receipt, Loader2 } from "lucide-react";
import Link from "next/link";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n);
}

export default function NuevaRetencionPage() {
  const router = useRouter();
  const createMutation = useCreateRetencion();

  const form = useForm<RetencionInput>({
    resolver: zodResolver(retencionSchema),
    defaultValues: {
      tipo: "IIBB",
      entidad_tipo: "CLIENTE",
      entidad_id: "",
      pago_id: "",
      numero_certificado: "",
      fecha: new Date().toISOString().split("T")[0],
      base_imponible: 0,
      alicuota: 0,
      monto: 0,
      periodo: new Date().toISOString().slice(0, 7),
      observaciones: "",
    },
  });

  const entidadTipo = form.watch("entidad_tipo");
  const baseImponible = form.watch("base_imponible");
  const alicuota = form.watch("alicuota");

  // Auto-calculate monto when base_imponible or alicuota changes
  useEffect(() => {
    if (baseImponible > 0 && alicuota >= 0) {
      const calculatedMonto = Math.round(baseImponible * alicuota) / 100;
      form.setValue("monto", calculatedMonto, { shouldValidate: true });
    }
  }, [baseImponible, alicuota, form]);

  // Fetch clients or suppliers based on entity type
  const { data: clientsData } = useClientes({ page: 1, pageSize: 100 });
  const { data: suppliersData } = useProveedores({ page: 1, pageSize: 100 });
  const clients = clientsData?.data || [];
  const suppliers = suppliersData?.data || [];

  const entities = entidadTipo === "CLIENTE" ? clients : suppliers;

  // Reset entidad_id when switching entity type
  useEffect(() => {
    form.setValue("entidad_id", "");
  }, [entidadTipo, form]);

  const onSubmit = form.handleSubmit((data) => {
    createMutation.mutate(data, {
      onSuccess: () => router.push("/finanzas/retenciones"),
    });
  });

  return (
    <div className="space-y-5">
      <div>
        <Link href="/finanzas/retenciones" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground mb-3">
          <ArrowLeft className="h-3.5 w-3.5" />Retenciones
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]"><Receipt className="h-5 w-5" /></div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Nueva Retencion</h1>
            <p className="text-sm text-muted-foreground">Registrar una retencion impositiva</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <Card className="max-w-2xl border-0 shadow-sm">
          <CardContent className="pt-6">
            <form onSubmit={onSubmit} className="space-y-6">
              {/* Tipo y Entidad */}
              <div>
                <h3 className="text-sm font-semibold text-foreground">Tipo y Entidad</h3>
                <Separator className="mt-2 mb-4" />
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tipo de Retencion</Label>
                    <Select value={form.watch("tipo")} onValueChange={(v) => form.setValue("tipo", v as RetencionInput["tipo"])}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IIBB">IIBB - Ingresos Brutos</SelectItem>
                        <SelectItem value="GANANCIAS">Ganancias</SelectItem>
                        <SelectItem value="IVA">IVA</SelectItem>
                        <SelectItem value="SUSS">SUSS</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.tipo && <p className="text-sm text-destructive">{form.formState.errors.tipo.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo de Entidad</Label>
                    <Select value={entidadTipo} onValueChange={(v) => form.setValue("entidad_tipo", v as RetencionInput["entidad_tipo"])}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar tipo de entidad" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CLIENTE">Cliente</SelectItem>
                        <SelectItem value="PROVEEDOR">Proveedor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{entidadTipo === "CLIENTE" ? "Cliente" : "Proveedor"}</Label>
                    <Select value={form.watch("entidad_id")} onValueChange={(v) => form.setValue("entidad_id", v)}>
                      <SelectTrigger><SelectValue placeholder={`Seleccionar ${entidadTipo === "CLIENTE" ? "cliente" : "proveedor"}`} /></SelectTrigger>
                      <SelectContent>
                        {entities.map((e) => (
                          <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.entidad_id && <p className="text-sm text-destructive">{form.formState.errors.entidad_id.message}</p>}
                  </div>
                </div>
              </div>

              {/* Datos del certificado */}
              <div>
                <h3 className="text-sm font-semibold text-foreground">Datos del Certificado</h3>
                <Separator className="mt-2 mb-4" />
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="numero_certificado">Nro. Certificado</Label>
                      <Input id="numero_certificado" {...form.register("numero_certificado")} placeholder="Ej: 0001-00012345" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fecha">Fecha</Label>
                      <Input id="fecha" type="date" {...form.register("fecha")} />
                      {form.formState.errors.fecha && <p className="text-sm text-destructive">{form.formState.errors.fecha.message}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="periodo">Periodo (YYYY-MM)</Label>
                    <Input id="periodo" type="month" {...form.register("periodo")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pago_id">ID de Pago (opcional)</Label>
                    <Input id="pago_id" {...form.register("pago_id")} placeholder="UUID del pago asociado" />
                  </div>
                </div>
              </div>

              {/* Importes */}
              <div>
                <h3 className="text-sm font-semibold text-foreground">Importes</h3>
                <Separator className="mt-2 mb-4" />
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="base_imponible">Base Imponible</Label>
                      <Input id="base_imponible" type="number" step="0.01" {...form.register("base_imponible", { valueAsNumber: true })} placeholder="0.00" />
                      {form.formState.errors.base_imponible && <p className="text-sm text-destructive">{form.formState.errors.base_imponible.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="alicuota">Alicuota (%)</Label>
                      <Input id="alicuota" type="number" step="0.01" {...form.register("alicuota", { valueAsNumber: true })} placeholder="0.00" />
                      {form.formState.errors.alicuota && <p className="text-sm text-destructive">{form.formState.errors.alicuota.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="monto">Monto</Label>
                      <Input id="monto" type="number" step="0.01" {...form.register("monto", { valueAsNumber: true })} placeholder="0.00" className="bg-muted/50" readOnly />
                      {form.formState.errors.monto && <p className="text-sm text-destructive">{form.formState.errors.monto.message}</p>}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">El monto se calcula automaticamente: Base Imponible x Alicuota / 100</p>
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <h3 className="text-sm font-semibold text-foreground">Observaciones</h3>
                <Separator className="mt-2 mb-4" />
                <div className="space-y-2">
                  <Textarea id="observaciones" {...form.register("observaciones")} placeholder="Observaciones adicionales..." rows={3} />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" type="button" asChild><Link href="/finanzas/retenciones">Cancelar</Link></Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Registrar Retencion
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Right sidebar - summary */}
        <div className="space-y-5">
          <Card className="border-0 shadow-sm sticky top-20">
            <CardContent className="pt-6 space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Tipo</p>
                <p className="text-lg font-bold">{form.watch("tipo") || "-"}</p>
              </div>
              <Separator />
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Base Imponible</p>
                <p className="text-lg font-semibold tabular-nums">{formatCurrency(baseImponible || 0)}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Alicuota</p>
                <p className="text-lg font-semibold tabular-nums">{(alicuota || 0).toFixed(2)}%</p>
              </div>
              <Separator />
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Monto Retencion</p>
                <p className="text-2xl font-bold tabular-nums">{formatCurrency(form.watch("monto") || 0)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

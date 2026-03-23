"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { mantenimientoVehiculoSchema, type MantenimientoVehiculoInput } from "@pronto/shared/schemas";
import { useCreateMantenimiento } from "@/hooks/queries/use-mantenimientos";
import { useVehiculos } from "@/hooks/queries/use-logistics";
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
import { ArrowLeft, Wrench, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NuevoMantenimientoPage() {
  const router = useRouter();
  const createMutation = useCreateMantenimiento();
  const { data: vehiculosData } = useVehiculos({ page: 1, pageSize: 100 });
  const vehiculos = vehiculosData?.data || [];

  const form = useForm<MantenimientoVehiculoInput>({
    resolver: zodResolver(mantenimientoVehiculoSchema),
    defaultValues: {
      vehiculo_id: "",
      tipo: "",
      descripcion: "",
      fecha: new Date().toISOString().split("T")[0],
      proximo_fecha: "",
      proximo_km: undefined,
      costo: undefined,
      proveedor: "",
      numero_factura: "",
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    createMutation.mutate(data, {
      onSuccess: () => router.push("/logistica/mantenimientos"),
    });
  });

  return (
    <div className="space-y-5">
      <div>
        <Link href="/logistica/mantenimientos" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground mb-3">
          <ArrowLeft className="h-3.5 w-3.5" />Mantenimientos
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]"><Wrench className="h-5 w-5" /></div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Nuevo Mantenimiento</h1>
            <p className="text-sm text-muted-foreground">Registrar mantenimiento de vehiculo</p>
          </div>
        </div>
      </div>

      <Card className="max-w-lg border-0 shadow-sm">
        <CardContent className="pt-6">
          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Vehiculo y Tipo</h3>
              <Separator className="mt-2 mb-4" />
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Vehiculo</Label>
                  <Select value={form.watch("vehiculo_id")} onValueChange={(v) => form.setValue("vehiculo_id", v)}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar vehiculo" /></SelectTrigger>
                    <SelectContent>
                      {vehiculos.map((v) => (<SelectItem key={v.id} value={v.id}>{v.patente} - {v.marca} {v.modelo}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.vehiculo_id && <p className="text-sm text-destructive">{form.formState.errors.vehiculo_id.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo</Label>
                  <Input id="tipo" {...form.register("tipo")} placeholder="Ej: Service, Neumaticos, Frenos" />
                  {form.formState.errors.tipo && <p className="text-sm text-destructive">{form.formState.errors.tipo.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripcion</Label>
                  <Textarea id="descripcion" {...form.register("descripcion")} placeholder="Detalle del mantenimiento..." rows={3} />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground">Fechas y Costos</h3>
              <Separator className="mt-2 mb-4" />
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fecha">Fecha</Label>
                    <Input id="fecha" type="date" {...form.register("fecha")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="proximo_fecha">Proximo Servicio</Label>
                    <Input id="proximo_fecha" type="date" {...form.register("proximo_fecha")} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="costo">Costo</Label>
                    <Input id="costo" type="number" step="0.01" {...form.register("costo", { valueAsNumber: true })} placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="proximo_km">Proximo Km</Label>
                    <Input id="proximo_km" type="number" {...form.register("proximo_km", { valueAsNumber: true })} placeholder="Ej: 50000" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="proveedor">Proveedor</Label>
                    <Input id="proveedor" {...form.register("proveedor")} placeholder="Nombre del proveedor" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numero_factura">Nro. Factura</Label>
                    <Input id="numero_factura" {...form.register("numero_factura")} placeholder="Nro. comprobante" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" type="button" asChild><Link href="/logistica/mantenimientos">Cancelar</Link></Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

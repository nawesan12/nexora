"use client";

import { use, useState, useRef, useLayoutEffect } from "react";
import { useVehiculo, useUpdateVehiculo } from "@/hooks/queries/use-logistics";
import { VehicleVisualizer } from "@/components/vehicle-visualizer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Save,
  Truck,
  Weight,
  Box,
  Calendar,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import gsap from "gsap";

export default function VehiculoDimensionesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: vehiculo, isLoading } = useVehiculo(id);
  const updateMutation = useUpdateVehiculo();

  const [capacidadKg, setCapacidadKg] = useState<number | "">("");
  const [capacidadVolumen, setCapacidadVolumen] = useState<number | "">("");
  const [initialized, setInitialized] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync local state once vehicle loads
  if (vehiculo && !initialized) {
    setCapacidadKg(vehiculo.capacidad_kg || "");
    setCapacidadVolumen(vehiculo.capacidad_volumen || "");
    setInitialized(true);
  }

  useLayoutEffect(() => {
    if (!containerRef.current || isLoading) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".dim-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }
      );
      gsap.fromTo(
        ".dim-card",
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.1,
          ease: "power2.out",
          delay: 0.15,
        }
      );
    }, containerRef);
    return () => ctx.revert();
  }, [isLoading, vehiculo]);

  const handleSave = () => {
    if (!vehiculo) return;
    updateMutation.mutate({
      id: vehiculo.id,
      data: {
        marca: vehiculo.marca,
        modelo: vehiculo.modelo,
        patente: vehiculo.patente,
        anio: vehiculo.anio || undefined,
        capacidad_kg: capacidadKg === "" ? undefined : Number(capacidadKg),
        capacidad_volumen:
          capacidadVolumen === "" ? undefined : Number(capacidadVolumen),
        sucursal_id: vehiculo.sucursal_id || undefined,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (!vehiculo) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Truck className="h-12 w-12 text-muted-foreground/40 mb-3" />
        <p className="text-lg font-medium text-foreground">
          Vehiculo no encontrado
        </p>
        <Link
          href="/logistica/vehiculos"
          className="mt-4 text-sm text-[var(--accent)] hover:underline"
        >
          Volver a vehiculos
        </Link>
      </div>
    );
  }

  const previewKg = capacidadKg === "" ? undefined : Number(capacidadKg);
  const previewVol =
    capacidadVolumen === "" ? undefined : Number(capacidadVolumen);

  return (
    <div ref={containerRef} className="space-y-5">
      {/* Header */}
      <div className="dim-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/logistica/vehiculos"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/50 bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Dimensiones del Vehiculo
            </h1>
            <p className="text-sm text-muted-foreground">
              {vehiculo.marca} {vehiculo.modelo} -{" "}
              <span className="font-mono">{vehiculo.patente}</span>
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="shadow-sm"
        >
          <Save className="mr-2 h-4 w-4" />
          {updateMutation.isPending ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>

      {/* Vehicle info bar */}
      <div className="dim-card flex flex-wrap items-center gap-3 rounded-xl border border-border/50 bg-gradient-to-r from-[var(--accent)]/5 to-transparent px-5 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
          <Truck className="h-4 w-4" />
        </div>
        <Badge variant="outline" className="font-mono text-xs">
          {vehiculo.patente}
        </Badge>
        <span className="text-sm font-medium text-foreground">
          {vehiculo.marca} {vehiculo.modelo}
        </span>
        {vehiculo.anio && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {vehiculo.anio}
          </span>
        )}
        {vehiculo.sucursal_nombre && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Building2 className="h-3 w-3" />
            {vehiculo.sucursal_nombre}
          </span>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Live Preview */}
        <div className="dim-card">
          <VehicleVisualizer
            marca={vehiculo.marca}
            modelo={vehiculo.modelo}
            patente={vehiculo.patente}
            capacidadKg={previewKg}
            capacidadVolumen={previewVol}
          />
        </div>

        {/* Edit Form */}
        <Card className="dim-card border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Box className="h-4 w-4 text-[var(--accent)]" />
              Capacidad y Dimensiones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Capacidad Kg */}
            <div className="space-y-2">
              <Label
                htmlFor="capacidad_kg"
                className="flex items-center gap-1.5 text-sm"
              >
                <Weight className="h-3.5 w-3.5 text-muted-foreground" />
                Capacidad de Carga (kg)
              </Label>
              <Input
                id="capacidad_kg"
                type="number"
                min={0}
                step={1}
                placeholder="Ej: 3500"
                value={capacidadKg}
                onChange={(e) =>
                  setCapacidadKg(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
              />
              <p className="text-xs text-muted-foreground">
                Peso maximo que puede transportar el vehiculo.
              </p>
            </div>

            {/* Capacidad Volumen */}
            <div className="space-y-2">
              <Label
                htmlFor="capacidad_volumen"
                className="flex items-center gap-1.5 text-sm"
              >
                <Box className="h-3.5 w-3.5 text-muted-foreground" />
                Capacidad de Volumen (m3)
              </Label>
              <Input
                id="capacidad_volumen"
                type="number"
                min={0}
                step={0.1}
                placeholder="Ej: 12.5"
                value={capacidadVolumen}
                onChange={(e) =>
                  setCapacidadVolumen(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
              />
              <p className="text-xs text-muted-foreground">
                Volumen total del area de carga en metros cubicos. El
                visualizador se ajusta en tiempo real.
              </p>
            </div>

            {/* Quick reference */}
            <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Referencia rapida
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Utilitario chico</span>
                  <span className="font-mono">~5 m3</span>
                </div>
                <div className="flex justify-between">
                  <span>~800 kg</span>
                  <span />
                </div>
                <div className="flex justify-between">
                  <span>Furgon mediano</span>
                  <span className="font-mono">~12 m3</span>
                </div>
                <div className="flex justify-between">
                  <span>~2.000 kg</span>
                  <span />
                </div>
                <div className="flex justify-between">
                  <span>Camion grande</span>
                  <span className="font-mono">~25 m3</span>
                </div>
                <div className="flex justify-between">
                  <span>~5.000 kg</span>
                  <span />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

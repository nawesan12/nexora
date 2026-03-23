"use client";

import { useRef, useLayoutEffect, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { SalespeopleMap, type SalespersonLocation } from "@/components/salespeople-map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, MapPin, Clock, Radio, AlertTriangle } from "lucide-react";
import gsap from "gsap";

const ESTADO_COLORS: Record<string, string> = {
  EN_RUTA: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
  VISITANDO: "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400",
  DISPONIBLE: "bg-gray-100 text-gray-700 dark:bg-gray-950/50 dark:text-gray-400",
};

const ESTADO_LABELS: Record<string, string> = {
  EN_RUTA: "En Ruta",
  VISITANDO: "Visitando",
  DISPONIBLE: "Disponible",
};

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMin = Math.floor((now - then) / 60000);
  if (diffMin < 1) return "Ahora";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  return `Hace ${Math.floor(diffMin / 60)}h`;
}

// Mock data — in production this would come from a WebSocket or polling endpoint
// following the same GPS pattern as /api/v1/logistica/repartos/{id}/ubicacion
function useSalespeopleLocations() {
  const [locations, setLocations] = useState<SalespersonLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasGpsConfig, setHasGpsConfig] = useState(false);

  useEffect(() => {
    // Simulate checking for GPS configuration
    // In production, this would query an endpoint to see if GPS tracking is enabled
    const timer = setTimeout(() => {
      // Provide mock data to demonstrate the UI
      const mockLocations: SalespersonLocation[] = [
        {
          empleado_id: "mock-1",
          empleado_nombre: "Carlos Martinez",
          lat: -34.6037,
          lng: -58.3816,
          last_update: new Date(Date.now() - 3 * 60000).toISOString(),
          estado: "EN_RUTA",
        },
        {
          empleado_id: "mock-2",
          empleado_nombre: "Ana Rodriguez",
          lat: -34.5875,
          lng: -58.3974,
          last_update: new Date(Date.now() - 1 * 60000).toISOString(),
          estado: "VISITANDO",
        },
        {
          empleado_id: "mock-3",
          empleado_nombre: "Luis Fernandez",
          lat: -34.6158,
          lng: -58.3732,
          last_update: new Date(Date.now() - 15 * 60000).toISOString(),
          estado: "DISPONIBLE",
        },
        {
          empleado_id: "mock-4",
          empleado_nombre: "Maria Lopez",
          lat: -34.5950,
          lng: -58.4100,
          last_update: new Date(Date.now() - 7 * 60000).toISOString(),
          estado: "EN_RUTA",
        },
        {
          empleado_id: "mock-5",
          empleado_nombre: "Jorge Gomez",
          lat: -34.6200,
          lng: -58.3650,
          last_update: new Date(Date.now() - 0.5 * 60000).toISOString(),
          estado: "VISITANDO",
        },
      ];
      setLocations(mockLocations);
      setHasGpsConfig(true);
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  return { locations, isLoading, hasGpsConfig };
}

export default function MapaVendedoresPage() {
  const { locations, isLoading, hasGpsConfig } = useSalespeopleLocations();
  const containerRef = useRef<HTMLDivElement>(null);

  const stats = useMemo(() => {
    const enRuta = locations.filter((l) => l.estado === "EN_RUTA").length;
    const visitando = locations.filter((l) => l.estado === "VISITANDO").length;
    const disponible = locations.filter((l) => l.estado === "DISPONIBLE").length;
    return { enRuta, visitando, disponible, total: locations.length };
  }, [locations]);

  useLayoutEffect(() => {
    if (isLoading || !containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".map-header",
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" },
      );
      gsap.fromTo(
        ".map-card",
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, delay: 0.15, ease: "power3.out" },
      );
    }, containerRef);
    return () => ctx.revert();
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Cargando ubicaciones...</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="map-header space-y-4">
        <Link
          href="/ventas/vendedor"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Panel Vendedor
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">Mapa de Vendedores</h1>
              <Badge variant="secondary" className="border-0 bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400 text-xs">
                <Radio className="mr-1 h-3 w-3" />
                En vivo
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              Ubicacion en tiempo real de los vendedores en campo
            </p>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="map-card grid gap-3 sm:grid-cols-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total activos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/50">
              <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.enRuta}</p>
              <p className="text-xs text-muted-foreground">En ruta</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 dark:bg-green-950/50">
              <MapPin className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.visitando}</p>
              <p className="text-xs text-muted-foreground">Visitando</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
              <MapPin className="h-4 w-4 text-gray-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.disponible}</p>
              <p className="text-xs text-muted-foreground">Disponible</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* GPS config warning */}
      {!hasGpsConfig && (
        <Card className="map-card border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Requiere configuracion de GPS
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Los vendedores deben tener la app movil configurada para reportar su ubicacion en tiempo real.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Map + Sidebar */}
      <div className="map-card grid gap-4 lg:grid-cols-3">
        {/* Map */}
        <div className="lg:col-span-2">
          <SalespeopleMap locations={locations} />
        </div>

        {/* Sidebar list */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Users className="h-4 w-4" />
              Vendedores ({locations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-[420px] overflow-y-auto">
              {locations.length === 0 ? (
                <div className="py-8 text-center">
                  <Users className="mx-auto h-10 w-10 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No hay vendedores activos
                  </p>
                </div>
              ) : (
                locations.map((loc) => (
                  <div
                    key={loc.empleado_id}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50"
                  >
                    <div className="relative">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {loc.empleado_nombre.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${ESTADO_COLORS[loc.estado] || "bg-gray-400"}`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {loc.empleado_nombre}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={`border-0 text-[10px] font-medium ${ESTADO_COLORS[loc.estado]?.replace("bg-", "bg-").replace("-500", "-100") || ""} ${
                            loc.estado === "EN_RUTA"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
                              : loc.estado === "VISITANDO"
                                ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                          }`}
                        >
                          {ESTADO_LABELS[loc.estado] || loc.estado}
                        </Badge>
                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                          <Clock className="h-2.5 w-2.5" />
                          {formatTimeAgo(loc.last_update)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Demo notice */}
      <Card className="map-card border-0 shadow-sm bg-muted/50">
        <CardContent className="flex items-center gap-3 p-4">
          <AlertTriangle className="h-4 w-4 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground">
            Los datos mostrados son de demostracion. En produccion, las ubicaciones se actualizan en tiempo real via WebSocket siguiendo el mismo patron de GPS que el modulo de repartos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

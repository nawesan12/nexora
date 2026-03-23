"use client";

import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useEmpleados } from "@/hooks/queries/use-employees";
import { useVisitasHoy } from "@/hooks/queries/use-visitas";
import type { VisitaCliente } from "@pronto/shared/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { MapPin, Clock, Navigation, ArrowLeft } from "lucide-react";
import gsap from "gsap";
import Link from "next/link";

const resultadoColors: Record<string, string> = {
  PENDIENTE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  REALIZADA: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  NO_ATENDIDO: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  REPROGRAMADA: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  CANCELADA: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

const resultadoLabels: Record<string, string> = {
  PENDIENTE: "Pendiente",
  REALIZADA: "Realizada",
  NO_ATENDIDO: "No Atendido",
  REPROGRAMADA: "Reprogramada",
  CANCELADA: "Cancelada",
};

interface VisitMapProps {
  visitas: VisitaCliente[];
}

function VisitMapInner({ visitas }: VisitMapProps) {
  const [MapComponent, setMapComponent] = useState<React.ComponentType<{
    visitas: VisitaCliente[];
  }> | null>(null);

  useEffect(() => {
    import("react-leaflet").then((mod) => {
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
        document.head.appendChild(link);
      }
      import("leaflet").then((L) => {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        });

        const LeafletMap = ({ visitas }: { visitas: VisitaCliente[] }) => {
          const { MapContainer, TileLayer, Marker, Popup, Polyline } = mod;

          const geoVisitas = visitas.filter((v) => v.latitud && v.longitud);
          const center: [number, number] = geoVisitas.length > 0
            ? [geoVisitas[0].latitud!, geoVisitas[0].longitud!]
            : [-34.6037, -58.3816];

          const routePositions: [number, number][] = geoVisitas.map((v) => [
            v.latitud!,
            v.longitud!,
          ]);

          return (
            <MapContainer
              center={center}
              zoom={13}
              style={{ height: "100%", width: "100%", borderRadius: "0.5rem" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {geoVisitas.map((v, idx) => (
                <Marker key={v.id} position={[v.latitud!, v.longitud!]}>
                  <Popup>
                    <div className="text-sm">
                      <strong>#{idx + 1} - {v.cliente_nombre}</strong>
                      <br />
                      {v.direccion_resumen && <span>{v.direccion_resumen}<br /></span>}
                      {v.hora_inicio && <span>Hora: {v.hora_inicio}<br /></span>}
                      <span>Estado: {resultadoLabels[v.resultado] || v.resultado}</span>
                    </div>
                  </Popup>
                </Marker>
              ))}
              {routePositions.length > 1 && (
                <Polyline
                  positions={routePositions}
                  pathOptions={{
                    color: "#D97706",
                    weight: 3,
                    opacity: 0.7,
                    dashArray: "10, 6",
                  }}
                />
              )}
            </MapContainer>
          );
        };

        setMapComponent(() => LeafletMap);
      });
    });
  }, []);

  return (
    <div className="h-[500px] rounded-lg overflow-hidden bg-muted">
      {MapComponent ? (
        <MapComponent visitas={visitas} />
      ) : (
        <div className="h-full flex items-center justify-center text-muted-foreground">
          Cargando mapa...
        </div>
      )}
    </div>
  );
}

export default function RutasVisitaPage() {
  const [vendedorId, setVendedorId] = useState<string>("");
  const { data: empleadosData } = useEmpleados({ page: 1, pageSize: 200, rol: "VENDEDOR" });
  const { data: visitasData, isLoading } = useVisitasHoy(vendedorId);
  const empleados = empleadosData?.data || [];
  const visitas: VisitaCliente[] = (visitasData ?? []) as VisitaCliente[];

  const containerRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".ruta-header", { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="space-y-5">
      <div className="ruta-header">
        <Link href="/ventas/vendedor/visitas" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground mb-3">
          <ArrowLeft className="h-3.5 w-3.5" />Visitas
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
              <Navigation className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Ruta de Visitas</h1>
              <p className="text-sm text-muted-foreground">Visitas de hoy en el mapa</p>
            </div>
          </div>
          <Select value={vendedorId} onValueChange={setVendedorId}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="Seleccionar vendedor" /></SelectTrigger>
            <SelectContent>
              {empleados.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.nombre} {e.apellido}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!vendedorId ? (
        <Card>
          <CardContent className="py-16 text-center">
            <MapPin className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <p className="mt-4 text-muted-foreground">Selecciona un vendedor para ver sus visitas de hoy</p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">Cargando visitas...</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Navigation className="h-4 w-4" />
                Mapa de Visitas — Hoy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VisitMapInner visitas={visitas} />
              <div className="mt-2 text-xs text-muted-foreground">
                {visitas.filter((v) => v.latitud && v.longitud).length} de {visitas.length} visitas con ubicacion
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Agenda del Dia ({visitas.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {visitas.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Sin visitas programadas para hoy
                  </p>
                ) : (
                  visitas.map((v, idx) => (
                    <div
                      key={v.id}
                      className={cn(
                        "flex items-start gap-3 border-l-2 pl-3 py-2 rounded-r-lg transition-colors hover:bg-muted/50",
                        v.resultado === "REALIZADA" ? "border-green-500" :
                        v.resultado === "NO_ATENDIDO" ? "border-red-500" :
                        v.resultado === "CANCELADA" ? "border-gray-400" :
                        "border-primary/30"
                      )}
                    >
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{v.cliente_nombre}</p>
                        {v.direccion_resumen && (
                          <p className="text-xs text-muted-foreground truncate">{v.direccion_resumen}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {v.hora_inicio && (
                            <span className="text-xs font-mono text-muted-foreground">{v.hora_inicio}</span>
                          )}
                          <Badge variant="secondary" className={cn("text-xs", resultadoColors[v.resultado])}>
                            {resultadoLabels[v.resultado] || v.resultado}
                          </Badge>
                        </div>
                        {v.notas && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">{v.notas}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Users, Clock } from "lucide-react";

interface DriverLocation {
  latitud: number;
  longitud: number;
  timestamp: string;
}

export interface SalespersonLocation {
  empleado_id: string;
  empleado_nombre: string;
  lat: number;
  lng: number;
  last_update: string;
  estado: string; // EN_RUTA, VISITANDO, DISPONIBLE
}

interface SalespeopleMapProps {
  locations: SalespersonLocation[];
  className?: string;
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMin = Math.floor((now - then) / 60000);
  if (diffMin < 1) return "Ahora";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  return `Hace ${Math.floor(diffMin / 60)}h`;
}

const ESTADO_COLORS: Record<string, string> = {
  EN_RUTA: "bg-blue-500",
  VISITANDO: "bg-green-500",
  DISPONIBLE: "bg-gray-400",
};

const ESTADO_LABELS: Record<string, string> = {
  EN_RUTA: "En Ruta",
  VISITANDO: "Visitando",
  DISPONIBLE: "Disponible",
};

export function SalespeopleMap({ locations, className }: SalespeopleMapProps) {
  const [MapComponent, setMapComponent] = useState<React.ComponentType<{
    locations: SalespersonLocation[];
  }> | null>(null);

  useEffect(() => {
    // Dynamic import to avoid SSR issues — follows the same pattern as DeliveryMap
    import("react-leaflet").then((mod) => {
      // Load leaflet CSS via link tag
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
        document.head.appendChild(link);
      }
      import("leaflet").then((L) => {
        // Fix default icon paths
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        });
      });

      const LeafletMap = ({ locations }: { locations: SalespersonLocation[] }) => {
        const { MapContainer, TileLayer, Marker, Popup } = mod;
        // Center on Buenos Aires by default, or on first location
        const center: [number, number] = locations.length > 0
          ? [locations[0].lat, locations[0].lng]
          : [-34.6037, -58.3816];

        return (
          <MapContainer
            center={center}
            zoom={12}
            style={{ height: "100%", width: "100%", borderRadius: "0.5rem" }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {locations.map((loc) => (
              <Marker key={loc.empleado_id} position={[loc.lat, loc.lng]}>
                <Popup>
                  <div className="space-y-1">
                    <p className="font-semibold">{loc.empleado_nombre}</p>
                    <div className="flex items-center gap-1">
                      <div className={`h-2 w-2 rounded-full ${ESTADO_COLORS[loc.estado] || "bg-gray-400"}`} />
                      <span className="text-xs">{ESTADO_LABELS[loc.estado] || loc.estado}</span>
                    </div>
                    <p className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(loc.last_update)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        );
      };

      setMapComponent(() => LeafletMap);
    });
  }, []);

  return (
    <Card className={cn("border-0 shadow-sm", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Users className="h-4 w-4 text-[var(--accent)]" />
            Vendedores en Campo
          </CardTitle>
          <Badge variant="secondary">{locations.length} activos</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] overflow-hidden rounded-lg border bg-muted">
          {MapComponent ? (
            <MapComponent locations={locations} />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Cargando mapa...
            </div>
          )}
        </div>
        {/* Legend */}
        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-blue-500" /> En Ruta
          </span>
          <span className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-green-500" /> Visitando
          </span>
          <span className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-gray-400" /> Disponible
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

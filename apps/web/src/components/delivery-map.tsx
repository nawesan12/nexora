"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MapPin, Navigation, Clock } from "lucide-react";

interface MapParada {
  nombre: string;
  latitud?: number;
  longitud?: number;
  orden: number;
}

interface DriverLocation {
  latitud: number;
  longitud: number;
  timestamp: string;
}

interface DeliveryMapProps {
  driverLocation: DriverLocation | null;
  paradas: MapParada[];
  events: Array<{
    id: string;
    tipo: string;
    comentario?: string;
    created_at: string;
    empleado_nombre?: string;
  }>;
  className?: string;
}

export function DeliveryMap({
  driverLocation,
  paradas,
  events,
  className,
}: DeliveryMapProps) {
  const [MapComponent, setMapComponent] = useState<React.ComponentType<{
    driverLocation: DriverLocation | null;
    paradas: MapParada[];
  }> | null>(null);

  useEffect(() => {
    // Dynamic import to avoid SSR issues
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

      // Create the map component
      const LeafletMap = ({
        driverLocation,
        paradas,
      }: {
        driverLocation: DriverLocation | null;
        paradas: MapParada[];
      }) => {
        const { MapContainer, TileLayer, Marker, Popup } = mod;
        const center: [number, number] = driverLocation
          ? [driverLocation.latitud, driverLocation.longitud]
          : [-34.6037, -58.3816];

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
            {paradas.map((p, i) =>
              p.latitud && p.longitud ? (
                <Marker key={i} position={[p.latitud, p.longitud]}>
                  <Popup>
                    <strong>Parada {p.orden + 1}</strong>
                    <br />
                    {p.nombre}
                  </Popup>
                </Marker>
              ) : null,
            )}
            {driverLocation && (
              <Marker
                position={[driverLocation.latitud, driverLocation.longitud]}
              >
                <Popup>Repartidor (en vivo)</Popup>
              </Marker>
            )}
          </MapContainer>
        );
      };

      setMapComponent(() => LeafletMap);
    });
  }, []);

  const eventTypeColors: Record<string, string> = {
    LLEGADA: "bg-blue-100 text-blue-800",
    ENTREGA: "bg-green-100 text-green-800",
    NO_ENTREGA: "bg-red-100 text-red-800",
    ENTREGA_PARCIAL: "bg-yellow-100 text-yellow-800",
    COBRO: "bg-purple-100 text-purple-800",
  };

  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-3 gap-4", className)}>
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Navigation className="h-4 w-4" />
            Mapa en Vivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] rounded-lg overflow-hidden bg-muted">
            {MapComponent ? (
              <MapComponent
                driverLocation={driverLocation}
                paradas={paradas}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Cargando mapa...
              </div>
            )}
          </div>
          {driverLocation && (
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>
                {driverLocation.latitud.toFixed(6)},{" "}
                {driverLocation.longitud.toFixed(6)}
              </span>
              <span className="ml-auto">
                Actualizado:{" "}
                {new Date(driverLocation.timestamp).toLocaleTimeString("es-AR")}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Eventos en Vivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Sin eventos todavia
              </p>
            ) : (
              [...events].reverse().map((evt) => (
                <div
                  key={evt.id}
                  className="flex items-start gap-3 border-l-2 border-primary/30 pl-3 py-1"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-xs",
                          eventTypeColors[evt.tipo] ||
                            "bg-gray-100 text-gray-800",
                        )}
                      >
                        {evt.tipo}
                      </Badge>
                    </div>
                    {evt.comentario && (
                      <p className="text-sm text-muted-foreground mt-0.5 truncate">
                        {evt.comentario}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(evt.created_at).toLocaleTimeString("es-AR")}
                      {evt.empleado_nombre && ` — ${evt.empleado_nombre}`}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

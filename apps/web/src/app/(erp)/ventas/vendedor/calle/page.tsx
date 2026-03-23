"use client";

import { useState, useEffect, useRef, useLayoutEffect, useCallback } from "react";
import Link from "next/link";
import { useUserStore } from "@/store/user-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin,
  Plus,
  Calendar,
  Clock,
  User,
  Navigation,
  Phone,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ShoppingCart,
  ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import gsap from "gsap";

// -------------------------------------------------------------------
// Types
// -------------------------------------------------------------------

interface VisitClient {
  id: string;
  nombre: string;
  direccion: string;
  telefono?: string;
  latitud?: number;
  longitud?: number;
  ultima_visita?: string;
}

type VisitStatus = "PENDIENTE" | "REALIZADA" | "NO_ATENDIDO" | "REPROGRAMADA";

interface Visit {
  id: string;
  cliente: VisitClient;
  hora_programada?: string;
  estado: VisitStatus;
  notas?: string;
}

// -------------------------------------------------------------------
// Placeholder data (used when no /visitas/hoy API is available)
// -------------------------------------------------------------------

const PLACEHOLDER_VISITS: Visit[] = [
  {
    id: "v1",
    cliente: {
      id: "c1",
      nombre: "Distribuidora Norte SRL",
      direccion: "Av. Corrientes 1234, CABA",
      telefono: "1155001234",
      latitud: -34.6037,
      longitud: -58.3816,
      ultima_visita: "2026-03-18",
    },
    hora_programada: "09:00",
    estado: "PENDIENTE",
  },
  {
    id: "v2",
    cliente: {
      id: "c2",
      nombre: "Almacen El Sol",
      direccion: "Rivadavia 5678, CABA",
      telefono: "1155005678",
      latitud: -34.6118,
      longitud: -58.4173,
      ultima_visita: "2026-03-15",
    },
    hora_programada: "10:30",
    estado: "PENDIENTE",
  },
  {
    id: "v3",
    cliente: {
      id: "c3",
      nombre: "Supermercado La Esquina",
      direccion: "San Martin 910, CABA",
      telefono: "1155009100",
      latitud: -34.5957,
      longitud: -58.3732,
      ultima_visita: "2026-03-10",
    },
    hora_programada: "12:00",
    estado: "PENDIENTE",
  },
  {
    id: "v4",
    cliente: {
      id: "c4",
      nombre: "Kiosco Don Pedro",
      direccion: "Belgrano 456, CABA",
      telefono: "1155004560",
      latitud: -34.6135,
      longitud: -58.3886,
      ultima_visita: "2026-03-20",
    },
    hora_programada: "14:00",
    estado: "PENDIENTE",
  },
  {
    id: "v5",
    cliente: {
      id: "c5",
      nombre: "Mayorista del Centro",
      direccion: "Florida 789, CABA",
      telefono: "1155007890",
      latitud: -34.6007,
      longitud: -58.3755,
    },
    hora_programada: "16:00",
    estado: "PENDIENTE",
  },
];

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------

const STATUS_CONFIG: Record<
  VisitStatus,
  { label: string; color: string; icon: typeof CheckCircle2 }
> = {
  PENDIENTE: {
    label: "Pendiente",
    color:
      "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
    icon: Clock,
  },
  REALIZADA: {
    label: "Realizada",
    color:
      "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400",
    icon: CheckCircle2,
  },
  NO_ATENDIDO: {
    label: "No Atendido",
    color: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
    icon: XCircle,
  },
  REPROGRAMADA: {
    label: "Reprogramada",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
    icon: RotateCcw,
  },
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function daysSince(dateStr?: string): string {
  if (!dateStr) return "Sin visitas previas";
  const diff = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Ayer";
  return `Hace ${diff} dias`;
}

// -------------------------------------------------------------------
// Leaflet Map (dynamically imported)
// -------------------------------------------------------------------

function useLeafletMap() {
  const [MapComponent, setMapComponent] = useState<React.ComponentType<{
    visits: Visit[];
    userPosition: [number, number] | null;
  }> | null>(null);

  useEffect(() => {
    import("react-leaflet").then((mod) => {
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href =
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
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
      });

      const LeafletMap = ({
        visits,
        userPosition,
      }: {
        visits: Visit[];
        userPosition: [number, number] | null;
      }) => {
        const { MapContainer, TileLayer, Marker, Popup, CircleMarker } = mod;
        const center: [number, number] = userPosition || [-34.6037, -58.3816];

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
            {visits.map((v) =>
              v.cliente.latitud && v.cliente.longitud ? (
                <Marker
                  key={v.id}
                  position={[v.cliente.latitud, v.cliente.longitud]}
                >
                  <Popup>
                    <strong>{v.cliente.nombre}</strong>
                    <br />
                    {v.cliente.direccion}
                    {v.hora_programada && (
                      <>
                        <br />
                        <em>{v.hora_programada} hs</em>
                      </>
                    )}
                  </Popup>
                </Marker>
              ) : null
            )}
            {userPosition && (
              <CircleMarker
                center={userPosition}
                radius={10}
                pathOptions={{
                  color: "#D97706",
                  fillColor: "#D97706",
                  fillOpacity: 0.6,
                }}
              >
                <Popup>Tu ubicacion</Popup>
              </CircleMarker>
            )}
          </MapContainer>
        );
      };

      setMapComponent(() => LeafletMap);
    });
  }, []);

  return MapComponent;
}

// -------------------------------------------------------------------
// Main Page
// -------------------------------------------------------------------

export default function StreetVisitsPage() {
  const user = useUserStore((s) => s.user);
  const containerRef = useRef<HTMLDivElement>(null);
  const MapComponent = useLeafletMap();

  const [visits, setVisits] = useState<Visit[]>(PLACEHOLDER_VISITS);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(
    null
  );
  const [geoError, setGeoError] = useState<string | null>(null);

  // Request GPS geolocation
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError("Geolocalizacion no soportada por este navegador.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPosition([pos.coords.latitude, pos.coords.longitude]);
      },
      (err) => {
        setGeoError(
          err.code === 1
            ? "Permiso de ubicacion denegado."
            : "No se pudo obtener la ubicacion."
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // GSAP entrance animations
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".calle-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }
      );
      gsap.fromTo(
        ".calle-card",
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.08,
          ease: "power2.out",
          delay: 0.15,
        }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  // Status update handler
  const updateStatus = useCallback((visitId: string, estado: VisitStatus) => {
    setVisits((prev) =>
      prev.map((v) => (v.id === visitId ? { ...v, estado } : v))
    );
  }, []);

  const today = new Date();
  const completedCount = visits.filter(
    (v) => v.estado === "REALIZADA"
  ).length;
  const pendingCount = visits.filter((v) => v.estado === "PENDIENTE").length;

  return (
    <div ref={containerRef} className="space-y-5">
      {/* Header */}
      <div className="calle-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Mi Dia en Calle
          </h1>
          <p className="text-sm text-muted-foreground capitalize">
            <Calendar className="mr-1 inline h-3.5 w-3.5" />
            {formatDate(today)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/ventas/pedidos/nuevo">
            <Button variant="outline" className="shadow-sm">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Nuevo Pedido
            </Button>
          </Link>
          <Button className="shadow-sm" disabled>
            <ClipboardCheck className="mr-2 h-4 w-4" />
            Registrar Visita
          </Button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="calle-card flex flex-wrap items-center gap-4 rounded-xl border border-border/50 bg-gradient-to-r from-[var(--accent)]/5 to-transparent px-5 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
          <Navigation className="h-4 w-4" />
        </div>
        <span className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{visits.length}</span>{" "}
          visitas programadas
        </span>
        <span className="text-sm text-muted-foreground">
          <span className="font-semibold text-green-600">
            {completedCount}
          </span>{" "}
          realizadas
        </span>
        <span className="text-sm text-muted-foreground">
          <span className="font-semibold text-amber-600">{pendingCount}</span>{" "}
          pendientes
        </span>
        {user && (
          <span className="ml-auto text-xs text-muted-foreground">
            <User className="mr-1 inline h-3 w-3" />
            {user.nombre} {user.apellido}
          </span>
        )}
      </div>

      {/* Main grid: Map + Visit List */}
      <div className="grid gap-5 lg:grid-cols-5">
        {/* Map */}
        <Card className="calle-card border-0 shadow-sm lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4 text-[var(--accent)]" />
              Mapa de Visitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] rounded-lg overflow-hidden bg-muted">
              {MapComponent ? (
                <MapComponent
                  visits={visits}
                  userPosition={userPosition}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Cargando mapa...
                </div>
              )}
            </div>
            {userPosition && (
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Navigation className="h-3 w-3" />
                <span>
                  {userPosition[0].toFixed(6)}, {userPosition[1].toFixed(6)}
                </span>
              </div>
            )}
            {geoError && (
              <p className="mt-2 text-xs text-amber-600">{geoError}</p>
            )}
          </CardContent>
        </Card>

        {/* Visit List */}
        <Card className="calle-card border-0 shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-[var(--accent)]" />
              Visitas de Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-[440px] overflow-y-auto pr-1">
              {visits.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <MapPin className="h-10 w-10 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Sin visitas programadas para hoy
                  </p>
                </div>
              ) : (
                visits.map((visit) => {
                  const config = STATUS_CONFIG[visit.estado];
                  return (
                    <VisitCard
                      key={visit.id}
                      visit={visit}
                      config={config}
                      onUpdateStatus={updateStatus}
                    />
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// Visit Card sub-component
// -------------------------------------------------------------------

function VisitCard({
  visit,
  config,
  onUpdateStatus,
}: {
  visit: Visit;
  config: { label: string; color: string; icon: typeof CheckCircle2 };
  onUpdateStatus: (id: string, estado: VisitStatus) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const StatusIcon = config.icon;

  return (
    <div
      className={cn(
        "rounded-lg border border-border/40 p-3 transition-all duration-200",
        visit.estado === "REALIZADA" && "opacity-60",
        expanded ? "bg-muted/30" : "hover:bg-muted/20"
      )}
    >
      {/* Main row */}
      <button
        type="button"
        className="flex w-full items-start gap-3 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
          <StatusIcon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground truncate">
              {visit.cliente.nombre}
            </span>
            <Badge
              variant="secondary"
              className={cn("shrink-0 border-0 text-[10px]", config.color)}
            >
              {config.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {visit.cliente.direccion}
          </p>
          <div className="flex items-center gap-3 mt-1">
            {visit.hora_programada && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                {visit.hora_programada} hs
              </span>
            )}
            <span className="text-[11px] text-muted-foreground/70">
              {daysSince(visit.cliente.ultima_visita)}
            </span>
          </div>
        </div>
      </button>

      {/* Expanded actions */}
      {expanded && (
        <div className="mt-3 space-y-2 pl-10">
          {/* Phone */}
          {visit.cliente.telefono && (
            <a
              href={`tel:${visit.cliente.telefono}`}
              className="flex items-center gap-2 text-xs text-[var(--accent)] hover:underline"
            >
              <Phone className="h-3 w-3" />
              Llamar: {visit.cliente.telefono}
            </a>
          )}

          {/* Quick status buttons */}
          {visit.estado === "PENDIENTE" && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs text-green-700 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-950/30"
                onClick={() => onUpdateStatus(visit.id, "REALIZADA")}
              >
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Realizada
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs text-red-700 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/30"
                onClick={() => onUpdateStatus(visit.id, "NO_ATENDIDO")}
              >
                <XCircle className="mr-1 h-3 w-3" />
                No Atendido
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs text-blue-700 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-950/30"
                onClick={() => onUpdateStatus(visit.id, "REPROGRAMADA")}
              >
                <RotateCcw className="mr-1 h-3 w-3" />
                Reprogramar
              </Button>
            </div>
          )}

          {/* Link to create new order for this client */}
          <Link
            href={`/ventas/pedidos/nuevo?cliente_id=${visit.cliente.id}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:underline pt-1"
          >
            <Plus className="h-3 w-3" />
            Nuevo pedido para este cliente
          </Link>
        </div>
      )}
    </div>
  );
}

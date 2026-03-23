"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TIPO_EVENTO_LABELS } from "@pronto/shared/constants";
import {
  MapPin,
  CheckCircle,
  XCircle,
  AlertTriangle,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

const EVENT_ICONS: Record<string, typeof MapPin> = {
  LLEGADA: MapPin,
  ENTREGA: CheckCircle,
  NO_ENTREGA: XCircle,
  ENTREGA_PARCIAL: AlertTriangle,
  COBRO: DollarSign,
};

const EVENT_COLORS: Record<string, string> = {
  LLEGADA: "text-blue-500",
  ENTREGA: "text-green-500",
  NO_ENTREGA: "text-red-500",
  ENTREGA_PARCIAL: "text-yellow-500",
  COBRO: "text-emerald-600",
};

interface DeliveryEventCardProps {
  tipo: string;
  timestamp: string;
  comentario?: string;
  monto_cobrado?: number;
  className?: string;
}

export function DeliveryEventCard({
  tipo,
  timestamp,
  comentario,
  monto_cobrado,
  className,
}: DeliveryEventCardProps) {
  const Icon = EVENT_ICONS[tipo] || MapPin;
  const color = EVENT_COLORS[tipo] || "text-muted-foreground";

  return (
    <Card className={cn("shadow-sm", className)}>
      <CardContent className="flex items-start gap-3 p-4">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted",
            color
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">
              {TIPO_EVENTO_LABELS[tipo] || tipo}
            </p>
            <time className="text-xs text-muted-foreground whitespace-nowrap">
              {new Date(timestamp).toLocaleString("es-AR", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </time>
          </div>
          {comentario && (
            <p className="mt-1 text-sm text-muted-foreground">{comentario}</p>
          )}
          {tipo === "COBRO" && monto_cobrado != null && (
            <p className="mt-1 text-sm font-semibold text-emerald-600">
              ${monto_cobrado.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

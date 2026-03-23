"use client";

import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShoppingCart,
  Clock,
  ArrowRight,
  XCircle,
  PackageCheck,
} from "lucide-react";
import { useDashboardStats } from "@/hooks/queries/use-dashboard";
import { EmptyState } from "@/components/empty-state";
import { EmptyActivity } from "@/components/illustrations";
import type { LucideIcon } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  PENDIENTE_APROBACION: "Pendientes",
  EN_EVALUACION: "En evaluacion",
  APROBADO: "Aprobados",
  EN_PREPARACION: "En preparacion",
  LISTO_PARA_ENVIO: "Listos",
  ENVIADO: "Enviados",
  EN_REPARTO: "En reparto",
  ENTREGADO: "Entregados",
  ENTREGADO_PARCIALMENTE: "Parciales",
  CANCELADO: "Cancelados",
  NO_ENTREGADO: "No entregados",
  RECHAZADO: "Rechazados",
  RECLAMADO: "Reclamados",
};

function getActivityIcon(estado: string): { icon: LucideIcon; color: string } {
  switch (estado) {
    case "ENTREGADO":
    case "ENTREGADO_PARCIALMENTE":
      return { icon: PackageCheck, color: "#10B981" };
    case "CANCELADO":
    case "NO_ENTREGADO":
      return { icon: XCircle, color: "#EF4444" };
    case "PENDIENTE_APROBACION":
      return { icon: ShoppingCart, color: "#D97706" };
    default:
      return { icon: Clock, color: "#3B82F6" };
  }
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMin = Math.floor((now - then) / 60000);
  if (diffMin < 1) return "Ahora";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `Hace ${diffHrs}h`;
  const diffDays = Math.floor(diffHrs / 24);
  return `Hace ${diffDays}d`;
}

export function RecentActivityWidget() {
  const { data, isLoading } = useDashboardStats();

  const activityItems = useMemo(() => {
    if (!data) return [];
    return data.recent_activity.map((a) => {
      const { icon, color } = getActivityIcon(a.estado_nuevo);
      const statusLabel = STATUS_LABELS[a.estado_nuevo] || a.estado_nuevo;
      return {
        icon,
        color,
        text: `Pedido #${a.pedido_numero} ${statusLabel.toLowerCase()}`,
        detail: `Cliente: ${a.cliente_nombre}`,
        time: formatTimeAgo(a.created_at),
      };
    });
  }, [data]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-foreground">Actividad Reciente</p>
        <button className="flex items-center gap-1 text-xs font-medium text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]">
          Ver todo <ArrowRight className="h-3 w-3" />
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto space-y-1">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
          ))
        ) : activityItems.length === 0 ? (
          <EmptyState
            illustration={<EmptyActivity className="w-full h-full" />}
            title="Sin actividad reciente"
            description="La actividad de pedidos aparecera aqui."
            size="sm"
          />
        ) : (
          activityItems.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50"
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${item.color}15`, color: item.color }}
              >
                <item.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{item.text}</p>
                <p className="text-xs text-muted-foreground">{item.detail}</p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{item.time}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

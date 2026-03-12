"use client";

import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABELS } from "@nexora/shared/constants";

const STATUS_COLORS: Record<string, string> = {
  PENDIENTE_APROBACION: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  EN_EVALUACION: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
  APROBADO: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  APROBADO_REPARTIDOR: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  RECHAZADO: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
  EN_CONSOLIDACION: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400",
  EN_PREPARACION: "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400",
  LISTO_PARA_ENVIO: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-400",
  ENVIADO: "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400",
  ENTREGADO: "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400",
  ABASTECIDO: "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400",
  ENTREGADO_PARCIALMENTE: "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400",
  CANCELADO: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
  RECLAMADO: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400",
  PENDIENTE_ABASTECIMIENTO: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  NO_ENTREGADO: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
};

export function OrderStatusBadge({ estado }: { estado: string }) {
  const colorClass = STATUS_COLORS[estado] || "bg-muted text-muted-foreground";

  return (
    <Badge
      variant="secondary"
      className={`border-0 font-medium ${colorClass}`}
    >
      {ORDER_STATUS_LABELS[estado as keyof typeof ORDER_STATUS_LABELS] || estado}
    </Badge>
  );
}

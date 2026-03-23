"use client";

import { Badge } from "@/components/ui/badge";
import { ESTADO_REPARTO_LABELS } from "@pronto/shared/constants";

const variants: Record<string, string> = {
  PLANIFICADO: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  EN_CURSO: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  FINALIZADO: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  CANCELADO: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export function DeliveryStatusBadge({ estado }: { estado: string }) {
  return (
    <Badge className={variants[estado] || ""} variant="outline">
      {ESTADO_REPARTO_LABELS[estado] || estado}
    </Badge>
  );
}

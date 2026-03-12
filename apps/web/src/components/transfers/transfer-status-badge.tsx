"use client";

import { Badge } from "@/components/ui/badge";
import { ESTADO_TRANSFERENCIA_LABELS } from "@nexora/shared/constants";

const variants: Record<string, string> = {
  PENDIENTE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  APROBADA: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  EN_TRANSITO: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  COMPLETADA: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  CANCELADA: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export function TransferStatusBadge({ estado }: { estado: string }) {
  return (
    <Badge className={variants[estado] || ""} variant="outline">
      {ESTADO_TRANSFERENCIA_LABELS[estado] || estado}
    </Badge>
  );
}

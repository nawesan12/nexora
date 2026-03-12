"use client";

import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

const STEPS = [
  { key: "PENDIENTE", label: "Pendiente" },
  { key: "APROBADA", label: "Aprobada" },
  { key: "EN_TRANSITO", label: "En Tránsito" },
  { key: "COMPLETADA", label: "Completada" },
] as const;

interface TransferStatusTimelineProps {
  estado: string;
  fechas?: Partial<Record<string, string>>;
}

export function TransferStatusTimeline({
  estado,
  fechas = {},
}: TransferStatusTimelineProps) {
  const isCancelled = estado === "CANCELADA";
  const activeIndex = STEPS.findIndex((s) => s.key === estado);

  return (
    <div className="flex items-center gap-0 w-full">
      {STEPS.map((step, idx) => {
        const isCompleted = !isCancelled && activeIndex >= 0 && idx < activeIndex;
        const isActive = !isCancelled && idx === activeIndex;
        const fecha = fechas[step.key];

        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
                  isCompleted &&
                    "border-green-500 bg-green-500 text-white",
                  isActive &&
                    "border-primary bg-primary text-primary-foreground",
                  !isCompleted &&
                    !isActive &&
                    "border-muted-foreground/30 bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  idx + 1
                )}
              </div>
              <span
                className={cn(
                  "text-xs whitespace-nowrap",
                  isActive
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
              {fecha && (
                <span className="text-[10px] text-muted-foreground">
                  {new Date(fecha).toLocaleDateString("es-AR", {
                    day: "2-digit",
                    month: "short",
                  })}
                </span>
              )}
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 mx-2",
                  isCompleted ? "bg-green-500" : "bg-muted-foreground/20"
                )}
              />
            )}
          </div>
        );
      })}

      {isCancelled && (
        <div className="flex flex-col items-center gap-1 ml-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-red-500 bg-red-500 text-white">
            <X className="h-4 w-4" />
          </div>
          <span className="text-xs font-semibold text-red-500 whitespace-nowrap">
            Cancelada
          </span>
          {fechas["CANCELADA"] && (
            <span className="text-[10px] text-muted-foreground">
              {new Date(fechas["CANCELADA"]).toLocaleDateString("es-AR", {
                day: "2-digit",
                month: "short",
              })}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

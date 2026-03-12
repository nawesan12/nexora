"use client";

import type { HistorialPedido } from "@nexora/shared/types";
import { ORDER_STATUS_LABELS } from "@nexora/shared/constants";
import { OrderStatusBadge } from "./order-status-badge";

export function OrderStatusTimeline({ historial }: { historial: HistorialPedido[] }) {
  if (historial.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold">Historial de estados</h3>
      <div className="relative space-y-5 pl-7">
        {/* Vertical line */}
        <div className="absolute left-[9px] top-2 bottom-2 w-px bg-gradient-to-b from-primary/40 via-border to-border" />

        {historial.map((h, index) => (
          <div key={h.id} className="relative">
            {/* Dot */}
            <div
              className={`absolute -left-[19px] top-1.5 h-[11px] w-[11px] rounded-full ring-2 ring-background ${
                index === 0
                  ? "bg-primary shadow-sm shadow-primary/30"
                  : "bg-muted-foreground/30"
              }`}
            />
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                {h.estado_anterior && (
                  <>
                    <span className="text-sm text-muted-foreground">
                      {ORDER_STATUS_LABELS[h.estado_anterior as keyof typeof ORDER_STATUS_LABELS] || h.estado_anterior}
                    </span>
                    <span className="text-muted-foreground/60">&rarr;</span>
                  </>
                )}
                <OrderStatusBadge estado={h.estado_nuevo} />
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{new Date(h.created_at).toLocaleString("es-AR")}</span>
                {h.empleado_nombre && (
                  <>
                    <span className="text-muted-foreground/40">&middot;</span>
                    <span>por {h.empleado_nombre}</span>
                  </>
                )}
              </div>
              {h.comentario && (
                <p className="text-sm text-muted-foreground/80 bg-muted/50 rounded-md px-3 py-1.5">
                  {h.comentario}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

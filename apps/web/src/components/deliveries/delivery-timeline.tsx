"use client";

import { DeliveryEventCard } from "./delivery-event-card";

interface EventoReparto {
  id: string;
  tipo: string;
  timestamp: string;
  comentario?: string;
  monto_cobrado?: number;
}

interface DeliveryTimelineProps {
  eventos: EventoReparto[];
}

export function DeliveryTimeline({ eventos }: DeliveryTimelineProps) {
  if (eventos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No hay eventos registrados.
      </p>
    );
  }

  return (
    <div className="relative space-y-0">
      {eventos.map((evento, idx) => (
        <div key={evento.id} className="relative flex gap-4">
          {/* Connecting line */}
          {idx < eventos.length - 1 && (
            <div className="absolute left-[18px] top-[44px] bottom-0 w-px bg-border" />
          )}
          {/* Event card */}
          <div className="relative z-10 flex-1 pb-4">
            <DeliveryEventCard
              tipo={evento.tipo}
              timestamp={evento.timestamp}
              comentario={evento.comentario}
              monto_cobrado={evento.monto_cobrado}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

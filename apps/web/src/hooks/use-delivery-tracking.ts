"use client";

import { useEffect, useState, useCallback } from "react";
import { useSocket } from "@/providers/socket-provider";
import type { EventoReparto } from "@pronto/shared/types";

interface DriverLocation {
  latitud: number;
  longitud: number;
  timestamp: string;
}

export function useDeliveryTracking(repartoId: string) {
  const socket = useSocket();
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [events, setEvents] = useState<EventoReparto[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  useEffect(() => {
    if (!socket || !repartoId) return;

    const room = `reparto:${repartoId}`;
    socket.joinRoom(room);

    const unsubLocation = socket.on("delivery:location", (payload: unknown) => {
      const loc = payload as DriverLocation;
      setDriverLocation(loc);
      setLastUpdate(new Date().toISOString());
    });

    const unsubEvent = socket.on("delivery:updated", (payload: unknown) => {
      const evt = payload as EventoReparto;
      if (evt.id) {
        setEvents((prev) => [...prev, evt]);
      }
      setLastUpdate(new Date().toISOString());
    });

    return () => {
      socket.leaveRoom(room);
      unsubLocation();
      unsubEvent();
    };
  }, [socket, repartoId]);

  const reset = useCallback(() => {
    setDriverLocation(null);
    setEvents([]);
    setLastUpdate(null);
  }, []);

  return { driverLocation, events, lastUpdate, reset };
}

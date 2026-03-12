"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import { WebSocketClient } from "@/lib/ws-client";
import { useUserStore } from "@/store/user-store";

const WS_URL =
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080").replace(
    /^http/,
    "ws",
  ) + "/ws";

const SocketContext = createContext<WebSocketClient | null>(null);

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const clientRef = useRef<WebSocketClient | null>(null);
  const user = useUserStore((s) => s.user);

  useEffect(() => {
    if (!user) {
      clientRef.current?.disconnect();
      clientRef.current = null;
      return;
    }

    const client = new WebSocketClient(WS_URL);
    client.connect(user.id);

    // Join user-specific and branch rooms
    client.joinRoom(`user:${user.id}`);
    if (user.sucursales) {
      user.sucursales.forEach((branch) => {
        client.joinRoom(`branch:${branch.id}`);
      });
    }

    clientRef.current = client;

    return () => {
      client.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={clientRef.current}>
      {children}
    </SocketContext.Provider>
  );
}

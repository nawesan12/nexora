"use client";

import { useEffect } from "react";
import { useUserStore } from "@/store/user-store";

const CHANNEL_NAME = "pronto-session";

interface SessionMessage {
  type: "LOGIN" | "LOGOUT" | "USER_UPDATE";
  payload?: unknown;
}

export function useSessionSync() {
  const { setUser, clearUser } = useUserStore();

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;

    const channel = new BroadcastChannel(CHANNEL_NAME);

    channel.onmessage = (event: MessageEvent<SessionMessage>) => {
      const { type, payload } = event.data;
      switch (type) {
        case "LOGIN":
          if (payload)
            setUser(payload as import("@pronto/shared/types").UserInfo);
          break;
        case "LOGOUT":
          clearUser();
          window.location.href = "/login";
          break;
        case "USER_UPDATE":
          if (payload)
            setUser(payload as import("@pronto/shared/types").UserInfo);
          break;
      }
    };

    return () => channel.close();
  }, [setUser, clearUser]);
}

export function broadcastSession(
  type: SessionMessage["type"],
  payload?: unknown,
) {
  if (typeof BroadcastChannel === "undefined") return;
  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.postMessage({ type, payload });
  channel.close();
}

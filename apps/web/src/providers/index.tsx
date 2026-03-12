"use client";

import { QueryProvider } from "./query-provider";
import { SocketProvider } from "./socket-provider";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <SocketProvider>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </SocketProvider>
    </QueryProvider>
  );
}

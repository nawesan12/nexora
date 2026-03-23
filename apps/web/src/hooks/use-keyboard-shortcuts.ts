"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useKeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Only trigger with Alt key
      if (!e.altKey) return;

      switch (e.key) {
        case "d":
          e.preventDefault();
          router.push("/dashboard");
          break;
        case "p":
          e.preventDefault();
          router.push("/ventas/pedidos");
          break;
        case "c":
          e.preventDefault();
          router.push("/ventas/clientes");
          break;
        case "i":
          e.preventDefault();
          router.push("/inventario/productos");
          break;
        case "f":
          e.preventDefault();
          router.push("/finanzas");
          break;
        case "n":
          e.preventDefault();
          router.push("/ventas/pedidos/nuevo");
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router]);
}

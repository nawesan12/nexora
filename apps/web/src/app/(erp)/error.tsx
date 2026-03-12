"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-6 max-w-sm text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-10 w-10 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Algo salio mal
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {error.message || "Ocurrio un error inesperado. Intenta nuevamente."}
          </p>
        </div>
        <Button onClick={reset} variant="outline" className="h-10">
          <RotateCcw className="mr-2 h-4 w-4" />
          Reintentar
        </Button>
      </div>
    </div>
  );
}

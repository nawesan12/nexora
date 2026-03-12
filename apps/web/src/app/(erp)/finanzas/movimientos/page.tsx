"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeftRight } from "lucide-react";

export default function MovimientosPage() {
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Movimientos
        </h1>
        <p className="text-sm text-muted-foreground">
          Registro de ingresos y egresos por caja
        </p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent)]/10 mb-4">
            <ArrowLeftRight className="h-8 w-8 text-[var(--accent)]" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            Movimientos por Caja
          </h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Los movimientos se visualizan dentro de cada caja. Selecciona una
            caja para ver sus movimientos.
          </p>
          <Button asChild className="mt-4">
            <Link href="/finanzas/cajas">
              Ir a Cajas
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

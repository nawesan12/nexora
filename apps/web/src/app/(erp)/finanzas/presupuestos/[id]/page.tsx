"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { usePresupuesto } from "@/hooks/queries/use-finance";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Loader2, DollarSign, TrendingDown, Wallet } from "lucide-react";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(n);
}

const PRESUPUESTO_COLORS: Record<string, string> = {
  BORRADOR: "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400",
  ACTIVO: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  CERRADO: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
  EXCEDIDO: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
};

const estadoLabels: Record<string, string> = {
  BORRADOR: "Borrador",
  ACTIVO: "Activo",
  CERRADO: "Cerrado",
  EXCEDIDO: "Excedido",
};

export default function PresupuestoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = usePresupuesto(id);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Cargando presupuesto...</span>
      </div>
    );
  }

  const presupuesto = data;

  if (!presupuesto) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        Presupuesto no encontrado
      </div>
    );
  }

  const p = presupuesto as any;
  const porcentaje =
    p.monto > 0 ? Math.min(Math.round((p.gastado / p.monto) * 100), 100) : 0;
  const restante = p.monto - (p.gastado || 0);

  const summaryCards = [
    {
      label: "Presupuestado",
      value: formatCurrency(p.monto),
      icon: DollarSign,
      color: "#D97706",
    },
    {
      label: "Gastado",
      value: formatCurrency(p.gastado || 0),
      icon: TrendingDown,
      color: "#EF4444",
    },
    {
      label: "Restante",
      value: formatCurrency(restante),
      icon: Wallet,
      color: "#10B981",
    },
  ];

  return (
    <div className="space-y-5">
      <Link
        href="/finanzas/presupuestos"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Presupuestos
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {p.nombre}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date(p.fecha_inicio).toLocaleDateString("es-AR")} -{" "}
            {new Date(p.fecha_fin).toLocaleDateString("es-AR")}
          </p>
        </div>
        <Badge
          variant="secondary"
          className={`border-0 text-xs font-medium ${PRESUPUESTO_COLORS[p.estado] || ""}`}
        >
          {estadoLabels[p.estado] || p.estado}
        </Badge>
      </div>

      {/* Progress */}
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Utilización</span>
            <span className="font-semibold text-foreground">{porcentaje}%</span>
          </div>
          <Progress value={porcentaje} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Gastado: {formatCurrency(p.gastado || 0)}</span>
            <span>Total: {formatCurrency(p.monto)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {summaryCards.map((card) => (
          <Card
            key={card.label}
            className="border-0 shadow-sm relative overflow-hidden"
          >
            <div
              className="absolute top-0 left-0 right-0 h-1 rounded-t-lg"
              style={{ backgroundColor: card.color }}
            />
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {card.label}
                </p>
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: `${card.color}15`,
                    color: card.color,
                  }}
                >
                  <card.icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-bold tracking-tight">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Description */}
      {p.descripcion && (
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              Descripción
            </p>
            <p className="text-sm text-foreground">{p.descripcion}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

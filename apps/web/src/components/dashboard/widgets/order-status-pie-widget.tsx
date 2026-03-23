"use client";

import { useMemo } from "react";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Cell,
  Pie,
  PieChart,
  Label,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats } from "@/hooks/queries/use-dashboard";
import { ChartEmptyState } from "@/components/chart-empty-state";

const STATUS_LABELS: Record<string, string> = {
  PENDIENTE_APROBACION: "Pendientes",
  EN_EVALUACION: "En evaluacion",
  APROBADO: "Aprobados",
  EN_PREPARACION: "En preparacion",
  LISTO_PARA_ENVIO: "Listos",
  ENVIADO: "Enviados",
  EN_REPARTO: "En reparto",
  ENTREGADO: "Entregados",
  ENTREGADO_PARCIALMENTE: "Parciales",
  CANCELADO: "Cancelados",
  NO_ENTREGADO: "No entregados",
  RECHAZADO: "Rechazados",
  RECLAMADO: "Reclamados",
};

const STATUS_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

export function OrderStatusPieWidget() {
  const { data, isLoading } = useDashboardStats();

  const orderStatusData = useMemo(() => {
    if (!data) return [];
    return data.orders_by_status.map((s, i) => ({
      status: STATUS_LABELS[s.estado] || s.estado,
      value: Number(s.count),
      fill: STATUS_COLORS[i % STATUS_COLORS.length],
    }));
  }, [data]);

  const statusChartConfig = useMemo<ChartConfig>(() => {
    const cfg: ChartConfig = { value: { label: "Pedidos" } };
    for (const entry of orderStatusData) {
      cfg[entry.status] = { label: entry.status, color: entry.fill };
    }
    return cfg;
  }, [orderStatusData]);

  const totalOrders = orderStatusData.reduce((s, d) => s + d.value, 0);

  if (isLoading) {
    return (
      <div className="h-full flex flex-col gap-2 p-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="flex-1 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-2">
        <p className="text-sm font-semibold text-foreground">Estado de Pedidos</p>
        <p className="text-xs text-muted-foreground">Distribucion actual</p>
      </div>
      <div className="flex-1 min-h-0">
        {orderStatusData.length === 0 ? (
          <ChartEmptyState variant="pie" height="100%" title="Sin pedidos" description="Los estados de pedidos apareceran aqui." />
        ) : (
          <>
            <ChartContainer config={statusChartConfig} className="mx-auto h-[180px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={orderStatusData}
                  dataKey="value"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                            <tspan x={viewBox.cx} y={(viewBox.cy || 0) - 8} className="fill-foreground text-2xl font-bold">
                              {totalOrders}
                            </tspan>
                            <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 12} className="fill-muted-foreground text-xs">
                              pedidos
                            </tspan>
                          </text>
                        );
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1.5">
              {orderStatusData.map((entry) => (
                <div key={entry.status} className="flex items-center gap-1.5 text-xs">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.fill }} />
                  <span className="text-muted-foreground">{entry.status}</span>
                  <span className="font-semibold">{entry.value}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

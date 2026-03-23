"use client";

import { useMemo } from "react";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats } from "@/hooks/queries/use-dashboard";
import { ChartEmptyState } from "@/components/chart-empty-state";

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

const ordersChartConfig: ChartConfig = {
  pedidos: { label: "Pedidos", color: "var(--color-chart-1)" },
};

export function WeeklyOrdersWidget() {
  const { data, isLoading } = useDashboardStats();

  const weeklyData = useMemo(() => {
    if (!data) return [];
    return data.weekly_orders.map((d) => {
      const date = new Date(d.day + "T12:00:00");
      const dayLabel = DAY_LABELS[date.getDay()] || d.day;
      return { day: dayLabel, pedidos: Number(d.count) };
    });
  }, [data]);

  if (isLoading) {
    return (
      <div className="h-full flex flex-col gap-2 p-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="flex-1 w-full rounded-lg" />
      </div>
    );
  }

  const totalWeekly = weeklyData.reduce((s, d) => s + d.pedidos, 0);
  const avgPerDay = weeklyData.length > 0 ? Math.round(totalWeekly / weeklyData.length) : 0;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm font-semibold text-foreground">Pedidos de la Semana</p>
          <p className="text-xs text-muted-foreground">{totalWeekly} pedidos totales</p>
        </div>
        <Badge variant="secondary" className="border border-border/50 font-mono text-xs">
          Prom. {avgPerDay}/dia
        </Badge>
      </div>
      <div className="flex-1 min-h-0">
        {weeklyData.length === 0 ? (
          <ChartEmptyState variant="bar" height="100%" title="Sin pedidos esta semana" description="Los pedidos semanales apareceran aqui." />
        ) : (
          <ChartContainer config={ordersChartConfig} className="h-full w-full">
            <BarChart data={weeklyData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="barGradientWidget" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={1} />
                  <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} className="text-xs" />
              <YAxis tickLine={false} axisLine={false} className="text-xs" width={30} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="pedidos" fill="url(#barGradientWidget)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </div>
    </div>
  );
}

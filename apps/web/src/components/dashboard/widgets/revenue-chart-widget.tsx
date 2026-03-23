"use client";

import { useMemo } from "react";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats } from "@/hooks/queries/use-dashboard";
import { ChartEmptyState } from "@/components/chart-empty-state";

const MONTH_LABELS: Record<string, string> = {
  "01": "Ene", "02": "Feb", "03": "Mar", "04": "Abr",
  "05": "May", "06": "Jun", "07": "Jul", "08": "Ago",
  "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dic",
};

const revenueChartConfig: ChartConfig = {
  ingresos: { label: "Ingresos", color: "var(--color-chart-1)" },
  gastos: { label: "Gastos", color: "var(--color-chart-2)" },
};

export function RevenueChartWidget() {
  const { data, isLoading } = useDashboardStats();

  const revenueData = useMemo(() => {
    if (!data) return [];
    const byMonth = new Map<string, { month: string; ingresos: number; gastos: number }>();
    for (const r of data.revenue_chart) {
      const mm = r.month.split("-")[1];
      const label = MONTH_LABELS[mm] || mm;
      byMonth.set(r.month, { month: label, ingresos: r.total, gastos: 0 });
    }
    for (const g of data.expenses_chart) {
      const mm = g.month.split("-")[1];
      const label = MONTH_LABELS[mm] || mm;
      const existing = byMonth.get(g.month);
      if (existing) {
        existing.gastos = g.total;
      } else {
        byMonth.set(g.month, { month: label, ingresos: 0, gastos: g.total });
      }
    }
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
  }, [data]);

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
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm font-semibold text-foreground">Ingresos vs Gastos</p>
          <p className="text-xs text-muted-foreground">Ultimos 6 meses</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-[var(--chart-1)]" />
            <span className="text-muted-foreground">Ingresos</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-[var(--chart-2)]" />
            <span className="text-muted-foreground">Gastos</span>
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        {revenueData.length === 0 ? (
          <ChartEmptyState variant="area" height="100%" title="Sin datos de ingresos" description="Los datos apareceran cuando se registren pedidos y gastos." />
        ) : (
          <ChartContainer config={revenueChartConfig} className="h-full w-full">
            <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="fillIngresos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fillGastos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-chart-2)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} className="text-xs" />
              <YAxis tickLine={false} axisLine={false} className="text-xs" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} width={50} />
              <ChartTooltip content={<ChartTooltipContent formatter={(value) => `$${Number(value).toLocaleString("es-AR")}`} />} />
              <Area type="monotone" dataKey="ingresos" stroke="var(--color-chart-1)" fill="url(#fillIngresos)" strokeWidth={2} />
              <Area type="monotone" dataKey="gastos" stroke="var(--color-chart-2)" fill="url(#fillGastos)" strokeWidth={2} />
            </AreaChart>
          </ChartContainer>
        )}
      </div>
    </div>
  );
}

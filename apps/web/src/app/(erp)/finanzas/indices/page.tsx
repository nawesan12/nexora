"use client";

import { useRef, useLayoutEffect, useMemo } from "react";
import { useFinancialIndices } from "@/hooks/queries/use-bank-accounts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  ShieldCheck,
  Percent,
  ShoppingCart,
  CreditCard,
  Activity,
} from "lucide-react";
import gsap from "gsap";
import type { LucideIcon } from "lucide-react";
import { ChartEmptyState } from "@/components/chart-empty-state";

function formatCurrency(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${Math.round(n / 1000).toLocaleString("es-AR")}K`;
  return `$${n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface IndexCardDef {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  color: string;
  status: "good" | "warning" | "bad" | "neutral";
}

function KpiSkeleton() {
  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <div className="h-1 bg-muted" />
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-9 rounded-lg" />
      </CardHeader>
      <CardContent className="pb-4">
        <Skeleton className="h-8 w-24 mb-2" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

const statusColors = {
  good: "#10B981",
  warning: "#F59E0B",
  bad: "#EF4444",
  neutral: "#3B82F6",
};

export default function IndicesFinancierosPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useFinancialIndices();

  useLayoutEffect(() => {
    if (!pageRef.current || isLoading) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".indices-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      );
      gsap.fromTo(
        ".indices-card",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: "power2.out", delay: 0.2 },
      );
      gsap.fromTo(
        ".indices-chart-card",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: "power2.out", delay: 0.5 },
      );
    }, pageRef);

    return () => ctx.revert();
  }, [isLoading, data]);

  const cards: IndexCardDef[] = data
    ? [
        {
          title: "Current Ratio",
          value: data.current_ratio.toFixed(2),
          subtitle: data.current_ratio >= 1.5 ? "Saludable" : data.current_ratio >= 1 ? "Aceptable" : "Atención",
          icon: ShieldCheck,
          color: data.current_ratio >= 1.5 ? "#10B981" : data.current_ratio >= 1 ? "#F59E0B" : "#EF4444",
          status: data.current_ratio >= 1.5 ? "good" : data.current_ratio >= 1 ? "warning" : "bad",
        },
        {
          title: "Margen de Ganancia",
          value: `${data.profit_margin.toFixed(1)}%`,
          subtitle: data.profit_margin > 20 ? "Excelente" : data.profit_margin > 10 ? "Bueno" : "Bajo",
          icon: Percent,
          color: data.profit_margin > 20 ? "#10B981" : data.profit_margin > 10 ? "#F59E0B" : "#EF4444",
          status: data.profit_margin > 20 ? "good" : data.profit_margin > 10 ? "warning" : "bad",
        },
        {
          title: "DSO (Dias de Cobro)",
          value: `${data.dso.toFixed(0)} dias`,
          subtitle: data.dso <= 30 ? "Optimo" : data.dso <= 60 ? "Aceptable" : "Alto",
          icon: Clock,
          color: data.dso <= 30 ? "#10B981" : data.dso <= 60 ? "#F59E0B" : "#EF4444",
          status: data.dso <= 30 ? "good" : data.dso <= 60 ? "warning" : "bad",
        },
        {
          title: "DPO (Dias de Pago)",
          value: `${data.dpo.toFixed(0)} dias`,
          subtitle: data.dpo >= 30 ? "Favorable" : "Rapido",
          icon: Clock,
          color: "#3B82F6",
          status: "neutral",
        },
        {
          title: "Ingresos (30d)",
          value: formatCurrency(data.revenue_30d),
          subtitle: "Ultimos 30 dias",
          icon: TrendingUp,
          color: "#10B981",
          status: "good",
        },
        {
          title: "Gastos (30d)",
          value: formatCurrency(data.expenses_30d),
          subtitle: "Ultimos 30 dias",
          icon: TrendingDown,
          color: "#EF4444",
          status: "bad",
        },
        {
          title: "Resultado Neto (30d)",
          value: formatCurrency(data.net_income_30d),
          subtitle: data.net_income_30d >= 0 ? "Positivo" : "Negativo",
          icon: DollarSign,
          color: data.net_income_30d >= 0 ? "#10B981" : "#EF4444",
          status: data.net_income_30d >= 0 ? "good" : "bad",
        },
        {
          title: "Ticket Promedio",
          value: formatCurrency(data.avg_order_value),
          subtitle: `${data.orders_count_30d} pedidos en 30d`,
          icon: ShoppingCart,
          color: "#D97706",
          status: "neutral",
        },
        {
          title: "Pedidos (30d)",
          value: String(data.orders_count_30d),
          subtitle: "Ultimos 30 dias",
          icon: BarChart3,
          color: "#3B82F6",
          status: "neutral",
        },
        {
          title: "Tasa de Cobranza",
          value: `${data.collection_rate.toFixed(1)}%`,
          subtitle: data.collection_rate >= 90 ? "Excelente" : data.collection_rate >= 70 ? "Aceptable" : "Mejorar",
          icon: CreditCard,
          color: data.collection_rate >= 90 ? "#10B981" : data.collection_rate >= 70 ? "#F59E0B" : "#EF4444",
          status: data.collection_rate >= 90 ? "good" : data.collection_rate >= 70 ? "warning" : "bad",
        },
      ]
    : [];

  // Revenue vs Expenses bar chart data
  const revenueExpenseData = useMemo(() => {
    if (!data) return [];
    return [
      { name: "Ingresos", value: data.revenue_30d, fill: "#10B981" },
      { name: "Gastos", value: data.expenses_30d, fill: "#EF4444" },
      { name: "Neto", value: Math.max(0, data.net_income_30d), fill: "#D97706" },
    ];
  }, [data]);

  // Radar chart data — normalized to 0-100 scale
  const radarData = useMemo(() => {
    if (!data) return [];
    return [
      {
        metric: "Current Ratio",
        value: Math.min(100, (data.current_ratio / 3) * 100),
      },
      {
        metric: "Margen",
        value: Math.min(100, Math.max(0, data.profit_margin)),
      },
      {
        metric: "Cobranza",
        value: data.collection_rate,
      },
      {
        metric: "DSO Score",
        value: Math.max(0, 100 - data.dso),
      },
      {
        metric: "Actividad",
        value: Math.min(100, (data.orders_count_30d / 50) * 100),
      },
    ];
  }, [data]);

  const barChartConfig: ChartConfig = {
    value: { label: "Monto" },
    Ingresos: { label: "Ingresos", color: "#10B981" },
    Gastos: { label: "Gastos", color: "#EF4444" },
    Neto: { label: "Neto", color: "#D97706" },
  };

  return (
    <div ref={pageRef} className="space-y-8">
      {/* Header */}
      <div className="indices-header">
        <h1 className="text-3xl font-bold tracking-tight">Indices Financieros</h1>
        <p className="text-muted-foreground mt-1">
          KPIs y metricas clave de la salud financiera del negocio
        </p>
      </div>

      {/* Index Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {isLoading
          ? Array.from({ length: 10 }).map((_, i) => <KpiSkeleton key={i} />)
          : cards.map((card) => (
              <Card
                key={card.title}
                className="indices-card border-0 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
              >
                <div
                  className="h-1"
                  style={{ backgroundColor: statusColors[card.status] }}
                />
                <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${card.color}15` }}
                  >
                    <card.icon className="h-4 w-4" style={{ color: card.color }} />
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="text-2xl font-bold tracking-tight">{card.value}</div>
                  <p
                    className="text-xs mt-1 font-medium"
                    style={{ color: statusColors[card.status] }}
                  >
                    {card.subtitle}
                  </p>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Charts */}
      {!isLoading && data && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Revenue vs Expenses Bar Chart */}
          <Card className="indices-chart-card border-0 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle className="text-base font-semibold">
                    Ingresos vs Gastos
                  </CardTitle>
                  <CardDescription>Comparativa ultimos 30 dias</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {revenueExpenseData.every((d) => d.value === 0) ? (
                <ChartEmptyState
                  variant="bar"
                  height="300px"
                  title="Sin datos financieros"
                  description="Las barras aparecerán al registrar comprobantes y gastos."
                />
              ) : (
                <ChartContainer config={barChartConfig} className="h-[300px] w-full">
                  <BarChart
                    data={revenueExpenseData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted/50"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      className="text-xs"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      className="text-xs"
                      tickFormatter={(v) =>
                        v >= 1000000
                          ? `$${(v / 1000000).toFixed(1)}M`
                          : `$${(v / 1000).toFixed(0)}K`
                      }
                      width={60}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) =>
                            `$${Number(value).toLocaleString("es-AR")}`
                          }
                        />
                      }
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {revenueExpenseData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Radar Chart */}
          <Card className="indices-chart-card border-0 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle className="text-base font-semibold">
                    Perfil Financiero
                  </CardTitle>
                  <CardDescription>
                    Indicadores normalizados (0-100)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {radarData.every((d) => d.value === 0) ? (
                <ChartEmptyState
                  variant="bar"
                  height="300px"
                  title="Sin datos suficientes"
                  description="El perfil se construirá con actividad financiera."
                />
              ) : (
                <div className="h-[300px] w-full flex items-center justify-center">
                  <RadarChart
                    width={400}
                    height={300}
                    data={radarData}
                    cx="50%"
                    cy="50%"
                    outerRadius="70%"
                  >
                    <PolarGrid stroke="hsl(var(--muted-foreground) / 0.2)" />
                    <PolarAngleAxis
                      dataKey="metric"
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 100]}
                      tick={{ fontSize: 10 }}
                    />
                    <Radar
                      name="Score"
                      dataKey="value"
                      stroke="#D97706"
                      fill="#D97706"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Ratio Gauge-like Card */}
          <Card className="indices-chart-card border-0 shadow-sm lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">
                Detalle del Current Ratio
              </CardTitle>
              <CardDescription>
                Activos corrientes / Pasivos corrientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-8">
                {/* Visual gauge */}
                <div className="flex-1">
                  <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(100, (data.current_ratio / 3) * 100)}%`,
                        backgroundColor:
                          data.current_ratio >= 1.5
                            ? "#10B981"
                            : data.current_ratio >= 1
                              ? "#F59E0B"
                              : "#EF4444",
                      }}
                    />
                    {/* Marker at 1.0 */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-foreground/50"
                      style={{ left: `${(1 / 3) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>0</span>
                    <span className="font-medium">1.0 (minimo)</span>
                    <span>1.5 (ideal)</span>
                    <span>3.0+</span>
                  </div>
                </div>

                {/* Value display */}
                <div className="text-center min-w-[120px]">
                  <div
                    className="text-4xl font-bold"
                    style={{
                      color:
                        data.current_ratio >= 1.5
                          ? "#10B981"
                          : data.current_ratio >= 1
                            ? "#F59E0B"
                            : "#EF4444",
                    }}
                  >
                    {data.current_ratio.toFixed(2)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {data.current_ratio >= 1.5
                      ? "Posicion saludable"
                      : data.current_ratio >= 1
                        ? "Posicion aceptable"
                        : "Requiere atencion"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

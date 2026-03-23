"use client";

import { useState, useRef, useLayoutEffect, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/lib/reports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ArrowLeft, TrendingUp, Receipt, ShoppingCart, DollarSign, BarChart3 } from "lucide-react";
import gsap from "gsap";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n);
}

type DateRange = "today" | "week" | "month";

function getDateRange(range: DateRange): { desde: string; hasta: string } {
  const now = new Date();
  const hasta = now.toISOString().slice(0, 10);

  switch (range) {
    case "today":
      return { desde: hasta, hasta };
    case "week": {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return { desde: weekAgo.toISOString().slice(0, 10), hasta };
    }
    case "month": {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return { desde: monthAgo.toISOString().slice(0, 10), hasta };
    }
  }
}

export default function POSAnalyticsPage() {
  const [range, setRange] = useState<DateRange>("month");
  const containerRef = useRef<HTMLDivElement>(null);

  const { desde, hasta } = useMemo(() => getDateRange(range), [range]);

  const { data: salesData, isLoading: loadingSales } = useQuery({
    queryKey: ["report-sales", desde, hasta],
    queryFn: () => reportsApi.sales({ desde, hasta }),
  });

  const { data: productData, isLoading: loadingProducts } = useQuery({
    queryKey: ["report-products", desde, hasta],
    queryFn: () => reportsApi.products({ desde, hasta }),
  });

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".pos-analytics", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: "power2.out" });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  // Compute KPIs from sales data
  const totalVentas = salesData?.by_period?.reduce((sum, p) => sum + p.total, 0) ?? 0;
  const totalTickets = salesData?.by_period?.reduce((sum, p) => sum + p.count, 0) ?? 0;
  const ticketPromedio = totalTickets > 0 ? totalVentas / totalTickets : 0;

  const isLoading = loadingSales || loadingProducts;

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="pos-analytics flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/ventas/pos"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
              <BarChart3 className="h-5 w-5 text-[var(--accent)]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">POS Analytics</h1>
              <p className="text-sm text-muted-foreground">Analisis de ventas en punto de venta</p>
            </div>
          </div>
        </div>
        <Select value={range} onValueChange={(v) => setRange(v as DateRange)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hoy</SelectItem>
            <SelectItem value="week">Esta semana</SelectItem>
            <SelectItem value="month">Este mes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="pos-analytics grid gap-4 sm:grid-cols-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
              <DollarSign className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Ventas</p>
              {isLoading ? (
                <Skeleton className="h-7 w-28 mt-1" />
              ) : (
                <p className="text-2xl font-bold tabular-nums">{formatCurrency(totalVentas)}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
              <Receipt className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cantidad Tickets</p>
              {isLoading ? (
                <Skeleton className="h-7 w-16 mt-1" />
              ) : (
                <p className="text-2xl font-bold tabular-nums">{totalTickets}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10">
              <TrendingUp className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ticket Promedio</p>
              {isLoading ? (
                <Skeleton className="h-7 w-24 mt-1" />
              ) : (
                <p className="text-2xl font-bold tabular-nums">{formatCurrency(ticketPromedio)}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Chart */}
      <Card className="pos-analytics border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Ventas por Periodo</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : salesData?.by_period && salesData.by_period.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData.by_period}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="total" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">Sin datos para el periodo seleccionado</p>
          )}
        </CardContent>
      </Card>

      {/* Top Products */}
      <Card className="pos-analytics border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Top Productos Vendidos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : productData?.top_sellers && productData.top_sellers.length > 0 ? (
            <div className="space-y-3">
              {productData.top_sellers.slice(0, 10).map((item, i) => {
                const maxVal = productData.top_sellers[0]?.value ?? 1;
                const pct = (item.value / maxVal) * 100;
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate mr-2 font-medium">{item.label}</span>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge variant="secondary" className="text-xs">{item.count} uds</Badge>
                        <span className="font-semibold tabular-nums">{formatCurrency(item.value)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">Sin datos</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

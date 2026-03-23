"use client";

import { useRef, useLayoutEffect } from "react";
import { useFinanceResumen } from "@/hooks/queries/use-finance";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRightLeft,
  FileText,
} from "lucide-react";
import gsap from "gsap";
import type { LucideIcon } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { EmptyFinance } from "@/components/illustrations";

function formatCurrency(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${Math.round(n / 1000).toLocaleString("es-AR")}K`;
  return `$${n.toLocaleString("es-AR")}`;
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMin = Math.floor((now - then) / 60000);
  if (diffMin < 1) return "Ahora";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `Hace ${diffHrs}h`;
  const diffDays = Math.floor(diffHrs / 24);
  return `Hace ${diffDays}d`;
}

interface KpiDef {
  title: string;
  value: string;
  icon: LucideIcon;
  color: string;
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
        <Skeleton className="h-8 w-24" />
      </CardContent>
    </Card>
  );
}

export default function FinanzasResumenPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useFinanceResumen();

  useLayoutEffect(() => {
    if (!pageRef.current || isLoading) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".finance-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      );
      gsap.fromTo(
        ".finance-kpi-card",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: "power2.out", delay: 0.2 },
      );
      gsap.fromTo(
        ".finance-bottom-card",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: "power2.out", delay: 0.6 },
      );
    }, pageRef);

    return () => ctx.revert();
  }, [isLoading, data]);

  const kpis: KpiDef[] = data
    ? [
        { title: "Saldo Total Cajas", value: formatCurrency(data.saldo_cajas), icon: DollarSign, color: "#D97706" },
        { title: "Ingresos del Mes", value: formatCurrency(data.total_ingresos), icon: TrendingUp, color: "#10B981" },
        { title: "Egresos del Mes", value: formatCurrency(data.total_egresos), icon: TrendingDown, color: "#EF4444" },
        { title: "Cheques Pendientes", value: String(data.total_cheques_pendientes), icon: CreditCard, color: "#3B82F6" },
        { title: "Gastos del Mes", value: formatCurrency(data.total_gastos_mes), icon: Receipt, color: "#F59E0B" },
      ]
    : [];

  const movimientos = data?.ultimos_movimientos ?? [];
  const cheques = data?.cheques_por_vencer ?? [];

  const tipoColors: Record<string, { icon: LucideIcon; color: string }> = {
    INGRESO: { icon: ArrowUpRight, color: "#10B981" },
    EGRESO: { icon: ArrowDownRight, color: "#EF4444" },
    AJUSTE: { icon: ArrowRightLeft, color: "#3B82F6" },
  };

  return (
    <div ref={pageRef} className="space-y-8">
      {/* Header */}
      <div className="finance-header">
        <h1 className="text-3xl font-bold tracking-tight">Resumen Financiero</h1>
        <p className="text-muted-foreground mt-1">
          Panorama general de la situación financiera
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => <KpiSkeleton key={i} />)
          : kpis.map((kpi) => (
              <Card
                key={kpi.title}
                className="finance-kpi-card border-0 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
              >
                <div className="h-1" style={{ backgroundColor: kpi.color }} />
                <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {kpi.title}
                  </CardTitle>
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${kpi.color}15` }}
                  >
                    <kpi.icon className="h-4 w-4" style={{ color: kpi.color }} />
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="text-3xl font-bold tracking-tight">{kpi.value}</div>
                </CardContent>
              </Card>
            ))
        }
      </div>

      {/* Bottom Section */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Últimos Movimientos */}
        <Card className="finance-bottom-card border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />
              Últimos Movimientos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : movimientos.length === 0 ? (
              <EmptyState
                illustration={<EmptyFinance className="w-full h-full" />}
                title="Sin movimientos recientes"
                description="Los movimientos aparecerán aquí al registrar operaciones en cajas."
                size="sm"
              />
            ) : (
              <div className="space-y-1">
                {movimientos.map((m) => {
                  const tc = tipoColors[m.tipo] || tipoColors.AJUSTE;
                  const Icon = tc.icon;
                  return (
                    <div
                      key={m.id}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50"
                    >
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${tc.color}15`, color: tc.color }}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {m.concepto}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {m.caja_nombre}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p
                          className="text-sm font-semibold"
                          style={{ color: m.tipo === "INGRESO" ? "#10B981" : m.tipo === "EGRESO" ? "#EF4444" : undefined }}
                        >
                          {m.tipo === "EGRESO" ? "-" : m.tipo === "INGRESO" ? "+" : ""}
                          ${m.monto.toLocaleString("es-AR")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTimeAgo(m.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cheques por Vencer */}
        <Card className="finance-bottom-card border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              Cheques por Vencer
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : cheques.length === 0 ? (
              <EmptyState
                illustration={<EmptyFinance className="w-full h-full" />}
                title="Sin cheques por vencer"
                description="Los cheques próximos a vencer aparecerán aquí."
                size="sm"
              />
            ) : (
              <div className="space-y-1">
                {cheques.map((c) => {
                  const vence = new Date(c.fecha_vencimiento);
                  const hoy = new Date();
                  const diffDays = Math.ceil((vence.getTime() - hoy.getTime()) / 86400000);
                  const urgente = diffDays <= 7;
                  return (
                    <div
                      key={c.id}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50"
                    >
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                        style={{
                          backgroundColor: urgente ? "#EF444415" : "#F59E0B15",
                          color: urgente ? "#EF4444" : "#F59E0B",
                        }}
                      >
                        <CreditCard className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">
                          Cheque #{c.numero}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {c.emisor || c.banco || "Sin emisor"}
                          {" · "}
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                            {c.estado}
                          </Badge>
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold">
                          ${c.monto.toLocaleString("es-AR")}
                        </p>
                        <p className={`text-xs ${urgente ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                          {diffDays <= 0
                            ? "Vencido"
                            : diffDays === 1
                              ? "Vence mañana"
                              : `Vence en ${diffDays}d`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

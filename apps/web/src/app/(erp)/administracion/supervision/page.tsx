"use client";

import { useRef, useLayoutEffect, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useUserStore } from "@/store/user-store";
import { hasPermission, type Permission } from "@/lib/permissions";
import { useDashboardStats } from "@/hooks/queries/use-dashboard";
import { useFinanceResumen } from "@/hooks/queries/use-finance";
import { usePedidos } from "@/hooks/queries/use-orders";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShoppingCart,
  Package,
  Truck,
  AlertTriangle,
  DollarSign,
  Wallet,
  ArrowRight,
  Eye,
  Clock,
  Activity,
} from "lucide-react";
import gsap from "gsap";
import type { LucideIcon } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  PENDIENTE_APROBACION: "Pend. Aprobacion",
  EN_EVALUACION: "En evaluacion",
  APROBADO: "Aprobado",
  EN_PREPARACION: "En preparacion",
  LISTO_PARA_ENVIO: "Listo p/ envio",
  ENVIADO: "Enviado",
  EN_REPARTO: "En reparto",
  ENTREGADO: "Entregado",
  ENTREGADO_PARCIALMENTE: "Entrega parcial",
  CANCELADO: "Cancelado",
  NO_ENTREGADO: "No entregado",
  RECHAZADO: "Rechazado",
  RECLAMADO: "Reclamado",
};

const STATUS_COLORS: Record<string, string> = {
  PENDIENTE_APROBACION: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  EN_EVALUACION: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
  APROBADO: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  EN_PREPARACION: "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400",
  LISTO_PARA_ENVIO: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-400",
  ENVIADO: "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400",
  EN_REPARTO: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-teal-400",
  ENTREGADO: "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400",
  ENTREGADO_PARCIALMENTE: "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400",
  CANCELADO: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
  NO_ENTREGADO: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400",
  RECHAZADO: "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400",
  RECLAMADO: "bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:text-pink-400",
};

function useCountUp(target: number, duration: number = 1.2, delay: number = 0) {
  const [value, setValue] = useState(0);
  const ref = useRef({ value: 0 });

  useEffect(() => {
    const obj = ref.current;
    obj.value = 0;
    const tween = gsap.to(obj, {
      value: target,
      duration,
      delay,
      ease: "power2.out",
      onUpdate: () => setValue(Math.round(obj.value)),
    });
    return () => { tween.kill(); };
  }, [target, duration, delay]);

  return value;
}

function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${Math.round(value / 1000)}K`;
  return `$${value.toLocaleString("es-AR")}`;
}

interface KpiDef {
  title: string;
  value: number;
  isCurrency: boolean;
  icon: LucideIcon;
  color: string;
  href: string;
}

function KpiCard({ kpi, index }: { kpi: KpiDef; index: number }) {
  const displayValue = useCountUp(kpi.value, 1.2, 0.15 + index * 0.08);
  const Icon = kpi.icon;

  return (
    <Link href={kpi.href}>
      <Card className="kpi-card group relative overflow-hidden border-0 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
        <div
          className="absolute top-0 left-0 right-0 h-1 rounded-t-lg"
          style={{ backgroundColor: kpi.color }}
        />
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </p>
              <p className="text-3xl font-bold tracking-tight text-foreground">
                {kpi.isCurrency
                  ? formatCurrency(displayValue)
                  : displayValue.toLocaleString("es-AR")}
              </p>
            </div>
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
              style={{ backgroundColor: `${kpi.color}15`, color: kpi.color }}
            >
              <Icon className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function KpiSkeleton() {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20" />
          </div>
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function SupervisionPage() {
  const user = useUserStore((s) => s.user);
  const permissions = user?.permissions ?? [];
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: dashboardData, isLoading: dashboardLoading } = useDashboardStats();
  const { data: financeData, isLoading: financeLoading } = useFinanceResumen();
  const { data: recentOrdersData, isLoading: ordersLoading } = usePedidos({
    page: 1,
    pageSize: 10,
  });

  const isLoading = dashboardLoading || financeLoading;

  // Derive KPI values from dashboard stats
  const pedidosPendientes = useMemo(() => {
    if (!dashboardData) return 0;
    const pending = dashboardData.orders_by_status.find(
      (s) => s.estado === "PENDIENTE_APROBACION",
    );
    return pending ? Number(pending.count) : 0;
  }, [dashboardData]);

  const pedidosEnPreparacion = useMemo(() => {
    if (!dashboardData) return 0;
    const prep = dashboardData.orders_by_status.find(
      (s) => s.estado === "EN_PREPARACION",
    );
    return prep ? Number(prep.count) : 0;
  }, [dashboardData]);

  const repartosEnCurso = useMemo(() => {
    if (!dashboardData) return 0;
    const enReparto = dashboardData.orders_by_status.find(
      (s) => s.estado === "EN_REPARTO",
    );
    const enviado = dashboardData.orders_by_status.find(
      (s) => s.estado === "ENVIADO",
    );
    return (enReparto ? Number(enReparto.count) : 0) + (enviado ? Number(enviado.count) : 0);
  }, [dashboardData]);

  const alertasStock = useMemo(() => {
    // Using productos_activos as a proxy since we don't have a dedicated low-stock count
    // In a real scenario this would come from a stock alerts endpoint
    return 0;
  }, []);

  const cobrosTotal = useMemo(() => {
    if (!financeData) return 0;
    return financeData.total_cheques_pendientes;
  }, [financeData]);

  const gastosMes = useMemo(() => {
    if (!financeData) return 0;
    return financeData.total_gastos_mes;
  }, [financeData]);

  // Order status distribution from dashboard
  const ordersByStatus = useMemo(() => {
    if (!dashboardData) return [];
    return dashboardData.orders_by_status
      .filter((s) => Number(s.count) > 0)
      .sort((a, b) => Number(b.count) - Number(a.count));
  }, [dashboardData]);

  const recentOrders = recentOrdersData?.data ?? [];

  useLayoutEffect(() => {
    if (!containerRef.current || isLoading) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".sup-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      );
      gsap.fromTo(
        ".kpi-card",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: "power2.out", delay: 0.2 },
      );
      gsap.fromTo(
        ".sup-section",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power2.out", delay: 0.6 },
      );
    }, containerRef);

    return () => ctx.revert();
  }, [isLoading, dashboardData, financeData]);

  if (!user) return null;

  // Permission guard: ADMIN and ENCARGADO roles only
  const canView = hasPermission(permissions, "reports:view");
  if (!canView) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">No tienes permisos para ver esta pagina.</p>
      </div>
    );
  }

  const kpis: KpiDef[] = [
    {
      title: "Pedidos Pendientes",
      value: pedidosPendientes,
      isCurrency: false,
      icon: Clock,
      color: "#F59E0B",
      href: "/ventas/pedidos?estado=PENDIENTE_APROBACION",
    },
    {
      title: "Pedidos En Preparacion",
      value: pedidosEnPreparacion,
      isCurrency: false,
      icon: Package,
      color: "#D97706",
      href: "/ventas/pedidos?estado=EN_PREPARACION",
    },
    {
      title: "Repartos En Curso",
      value: repartosEnCurso,
      isCurrency: false,
      icon: Truck,
      color: "#3B82F6",
      href: "/logistica/repartos",
    },
    {
      title: "Alertas Stock",
      value: alertasStock,
      isCurrency: false,
      icon: AlertTriangle,
      color: "#EF4444",
      href: "/inventario",
    },
    {
      title: "Cobros Pendientes",
      value: cobrosTotal,
      isCurrency: true,
      icon: DollarSign,
      color: "#10B981",
      href: "/finanzas/cobros",
    },
    {
      title: "Gastos del Mes",
      value: gastosMes,
      isCurrency: true,
      icon: Wallet,
      color: "#EC4899",
      href: "/finanzas/gastos",
    },
  ];

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="sup-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Supervision
          </h1>
          <p className="text-sm text-muted-foreground">
            Vista general de operaciones y metricas clave
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/reportes">
            <button className="inline-flex items-center gap-2 rounded-lg border border-border/50 bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-all duration-200 hover:border-[var(--accent)]/30 hover:bg-accent/5 hover:shadow-md">
              <Activity className="h-4 w-4 text-[var(--accent)]" />
              Ver Reportes
            </button>
          </Link>
        </div>
      </div>

      {/* Summary bar */}
      <div className="sup-header flex items-center gap-2 rounded-xl border border-border/50 bg-gradient-to-r from-[var(--accent)]/5 to-transparent px-5 py-3">
        <Eye className="h-4 w-4 text-[var(--accent)]" />
        <span className="text-sm text-muted-foreground">
          Hoy:{" "}
          <span className="font-semibold text-foreground">
            {dashboardData ? `${dashboardData.kpis.pedidos_hoy} pedidos` : "..."}
          </span>
          {" · "}
          <span className="font-semibold text-foreground">
            {dashboardData ? formatCurrency(dashboardData.kpis.facturacion_mes) : "..."} facturado este mes
          </span>
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <KpiSkeleton key={i} />)
          : kpis.map((kpi, i) => <KpiCard key={kpi.title} kpi={kpi} index={i} />)
        }
      </div>

      {/* Bottom: Orders by Status + Recent Orders */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Order Status Distribution */}
        <Card className="sup-section border-0 shadow-sm lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Distribucion por Estado</CardTitle>
            <CardDescription>Pedidos activos agrupados por estado</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-5 w-8" />
                  </div>
                ))}
              </div>
            ) : ordersByStatus.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Sin pedidos registrados
              </p>
            ) : (
              <div className="space-y-2.5">
                {ordersByStatus.map((item) => {
                  const total = dashboardData!.orders_by_status.reduce(
                    (s, d) => s + Number(d.count),
                    0,
                  );
                  const pct = total > 0 ? (Number(item.count) / total) * 100 : 0;
                  return (
                    <div key={item.estado} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="secondary"
                          className={`border-0 text-xs font-medium ${STATUS_COLORS[item.estado] || ""}`}
                        >
                          {STATUS_LABELS[item.estado] || item.estado}
                        </Badge>
                        <span className="text-sm font-semibold text-foreground">
                          {item.count}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted">
                        <div
                          className="h-1.5 rounded-full bg-[var(--accent)] transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="sup-section border-0 shadow-sm lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Ultimos Pedidos</CardTitle>
                <CardDescription>Los 10 pedidos mas recientes</CardDescription>
              </div>
              <Link
                href="/ventas/pedidos"
                className="flex items-center gap-1 text-xs font-medium text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]"
              >
                Ver todos <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-2 py-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Sin pedidos recientes
              </p>
            ) : (
              <div className="space-y-1">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/ventas/pedidos/${order.id}`}
                    className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/50"
                  >
                    <span className="shrink-0 font-mono text-xs font-medium text-[var(--accent)]">
                      #{order.numero}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                      {order.cliente_nombre}
                    </span>
                    <Badge
                      variant="secondary"
                      className={`shrink-0 border-0 text-[10px] font-medium ${STATUS_COLORS[order.estado] || ""}`}
                    >
                      {STATUS_LABELS[order.estado] || order.estado}
                    </Badge>
                    <span className="shrink-0 text-xs font-medium text-foreground">
                      {formatCurrency(order.total)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

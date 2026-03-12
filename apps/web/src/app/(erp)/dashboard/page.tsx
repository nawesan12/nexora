"use client";

import { useRef, useLayoutEffect, useState, useEffect, useMemo } from "react";
import { useUserStore } from "@/store/user-store";
import { ROLE_LABELS } from "@nexora/shared/constants";
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
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
  Label,
} from "recharts";
import {
  ShoppingCart,
  Package,
  Users,
  DollarSign,
  Clock,
  Truck,
  AlertCircle,
  Plus,
  FileText,
  ArrowRight,
  Activity,
  CalendarDays,
  XCircle,
  PackageCheck,
} from "lucide-react";
import { hasPermission, type Permission } from "@/lib/permissions";
import { useDashboardStats } from "@/hooks/queries/use-dashboard";
import Link from "next/link";
import gsap from "gsap";
import type { LucideIcon } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { ChartEmptyState } from "@/components/chart-empty-state";
import { EmptyActivity } from "@/components/illustrations";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 18) return "Buenas tardes";
  return "Buenas noches";
}

function formatDate(): string {
  return new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const MONTH_LABELS: Record<string, string> = {
  "01": "Ene", "02": "Feb", "03": "Mar", "04": "Abr",
  "05": "May", "06": "Jun", "07": "Jul", "08": "Ago",
  "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dic",
};

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

const STATUS_LABELS: Record<string, string> = {
  PENDIENTE_APROBACION: "Pendientes",
  EN_EVALUACION: "En evaluación",
  APROBADO: "Aprobados",
  EN_PREPARACION: "En preparación",
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

const revenueChartConfig: ChartConfig = {
  ingresos: { label: "Ingresos", color: "var(--color-chart-1)" },
  gastos: { label: "Gastos", color: "var(--color-chart-2)" },
};

const ordersChartConfig: ChartConfig = {
  pedidos: { label: "Pedidos", color: "var(--color-chart-1)" },
};

const quickActions: Record<
  string,
  { label: string; href: string; icon: LucideIcon; description: string }[]
> = {
  ADMIN: [
    { label: "Nuevo Pedido", href: "/ventas/pedidos/nuevo", icon: Plus, description: "Crear orden de venta" },
    { label: "Ver Reportes", href: "/reportes", icon: FileText, description: "Análisis y métricas" },
    { label: "Empleados", href: "/empleados", icon: Users, description: "Gestión del equipo" },
  ],
  VENDEDOR: [
    { label: "Nuevo Pedido", href: "/ventas/pedidos/nuevo", icon: Plus, description: "Crear orden de venta" },
    { label: "Mis Clientes", href: "/ventas/clientes", icon: Users, description: "Cartera de clientes" },
  ],
  SUPERVISOR: [
    { label: "Pedidos Pendientes", href: "/ventas/pedidos", icon: Clock, description: "Revisar y aprobar" },
    { label: "Ver Reportes", href: "/reportes", icon: FileText, description: "Análisis y métricas" },
  ],
  REPARTIDOR: [
    { label: "Mis Repartos", href: "/logistica/repartos", icon: Truck, description: "Rutas del día" },
  ],
  DEPOSITO: [
    { label: "Stock", href: "/inventario", icon: Package, description: "Control de inventario" },
    { label: "Alertas", href: "/inventario", icon: AlertCircle, description: "Stock bajo y vencimientos" },
  ],
  FINANZAS: [
    { label: "Finanzas", href: "/finanzas", icon: DollarSign, description: "Estado financiero" },
    { label: "Reportes", href: "/reportes", icon: FileText, description: "Análisis y métricas" },
  ],
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
  permission: Permission;
}

function KpiCard({ kpi, index }: { kpi: KpiDef; index: number }) {
  const displayValue = useCountUp(kpi.value, 1.2, 0.15 + index * 0.08);
  const Icon = kpi.icon;

  return (
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

function ChartSkeleton({ className }: { className?: string }) {
  return (
    <Card className={`border-0 shadow-sm ${className ?? ""}`}>
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[200px] w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

function getActivityIcon(estado: string): { icon: LucideIcon; color: string } {
  switch (estado) {
    case "ENTREGADO":
    case "ENTREGADO_PARCIALMENTE":
      return { icon: PackageCheck, color: "#10B981" };
    case "CANCELADO":
    case "NO_ENTREGADO":
      return { icon: XCircle, color: "#EF4444" };
    case "PENDIENTE_APROBACION":
      return { icon: ShoppingCart, color: "#7C3AED" };
    default:
      return { icon: Clock, color: "#3B82F6" };
  }
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

export default function DashboardPage() {
  const user = useUserStore((s) => s.user);
  const { data, isLoading } = useDashboardStats();
  const dashboardRef = useRef<HTMLDivElement>(null);
  const chartsRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!dashboardRef.current || isLoading) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".dashboard-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      );
      gsap.fromTo(
        ".kpi-card",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: "power2.out", delay: 0.2 },
      );
      gsap.fromTo(
        ".chart-card",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power2.out", delay: 0.6 },
      );
      gsap.fromTo(
        ".bottom-section",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: "power2.out", delay: 0.9 },
      );
    }, dashboardRef);

    return () => ctx.revert();
  }, [user, isLoading, data]);

  // Derive chart data from API response
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

  const weeklyData = useMemo(() => {
    if (!data) return [];
    return data.weekly_orders.map((d) => {
      const date = new Date(d.day + "T12:00:00");
      const dayLabel = DAY_LABELS[date.getDay()] || d.day;
      return { day: dayLabel, pedidos: Number(d.count) };
    });
  }, [data]);

  const activityItems = useMemo(() => {
    if (!data) return [];
    return data.recent_activity.map((a) => {
      const { icon, color } = getActivityIcon(a.estado_nuevo);
      const statusLabel = STATUS_LABELS[a.estado_nuevo] || a.estado_nuevo;
      return {
        icon,
        color,
        text: `Pedido #${a.pedido_numero} ${statusLabel.toLowerCase()}`,
        detail: `Cliente: ${a.cliente_nombre}`,
        time: formatTimeAgo(a.created_at),
      };
    });
  }, [data]);

  if (!user) return null;

  const permissions = user.permissions ?? [];
  const roleLabel = ROLE_LABELS[user.rol as keyof typeof ROLE_LABELS] || user.rol;
  const greeting = getGreeting();
  const actions = quickActions[user.rol] || quickActions.ADMIN || [];

  const kpis: KpiDef[] = data
    ? [
        { title: "Pedidos del día", value: data.kpis.pedidos_hoy, isCurrency: false, icon: ShoppingCart, color: "#7C3AED", permission: "orders:view" as Permission },
        { title: "Productos activos", value: data.kpis.productos_activos, isCurrency: false, icon: Package, color: "#3B82F6", permission: "products:view" as Permission },
        { title: "Clientes", value: data.kpis.clientes_activos, isCurrency: false, icon: Users, color: "#10B981", permission: "clients:view" as Permission },
        { title: "Facturación del mes", value: data.kpis.facturacion_mes, isCurrency: true, icon: DollarSign, color: "#F59E0B", permission: "finance:view" as Permission },
      ]
    : [];
  const visibleKpis = kpis.filter((kpi) => hasPermission(permissions, kpi.permission));
  const totalOrders = orderStatusData.reduce((s, d) => s + d.value, 0);

  return (
    <div ref={dashboardRef} className="space-y-6">
      {/* Header */}
      <div className="dashboard-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {greeting},{" "}
            <span className="bg-gradient-to-r from-[var(--accent)] to-[var(--primary)] bg-clip-text text-transparent">
              {user.nombre}
            </span>
          </h1>
          <div className="flex items-center gap-3 text-muted-foreground">
            <Badge variant="secondary" className="border border-border/50 bg-secondary/80">
              {roleLabel}
            </Badge>
            <div className="flex items-center gap-1.5 text-sm">
              <CalendarDays className="h-3.5 w-3.5" />
              <span className="capitalize">{formatDate()}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {actions.slice(0, 3).map((action) => (
            <Link key={action.label} href={action.href}>
              <button className="inline-flex items-center gap-2 rounded-lg border border-border/50 bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-all duration-200 hover:border-[var(--accent)]/30 hover:bg-accent/5 hover:shadow-md">
                <action.icon className="h-4 w-4 text-[var(--accent)]" />
                {action.label}
              </button>
            </Link>
          ))}
        </div>
      </div>

      {/* Summary bar */}
      <div className="dashboard-header flex items-center gap-2 rounded-xl border border-border/50 bg-gradient-to-r from-[var(--accent)]/5 to-transparent px-5 py-3">
        <Activity className="h-4 w-4 text-[var(--accent)]" />
        <span className="text-sm text-muted-foreground">
          Hoy:{" "}
          <span className="font-semibold text-foreground">
            {data ? `${data.kpis.pedidos_hoy} pedidos` : "..."}
          </span>
          {" · "}
          <span className="font-semibold text-foreground">
            {data ? formatCurrency(data.kpis.facturacion_mes) : "..."} facturado este mes
          </span>
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
          : visibleKpis.map((kpi, i) => <KpiCard key={kpi.title} kpi={kpi} index={i} />)
        }
      </div>

      {/* Charts Row */}
      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-7">
          <ChartSkeleton className="lg:col-span-4" />
          <ChartSkeleton className="lg:col-span-3" />
        </div>
      ) : (
        <div ref={chartsRef} className="grid gap-4 lg:grid-cols-7">
          {/* Revenue Chart */}
          {hasPermission(permissions, "finance:view") && (
            <Card className="chart-card border-0 shadow-sm lg:col-span-4">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">
                      Ingresos vs Gastos
                    </CardTitle>
                    <CardDescription>Últimos 6 meses</CardDescription>
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
              </CardHeader>
              <CardContent>
                {revenueData.length === 0 ? (
                  <ChartEmptyState variant="area" height="280px" title="Sin datos de ingresos" description="Los datos aparecerán cuando se registren pedidos y gastos." />
                ) : (
                <ChartContainer config={revenueChartConfig} className="h-[280px] w-full">
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
              </CardContent>
            </Card>
          )}

          {/* Order Status Pie */}
          {hasPermission(permissions, "orders:view") && (
            <Card className="chart-card border-0 shadow-sm lg:col-span-3">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Estado de Pedidos</CardTitle>
                <CardDescription>Distribución actual</CardDescription>
              </CardHeader>
              <CardContent>
                {orderStatusData.length === 0 ? (
                  <ChartEmptyState variant="pie" height="220px" title="Sin pedidos" description="Los estados de pedidos aparecerán aquí." />
                ) : (
                <>
                <ChartContainer config={statusChartConfig} className="mx-auto h-[220px] w-full">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Pie
                      data={orderStatusData}
                      dataKey="value"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
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
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Weekly Orders Bar chart */}
      {!isLoading && hasPermission(permissions, "orders:view") && (
        <Card className="chart-card border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Pedidos de la Semana</CardTitle>
                <CardDescription>
                  {weeklyData.reduce((s, d) => s + d.pedidos, 0)} pedidos totales
                </CardDescription>
              </div>
              <Badge variant="secondary" className="border border-border/50 font-mono text-xs">
                Prom.{" "}
                {weeklyData.length > 0
                  ? Math.round(weeklyData.reduce((s, d) => s + d.pedidos, 0) / weeklyData.length)
                  : 0}
                /día
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {weeklyData.length === 0 ? (
              <ChartEmptyState variant="bar" height="180px" title="Sin pedidos esta semana" description="Los pedidos semanales aparecerán aquí." />
            ) : (
            <ChartContainer config={ordersChartConfig} className="h-[180px] w-full">
              <BarChart data={weeklyData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={1} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} className="text-xs" />
                <YAxis tickLine={false} axisLine={false} className="text-xs" width={30} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="pedidos" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bottom row: Activity + Quick Actions */}
      <div ref={bottomRef} className="grid gap-4 lg:grid-cols-5">
        {/* Recent Activity */}
        <Card className="bottom-section border-0 shadow-sm lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Actividad Reciente</CardTitle>
              <button className="flex items-center gap-1 text-xs font-medium text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]">
                Ver todo <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-3 w-16" />
                  </div>
                ))
              ) : activityItems.length === 0 ? (
                <EmptyState
                  illustration={<EmptyActivity className="w-full h-full" />}
                  title="Sin actividad reciente"
                  description="La actividad de pedidos aparecerá aquí."
                  size="sm"
                />
              ) : (
                activityItems.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50"
                  >
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${item.color}15`, color: item.color }}
                    >
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{item.text}</p>
                      <p className="text-xs text-muted-foreground">{item.detail}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{item.time}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bottom-section border-0 shadow-sm lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {actions.map((action) => (
                <Link key={action.label} href={action.href}>
                  <div className="group/action flex items-center gap-3 rounded-lg border border-border/50 p-3 transition-all duration-200 hover:border-[var(--accent)]/30 hover:bg-accent/5 hover:shadow-sm">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] transition-transform duration-200 group-hover/action:scale-110">
                      <action.icon className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{action.label}</p>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/50 transition-transform duration-200 group-hover/action:translate-x-0.5 group-hover/action:text-[var(--accent)]" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

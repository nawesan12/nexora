"use client";

import { useRef, useLayoutEffect, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useUserStore } from "@/store/user-store";
import { usePedidos } from "@/hooks/queries/use-orders";
import { useComisionesVendedor } from "@/hooks/queries/use-finance";
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
  DollarSign,
  Award,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import gsap from "gsap";
import type { LucideIcon } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  PENDIENTE_APROBACION: "Pendiente",
  EN_EVALUACION: "En evaluacion",
  APROBADO: "Aprobado",
  EN_PREPARACION: "En preparacion",
  LISTO_PARA_ENVIO: "Listo",
  ENVIADO: "Enviado",
  EN_REPARTO: "En reparto",
  ENTREGADO: "Entregado",
  ENTREGADO_PARCIALMENTE: "Parcial",
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

export default function VendedorDashboardPage() {
  const user = useUserStore((s) => s.user);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch the current user's orders (the API filters by the authenticated user's scope)
  const { data: ordersData, isLoading: ordersLoading } = usePedidos({
    page: 1,
    pageSize: 20,
  });

  // Fetch commissions for the current user (empleado_id = user.id)
  const { data: comisionesData, isLoading: comisionesLoading } = useComisionesVendedor({
    page: 1,
    pageSize: 50,
    empleadoId: user?.id,
  });

  const isLoading = ordersLoading || comisionesLoading;

  const orders = ordersData?.data ?? [];
  const ordersMeta = ordersData?.meta;

  // Compute stats
  const stats = useMemo(() => {
    const totalPedidos = ordersMeta?.total ?? orders.length;
    const facturacion = orders.reduce((sum, o) => sum + (o.total || 0), 0);

    const comisiones = comisionesData?.data ?? [];
    const totalComisiones = comisiones.reduce((sum, c) => sum + (c.monto || 0), 0);

    return { totalPedidos, facturacion, totalComisiones, comisionesCount: comisiones.length };
  }, [orders, ordersMeta, comisionesData]);

  // Recent orders (first 10 from the list)
  const recentOrders = orders.slice(0, 10);

  // Comisiones list
  const comisionesList = useMemo(() => {
    return (comisionesData?.data ?? []).slice(0, 5);
  }, [comisionesData]);

  useLayoutEffect(() => {
    if (!containerRef.current || isLoading) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".vend-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      );
      gsap.fromTo(
        ".kpi-card",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: "power2.out", delay: 0.2 },
      );
      gsap.fromTo(
        ".vend-section",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power2.out", delay: 0.6 },
      );
    }, containerRef);

    return () => ctx.revert();
  }, [isLoading, ordersData, comisionesData]);

  if (!user) return null;

  const kpis: KpiDef[] = [
    {
      title: "Mis Pedidos",
      value: stats.totalPedidos,
      isCurrency: false,
      icon: ShoppingCart,
      color: "#D97706",
    },
    {
      title: "Mi Facturacion",
      value: stats.facturacion,
      isCurrency: true,
      icon: DollarSign,
      color: "#10B981",
    },
    {
      title: "Mis Comisiones",
      value: stats.totalComisiones,
      isCurrency: true,
      icon: Award,
      color: "#F59E0B",
    },
  ];

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="vend-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Mi Panel de Ventas
          </h1>
          <p className="text-sm text-muted-foreground">
            Tu rendimiento y actividad comercial
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/ventas/pedidos/nuevo">
            <button className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-[var(--accent-hover)] hover:shadow-md">
              <ShoppingCart className="h-4 w-4" />
              Nuevo Pedido
            </button>
          </Link>
        </div>
      </div>

      {/* Summary bar */}
      <div className="vend-header flex items-center gap-2 rounded-xl border border-border/50 bg-gradient-to-r from-[var(--accent)]/5 to-transparent px-5 py-3">
        <TrendingUp className="h-4 w-4 text-[var(--accent)]" />
        <span className="text-sm text-muted-foreground">
          Resumen:{" "}
          <span className="font-semibold text-foreground">
            {isLoading ? "..." : `${stats.totalPedidos} pedidos`}
          </span>
          {" · "}
          <span className="font-semibold text-foreground">
            {isLoading ? "..." : formatCurrency(stats.facturacion)} facturado
          </span>
          {" · "}
          <span className="font-semibold text-foreground">
            {isLoading ? "..." : formatCurrency(stats.totalComisiones)} en comisiones
          </span>
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <KpiSkeleton key={i} />)
          : kpis.map((kpi, i) => <KpiCard key={kpi.title} kpi={kpi} index={i} />)
        }
      </div>

      {/* Bottom: Recent Orders + Commissions */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Recent Orders */}
        <Card className="vend-section border-0 shadow-sm lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Mis Pedidos Recientes</CardTitle>
                <CardDescription>Ultimos pedidos registrados</CardDescription>
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
                No tienes pedidos aun. Crea tu primer pedido.
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

        {/* Commissions Summary */}
        <Card className="vend-section border-0 shadow-sm lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Mis Comisiones</CardTitle>
                <CardDescription>
                  {stats.comisionesCount > 0
                    ? `${stats.comisionesCount} comisiones registradas`
                    : "Historial de comisiones"}
                </CardDescription>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F59E0B]/10 text-[#F59E0B]">
                <Award className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {comisionesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-2 py-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                ))}
              </div>
            ) : comisionesList.length === 0 ? (
              <div className="py-8 text-center">
                <Award className="mx-auto h-10 w-10 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Sin comisiones registradas
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Las comisiones apareceran cuando se registren ventas.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Total highlight */}
                <div className="mb-3 rounded-lg bg-[#F59E0B]/5 p-3 text-center">
                  <p className="text-xs font-medium text-muted-foreground">Total Comisiones</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(stats.totalComisiones)}
                  </p>
                </div>
                {/* Individual entries */}
                {comisionesList.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-muted/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {formatCurrency(c.monto)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {c.porcentaje > 0 && `${c.porcentaje}% · `}
                        {new Date(c.created_at).toLocaleDateString("es-AR")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

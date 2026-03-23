"use client";

import { useRef, useLayoutEffect, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useUserStore } from "@/store/user-store";
import { hasPermission } from "@/lib/permissions";
import { useEmpleados } from "@/hooks/queries/use-employees";
import { ROLE_LABELS, ESTADO_EMPLEADO_LABELS } from "@pronto/shared/constants";
import type { Rol } from "@pronto/shared/constants";
import type { Empleado } from "@pronto/shared/types";
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
  Users,
  UserCheck,
  UserMinus,
  UserX,
  ArrowRight,
  Briefcase,
} from "lucide-react";
import gsap from "gsap";
import type { LucideIcon } from "lucide-react";

const ROLE_BAR_COLORS: Record<string, string> = {
  ADMIN: "#D97706",
  VENDEDOR: "#3B82F6",
  SUPERVISOR: "#F59E0B",
  FINANZAS: "#10B981",
  REPARTIDOR: "#06B6D4",
  JEFE_VENTAS: "#F43F5E",
  DEPOSITO: "#6366F1",
  VENDEDOR_CALLE: "#0EA5E9",
};

const ESTADO_BADGE_COLORS: Record<string, string> = {
  ACTIVO: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  LICENCIA: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  DESVINCULADO: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
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

interface KpiDef {
  title: string;
  value: number;
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
              {displayValue.toLocaleString("es-AR")}
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

export default function HRPanelPage() {
  const user = useUserStore((s) => s.user);
  const permissions = user?.permissions ?? [];
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch all employees (large page to get full set for stats)
  const { data, isLoading } = useEmpleados({ page: 1, pageSize: 500 });
  const empleados: Empleado[] = data?.data ?? [];

  // Compute stats client-side
  const stats = useMemo(() => {
    const total = empleados.length;
    const activos = empleados.filter((e) => e.estado === "ACTIVO").length;
    const licencia = empleados.filter((e) => e.estado === "LICENCIA").length;
    const desvinculados = empleados.filter((e) => e.estado === "DESVINCULADO").length;

    // Distribution by role
    const rolCounts: Record<string, number> = {};
    for (const e of empleados) {
      rolCounts[e.rol] = (rolCounts[e.rol] || 0) + 1;
    }
    const rolDistribution = Object.entries(rolCounts)
      .map(([rol, count]) => ({ rol, count }))
      .sort((a, b) => b.count - a.count);

    // Recent hires (by fecha_ingreso or created_at)
    const recentHires = [...empleados]
      .filter((e) => e.estado === "ACTIVO")
      .sort((a, b) => {
        const dateA = a.fecha_ingreso || a.created_at;
        const dateB = b.fecha_ingreso || b.created_at;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      })
      .slice(0, 5);

    return { total, activos, licencia, desvinculados, rolDistribution, recentHires };
  }, [empleados]);

  useLayoutEffect(() => {
    if (!containerRef.current || isLoading) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".hr-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      );
      gsap.fromTo(
        ".kpi-card",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: "power2.out", delay: 0.2 },
      );
      gsap.fromTo(
        ".hr-section",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power2.out", delay: 0.6 },
      );
    }, containerRef);

    return () => ctx.revert();
  }, [isLoading, data]);

  if (!user) return null;

  const canView = hasPermission(permissions, "employees:view");
  if (!canView) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">No tienes permisos para ver esta pagina.</p>
      </div>
    );
  }

  const kpis: KpiDef[] = [
    { title: "Total Empleados", value: stats.total, icon: Users, color: "#D97706" },
    { title: "Activos", value: stats.activos, icon: UserCheck, color: "#10B981" },
    { title: "En Licencia", value: stats.licencia, icon: UserMinus, color: "#F59E0B" },
    { title: "Desvinculados", value: stats.desvinculados, icon: UserX, color: "#EF4444" },
  ];

  const maxRolCount = stats.rolDistribution.length > 0
    ? Math.max(...stats.rolDistribution.map((r) => r.count))
    : 1;

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="hr-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Panel HR
          </h1>
          <p className="text-sm text-muted-foreground">
            Resumen del equipo y recursos humanos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/empleados">
            <button className="inline-flex items-center gap-2 rounded-lg border border-border/50 bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-all duration-200 hover:border-[var(--accent)]/30 hover:bg-accent/5 hover:shadow-md">
              <Users className="h-4 w-4 text-[var(--accent)]" />
              Ver Empleados
            </button>
          </Link>
        </div>
      </div>

      {/* Summary bar */}
      <div className="hr-header flex items-center gap-2 rounded-xl border border-border/50 bg-gradient-to-r from-[var(--accent)]/5 to-transparent px-5 py-3">
        <Briefcase className="h-4 w-4 text-[var(--accent)]" />
        <span className="text-sm text-muted-foreground">
          Equipo:{" "}
          <span className="font-semibold text-foreground">
            {isLoading ? "..." : `${stats.activos} activos`}
          </span>
          {" de "}
          <span className="font-semibold text-foreground">
            {isLoading ? "..." : `${stats.total} totales`}
          </span>
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
          : kpis.map((kpi, i) => <KpiCard key={kpi.title} kpi={kpi} index={i} />)
        }
      </div>

      {/* Bottom: Role Distribution + Recent Hires */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Role Distribution */}
        <Card className="hr-section border-0 shadow-sm lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Distribucion por Rol</CardTitle>
            <CardDescription>Cantidad de empleados por rol</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-5 w-8" />
                  </div>
                ))}
              </div>
            ) : stats.rolDistribution.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Sin empleados registrados
              </p>
            ) : (
              <div className="space-y-3">
                {stats.rolDistribution.map((item) => {
                  const pct = (item.count / maxRolCount) * 100;
                  const barColor = ROLE_BAR_COLORS[item.rol] || "#6B7280";
                  return (
                    <div key={item.rol} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">
                          {ROLE_LABELS[item.rol as Rol] || item.rol}
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          {item.count}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: barColor }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Hires */}
        <Card className="hr-section border-0 shadow-sm lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Incorporaciones Recientes</CardTitle>
                <CardDescription>Ultimos 5 empleados incorporados</CardDescription>
              </div>
              <Link
                href="/empleados"
                className="flex items-center gap-1 text-xs font-medium text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]"
              >
                Ver todos <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-2 py-2">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-5 w-16" />
                  </div>
                ))}
              </div>
            ) : stats.recentHires.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Sin empleados registrados
              </p>
            ) : (
              <div className="space-y-1">
                {stats.recentHires.map((emp) => {
                  const initials = `${emp.nombre.charAt(0)}${emp.apellido.charAt(0)}`.toUpperCase();
                  const ingreso = emp.fecha_ingreso || emp.created_at;
                  return (
                    <Link
                      key={emp.id}
                      href={`/empleados/${emp.id}`}
                      className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/10 text-xs font-semibold text-[var(--accent)]">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {emp.apellido}, {emp.nombre}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {ROLE_LABELS[emp.rol as Rol] || emp.rol}
                          {ingreso && (
                            <>
                              {" · "}
                              {new Date(ingreso).toLocaleDateString("es-AR")}
                            </>
                          )}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={`shrink-0 border-0 text-xs font-medium ${ESTADO_BADGE_COLORS[emp.estado] || ""}`}
                      >
                        {ESTADO_EMPLEADO_LABELS[emp.estado] || emp.estado}
                      </Badge>
                    </Link>
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

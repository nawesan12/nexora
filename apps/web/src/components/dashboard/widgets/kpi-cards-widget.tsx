"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { useUserStore } from "@/store/user-store";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShoppingCart,
  Package,
  Users,
  DollarSign,
} from "lucide-react";
import { hasPermission, type Permission } from "@/lib/permissions";
import { useDashboardStats } from "@/hooks/queries/use-dashboard";
import gsap from "gsap";
import type { LucideIcon } from "lucide-react";

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

function KpiCard({ kpi, index }: { kpi: KpiDef; index: number }) {
  const displayValue = useCountUp(kpi.value, 1.2, 0.15 + index * 0.08);
  const Icon = kpi.icon;

  return (
    <Card className="group relative overflow-hidden border-0 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
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

export function KpiCardsWidget() {
  const user = useUserStore((s) => s.user);
  const { data, isLoading } = useDashboardStats();

  const permissions = user?.permissions ?? [];

  const kpis: KpiDef[] = useMemo(() => {
    if (!data) return [];
    return [
      { title: "Pedidos del dia", value: data.kpis.pedidos_hoy, isCurrency: false, icon: ShoppingCart, color: "#D97706", permission: "orders:view" as Permission },
      { title: "Productos activos", value: data.kpis.productos_activos, isCurrency: false, icon: Package, color: "#3B82F6", permission: "products:view" as Permission },
      { title: "Clientes", value: data.kpis.clientes_activos, isCurrency: false, icon: Users, color: "#10B981", permission: "clients:view" as Permission },
      { title: "Facturacion del mes", value: data.kpis.facturacion_mes, isCurrency: true, icon: DollarSign, color: "#F59E0B", permission: "finance:view" as Permission },
    ];
  }, [data]);

  const visibleKpis = kpis.filter((kpi) => hasPermission(permissions, kpi.permission));

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 h-full">
      {isLoading
        ? Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
        : visibleKpis.map((kpi, i) => <KpiCard key={kpi.title} kpi={kpi} index={i} />)
      }
    </div>
  );
}

"use client";

import { useRef, useLayoutEffect, useMemo, useState, useCallback, useEffect } from "react";
import { useUserStore } from "@/store/user-store";
import { ROLE_LABELS } from "@pronto/shared/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  CalendarDays,
  LayoutGrid,
  Check,
  RotateCcw,
} from "lucide-react";
import { hasPermission } from "@/lib/permissions";
import { useDashboardStats } from "@/hooks/queries/use-dashboard";
import { useDashboardLayout, useSaveDashboardLayout } from "@/hooks/queries/use-dashboard-layout";
import { WidgetGrid } from "@/components/dashboard/widget-grid";
import {
  WIDGET_REGISTRY,
  DEFAULT_LAYOUTS,
} from "@/components/dashboard/widget-registry";
import gsap from "gsap";

interface SimpleLayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos d\u00edas";
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

function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${Math.round(value / 1000)}K`;
  return `$${value.toLocaleString("es-AR")}`;
}

export default function DashboardPage() {
  const user = useUserStore((s) => s.user);
  const { data, isLoading: statsLoading } = useDashboardStats();
  const { data: savedLayout, isLoading: layoutLoading } = useDashboardLayout();
  const { mutate: saveLayout } = useSaveDashboardLayout();
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentLayout, setCurrentLayout] = useState<SimpleLayoutItem[] | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const permissions = user?.permissions ?? [];
  const role = user?.rol ?? "DEFAULT";

  // Get visible widgets based on permissions
  const visibleWidgets = useMemo(() => {
    return Object.values(WIDGET_REGISTRY).filter((widget) => {
      if (!widget.permission) return true;
      return hasPermission(permissions, widget.permission);
    });
  }, [permissions]);

  const visibleWidgetIds = useMemo(
    () => new Set(visibleWidgets.map((w) => w.id)),
    [visibleWidgets]
  );

  // Determine the active layout
  const defaultLayout = useMemo(() => {
    const roleLayout = DEFAULT_LAYOUTS[role] || DEFAULT_LAYOUTS.DEFAULT;
    return roleLayout.filter((item) => visibleWidgetIds.has(item.i));
  }, [role, visibleWidgetIds]);

  // Initialize layout from saved data or defaults
  useEffect(() => {
    if (layoutLoading) return;
    if (savedLayout && savedLayout.layouts && savedLayout.layouts.lg) {
      const filtered = (savedLayout.layouts.lg as SimpleLayoutItem[]).filter(
        (item) => visibleWidgetIds.has(item.i)
      );
      if (filtered.length > 0) {
        setCurrentLayout(filtered);
        return;
      }
    }
    setCurrentLayout(defaultLayout);
  }, [savedLayout, layoutLoading, defaultLayout, visibleWidgetIds]);

  // Debounced auto-save when layout changes
  const handleLayoutChange = useCallback(
    (items: SimpleLayoutItem[]) => {
      if (!isEditing) return;

      setCurrentLayout(items);

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveLayout({
          layouts: { lg: items },
        });
      }, 1500);
    },
    [isEditing, saveLayout]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleResetLayout = useCallback(() => {
    setCurrentLayout(defaultLayout);
    saveLayout({ layouts: { lg: defaultLayout } });
  }, [defaultLayout, saveLayout]);

  const handleToggleEdit = useCallback(() => {
    if (isEditing && currentLayout) {
      // Save on exit
      saveLayout({ layouts: { lg: currentLayout } });
    }
    setIsEditing((prev) => !prev);
  }, [isEditing, currentLayout, saveLayout]);

  // GSAP entrance animation
  useLayoutEffect(() => {
    if (!dashboardRef.current || statsLoading || layoutLoading) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".dashboard-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      );
      gsap.fromTo(
        ".widget-grid",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "power2.out", delay: 0.3 },
      );
    }, dashboardRef);

    return () => ctx.revert();
  }, [statsLoading, layoutLoading]);

  if (!user) return null;

  const roleLabel = ROLE_LABELS[user.rol as keyof typeof ROLE_LABELS] || user.rol;
  const greeting = getGreeting();

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
        <div className="flex items-center gap-2">
          {isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetLayout}
              className="gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restablecer
            </Button>
          )}
          <Button
            variant={isEditing ? "default" : "outline"}
            size="sm"
            onClick={handleToggleEdit}
            className="gap-1.5"
          >
            {isEditing ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Listo
              </>
            ) : (
              <>
                <LayoutGrid className="h-3.5 w-3.5" />
                Editar Layout
              </>
            )}
          </Button>
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
          {" \u00B7 "}
          <span className="font-semibold text-foreground">
            {data ? formatCurrency(data.kpis.facturacion_mes) : "..."} facturado este mes
          </span>
        </span>
      </div>

      {/* Widget Grid */}
      {currentLayout && (
        <WidgetGrid
          widgets={visibleWidgets}
          layout={currentLayout}
          onLayoutChange={handleLayoutChange}
          isEditing={isEditing}
        />
      )}
    </div>
  );
}

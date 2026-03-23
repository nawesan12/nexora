"use client";

import React from "react";
import type { Permission } from "@/lib/permissions";

export interface WidgetDefinition {
  id: string;
  title: string;
  defaultW: number;
  defaultH: number;
  minW?: number;
  minH?: number;
  permission?: Permission;
  component: React.ComponentType;
}

const KpiCardsWidget = React.lazy(
  () => import("./widgets/kpi-cards-widget").then((m) => ({ default: m.KpiCardsWidget }))
);

const RevenueChartWidget = React.lazy(
  () => import("./widgets/revenue-chart-widget").then((m) => ({ default: m.RevenueChartWidget }))
);

const OrderStatusPieWidget = React.lazy(
  () => import("./widgets/order-status-pie-widget").then((m) => ({ default: m.OrderStatusPieWidget }))
);

const WeeklyOrdersWidget = React.lazy(
  () => import("./widgets/weekly-orders-widget").then((m) => ({ default: m.WeeklyOrdersWidget }))
);

const RecentActivityWidget = React.lazy(
  () => import("./widgets/recent-activity-widget").then((m) => ({ default: m.RecentActivityWidget }))
);

const QuickActionsWidget = React.lazy(
  () => import("./widgets/quick-actions-widget").then((m) => ({ default: m.QuickActionsWidget }))
);

export const WIDGET_REGISTRY: Record<string, WidgetDefinition> = {
  "kpi-cards": {
    id: "kpi-cards",
    title: "Indicadores Clave",
    defaultW: 12,
    defaultH: 2,
    minW: 6,
    minH: 2,
    component: KpiCardsWidget,
  },
  "revenue-chart": {
    id: "revenue-chart",
    title: "Ingresos vs Gastos",
    defaultW: 8,
    defaultH: 4,
    minW: 4,
    minH: 3,
    permission: "finance:view" as Permission,
    component: RevenueChartWidget,
  },
  "order-status-pie": {
    id: "order-status-pie",
    title: "Estado de Pedidos",
    defaultW: 4,
    defaultH: 4,
    minW: 3,
    minH: 3,
    permission: "orders:view" as Permission,
    component: OrderStatusPieWidget,
  },
  "weekly-orders": {
    id: "weekly-orders",
    title: "Pedidos Semanales",
    defaultW: 12,
    defaultH: 3,
    minW: 4,
    minH: 2,
    permission: "orders:view" as Permission,
    component: WeeklyOrdersWidget,
  },
  "recent-activity": {
    id: "recent-activity",
    title: "Actividad Reciente",
    defaultW: 7,
    defaultH: 4,
    minW: 4,
    minH: 3,
    component: RecentActivityWidget,
  },
  "quick-actions": {
    id: "quick-actions",
    title: "Acciones Rapidas",
    defaultW: 5,
    defaultH: 4,
    minW: 3,
    minH: 3,
    component: QuickActionsWidget,
  },
};

export const DEFAULT_LAYOUTS: Record<string, Array<{ i: string; x: number; y: number; w: number; h: number }>> = {
  ADMIN: [
    { i: "kpi-cards", x: 0, y: 0, w: 12, h: 2 },
    { i: "revenue-chart", x: 0, y: 2, w: 8, h: 4 },
    { i: "order-status-pie", x: 8, y: 2, w: 4, h: 4 },
    { i: "weekly-orders", x: 0, y: 6, w: 12, h: 3 },
    { i: "recent-activity", x: 0, y: 9, w: 7, h: 4 },
    { i: "quick-actions", x: 7, y: 9, w: 5, h: 4 },
  ],
  VENDEDOR: [
    { i: "kpi-cards", x: 0, y: 0, w: 12, h: 2 },
    { i: "weekly-orders", x: 0, y: 2, w: 12, h: 3 },
    { i: "quick-actions", x: 0, y: 5, w: 12, h: 4 },
  ],
  REPARTIDOR: [
    { i: "quick-actions", x: 0, y: 0, w: 12, h: 4 },
    { i: "recent-activity", x: 0, y: 4, w: 12, h: 4 },
  ],
  DEFAULT: [
    { i: "kpi-cards", x: 0, y: 0, w: 12, h: 2 },
    { i: "revenue-chart", x: 0, y: 2, w: 8, h: 4 },
    { i: "order-status-pie", x: 8, y: 2, w: 4, h: 4 },
    { i: "recent-activity", x: 0, y: 6, w: 7, h: 4 },
    { i: "quick-actions", x: 7, y: 6, w: 5, h: 4 },
  ],
};

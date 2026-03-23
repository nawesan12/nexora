"use client";

import { useUserStore } from "@/store/user-store";
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
} from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

const quickActions: Record<
  string,
  { label: string; href: string; icon: LucideIcon; description: string }[]
> = {
  ADMIN: [
    { label: "Nuevo Pedido", href: "/ventas/pedidos/nuevo", icon: Plus, description: "Crear orden de venta" },
    { label: "Ver Reportes", href: "/reportes", icon: FileText, description: "Analisis y metricas" },
    { label: "Empleados", href: "/empleados", icon: Users, description: "Gestion del equipo" },
  ],
  VENDEDOR: [
    { label: "Nuevo Pedido", href: "/ventas/pedidos/nuevo", icon: Plus, description: "Crear orden de venta" },
    { label: "Mis Clientes", href: "/ventas/clientes", icon: Users, description: "Cartera de clientes" },
  ],
  SUPERVISOR: [
    { label: "Pedidos Pendientes", href: "/ventas/pedidos", icon: Clock, description: "Revisar y aprobar" },
    { label: "Ver Reportes", href: "/reportes", icon: FileText, description: "Analisis y metricas" },
  ],
  REPARTIDOR: [
    { label: "Mis Repartos", href: "/logistica/repartos", icon: Truck, description: "Rutas del dia" },
  ],
  DEPOSITO: [
    { label: "Stock", href: "/inventario", icon: Package, description: "Control de inventario" },
    { label: "Alertas", href: "/inventario", icon: AlertCircle, description: "Stock bajo y vencimientos" },
  ],
  FINANZAS: [
    { label: "Finanzas", href: "/finanzas", icon: DollarSign, description: "Estado financiero" },
    { label: "Reportes", href: "/reportes", icon: FileText, description: "Analisis y metricas" },
  ],
};

export function QuickActionsWidget() {
  const user = useUserStore((s) => s.user);
  if (!user) return null;

  const actions = quickActions[user.rol] || quickActions.ADMIN || [];

  return (
    <div className="h-full flex flex-col">
      <p className="text-sm font-semibold text-foreground mb-2">Acciones Rapidas</p>
      <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
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
    </div>
  );
}

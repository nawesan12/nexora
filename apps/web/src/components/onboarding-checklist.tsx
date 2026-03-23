"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useUserStore } from "@/store/user-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CHECKLIST_DISMISSED_KEY = "pronto-checklist-dismissed";

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  href: string;
  checkFn: (data: ChecklistData) => boolean;
}

interface ChecklistData {
  hasProducts: boolean;
  hasClients: boolean;
  hasOrders: boolean;
  hasEmployees: boolean;
  hasBranches: boolean;
  hasPaymentMethods: boolean;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: "branches",
    label: "Configurar sucursales",
    description: "Agrega al menos una sucursal para operar",
    href: "/configuracion/sucursales",
    checkFn: (d) => d.hasBranches,
  },
  {
    id: "products",
    label: "Cargar productos",
    description: "Agrega tu catalogo de productos",
    href: "/inventario/productos",
    checkFn: (d) => d.hasProducts,
  },
  {
    id: "clients",
    label: "Agregar clientes",
    description: "Registra tus primeros clientes",
    href: "/ventas/clientes",
    checkFn: (d) => d.hasClients,
  },
  {
    id: "employees",
    label: "Registrar empleados",
    description: "Agrega el equipo de trabajo",
    href: "/empleados",
    checkFn: (d) => d.hasEmployees,
  },
  {
    id: "payment-methods",
    label: "Configurar metodos de pago",
    description: "Define como cobraras a tus clientes",
    href: "/configuracion/metodos-pago",
    checkFn: (d) => d.hasPaymentMethods,
  },
  {
    id: "first-order",
    label: "Crear primer pedido",
    description: "Genera tu primera orden de venta",
    href: "/ventas/pedidos/nuevo",
    checkFn: (d) => d.hasOrders,
  },
];

export function OnboardingChecklist() {
  const user = useUserStore((s) => s.user);
  const [dismissed, setDismissed] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [checklistData, setChecklistData] = useState<ChecklistData | null>(
    null,
  );

  useEffect(() => {
    const wasDismissed = localStorage.getItem(CHECKLIST_DISMISSED_KEY);
    if (!wasDismissed && user?.rol === "ADMIN") {
      setDismissed(false);
      // Fetch checklist data from dashboard stats
      fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/v1/dashboard/stats`,
        {
          credentials: "include",
        },
      )
        .then((r) => r.json())
        .then((body) => {
          const kpis = body.data?.kpis;
          if (kpis) {
            setChecklistData({
              hasProducts: kpis.productos_activos > 0,
              hasClients: kpis.clientes_activos > 0,
              hasOrders:
                kpis.pedidos_hoy > 0 ||
                (body.data?.recent_activity?.length || 0) > 0,
              hasEmployees: true, // they registered so at least 1 exists
              hasBranches: true, // default branch exists
              hasPaymentMethods: true, // assume basic setup
            });
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const completedCount = useMemo(() => {
    if (!checklistData) return 0;
    return CHECKLIST_ITEMS.filter((item) => item.checkFn(checklistData)).length;
  }, [checklistData]);

  const progress = Math.round((completedCount / CHECKLIST_ITEMS.length) * 100);

  if (
    dismissed ||
    !user ||
    user.rol !== "ADMIN" ||
    completedCount === CHECKLIST_ITEMS.length
  ) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(CHECKLIST_DISMISSED_KEY, "true");
  };

  return (
    <Card className="border-[var(--accent)]/20 bg-gradient-to-br from-[var(--accent)]/5 to-transparent">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--accent)]" />
            <CardTitle className="text-sm font-semibold">
              Configuracion Inicial
            </CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleDismiss}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Progress value={progress} className="h-1.5 flex-1" />
          <span className="text-xs text-muted-foreground">
            {completedCount}/{CHECKLIST_ITEMS.length}
          </span>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-1 pt-0">
          {CHECKLIST_ITEMS.map((item) => {
            const completed = checklistData
              ? item.checkFn(checklistData)
              : false;
            return (
              <Link key={item.id} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent/10",
                    completed && "opacity-60",
                  )}
                >
                  {completed ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "font-medium",
                        completed && "line-through",
                      )}
                    >
                      {item.label}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </CardContent>
      )}
    </Card>
  );
}

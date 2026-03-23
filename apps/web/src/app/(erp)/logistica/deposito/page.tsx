"use client";

import { useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { usePedidos, useTransitionPedido } from "@/hooks/queries/use-orders";
import { pedidosApi } from "@/lib/orders";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Truck,
  Loader2,
} from "lucide-react";
import gsap from "gsap";
import type { PedidoList } from "@pronto/shared/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(
    n,
  );

const timeAgo = (date: string) => {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60_000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffD > 0) return `hace ${diffD}d`;
  if (diffH > 0) return `hace ${diffH}h`;
  if (diffMin > 0) return `hace ${diffMin}m`;
  return "ahora";
};

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

interface ColumnDef {
  title: string;
  borderColor: string;
  badgeVariant: "default" | "secondary" | "destructive" | "outline";
  estados: string[];
}

const COLUMNS: ColumnDef[] = [
  {
    title: "Pendientes",
    borderColor: "border-t-amber-500",
    badgeVariant: "outline",
    estados: ["APROBADO"],
  },
  {
    title: "En Preparacion",
    borderColor: "border-t-teal-500",
    badgeVariant: "secondary",
    estados: ["EN_CONSOLIDACION", "EN_PREPARACION"],
  },
  {
    title: "Sin Stock",
    borderColor: "border-t-red-500",
    badgeVariant: "destructive",
    estados: ["PENDIENTE_ABASTECIMIENTO"],
  },
  {
    title: "Listos",
    borderColor: "border-t-emerald-500",
    badgeVariant: "default",
    estados: ["LISTO_PARA_ENVIO"],
  },
];

// ---------------------------------------------------------------------------
// Order card
// ---------------------------------------------------------------------------

function OrderCard({
  pedido,
  columnIndex,
  transitionMutation,
}: {
  pedido: PedidoList;
  columnIndex: number;
  transitionMutation: ReturnType<typeof useTransitionPedido>;
}) {
  const router = useRouter();
  const isPending = transitionMutation.isPending;

  const handleStockOk = async (pedidoId: string) => {
    await pedidosApi.transition(pedidoId, { estado: "ABASTECIDO" });
    transitionMutation.mutate({
      id: pedidoId,
      data: { estado: "EN_PREPARACION" },
    });
  };

  return (
    <div
      className="rounded-lg border bg-card p-3 space-y-2 cursor-pointer transition-colors hover:bg-accent/50"
      onClick={() => router.push(`/logistica/deposito/${pedido.id}`)}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-bold text-primary">
          {pedido.numero}
        </span>
        <span className="text-[11px] text-muted-foreground">
          {timeAgo(pedido.fecha_pedido)}
        </span>
      </div>
      <p className="text-sm font-medium truncate">{pedido.cliente_nombre}</p>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold tabular-nums">
          {formatCurrency(pedido.total)}
        </span>
        <div
          className="flex gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Column 0: Pendientes → Iniciar */}
          {columnIndex === 0 && (
            <Button
              size="sm"
              className="h-7 text-xs"
              disabled={isPending}
              onClick={() =>
                transitionMutation.mutate({
                  id: pedido.id,
                  data: { estado: "EN_PREPARACION" },
                })
              }
            >
              Iniciar <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          )}

          {/* Column 1: En Preparacion → Listo / Sin Stock */}
          {columnIndex === 1 && (
            <>
              <Button
                size="sm"
                className="h-7 text-xs"
                disabled={isPending}
                onClick={() =>
                  transitionMutation.mutate({
                    id: pedido.id,
                    data: { estado: "LISTO_PARA_ENVIO" },
                  })
                }
              >
                Listo <CheckCircle2 className="ml-1 h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-7 text-xs"
                disabled={isPending}
                onClick={() =>
                  transitionMutation.mutate({
                    id: pedido.id,
                    data: { estado: "PENDIENTE_ABASTECIMIENTO" },
                  })
                }
              >
                Sin Stock
              </Button>
            </>
          )}

          {/* Column 2: Sin Stock → Stock OK (chain transition) */}
          {columnIndex === 2 && (
            <Button
              size="sm"
              className="h-7 text-xs"
              disabled={isPending}
              onClick={() => handleStockOk(pedido.id)}
            >
              Stock OK <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          )}

          {/* Column 3: Listos → Despachar */}
          {columnIndex === 3 && (
            <Button
              size="sm"
              className="h-7 text-xs"
              disabled={isPending}
              onClick={() =>
                transitionMutation.mutate({
                  id: pedido.id,
                  data: { estado: "ENVIADO" },
                })
              }
            >
              Despachar <Truck className="ml-1 h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function DepositoKanbanPage() {
  const router = useRouter();
  const transitionMutation = useTransitionPedido();

  const queryOpts = { pageSize: 100 } as const;

  const aprobados = usePedidos({
    ...queryOpts,
    estado: "APROBADO",
  });
  const enConsolidacion = usePedidos({
    ...queryOpts,
    estado: "EN_CONSOLIDACION",
  });
  const enPreparacion = usePedidos({
    ...queryOpts,
    estado: "EN_PREPARACION",
  });
  const sinStock = usePedidos({
    ...queryOpts,
    estado: "PENDIENTE_ABASTECIMIENTO",
  });
  const listos = usePedidos({
    ...queryOpts,
    estado: "LISTO_PARA_ENVIO",
  });

  // Combine the EN_CONSOLIDACION + EN_PREPARACION into a single list
  const preparacionList: PedidoList[] = [
    ...(enConsolidacion.data?.data ?? []),
    ...(enPreparacion.data?.data ?? []),
  ];

  const columnData: PedidoList[][] = [
    aprobados.data?.data ?? [],
    preparacionList,
    sinStock.data?.data ?? [],
    listos.data?.data ?? [],
  ];

  const counts = columnData.map((col) => col.length);

  const isLoading =
    aprobados.isLoading ||
    enConsolidacion.isLoading ||
    enPreparacion.isLoading ||
    sinStock.isLoading ||
    listos.isLoading;

  // ---- GSAP animations ----
  useLayoutEffect(() => {
    if (isLoading) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".deposito-header",
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" },
      );
      gsap.fromTo(
        ".deposito-kpi",
        { opacity: 0, y: 15 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.08,
          delay: 0.1,
          ease: "power3.out",
        },
      );
      gsap.fromTo(
        ".deposito-column",
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.1,
          delay: 0.25,
          ease: "power3.out",
        },
      );
    });
    return () => ctx.revert();
  }, [isLoading]);

  // ---- KPI definitions ----
  const kpis = [
    {
      label: "Pendientes",
      value: counts[0],
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      label: "En Preparacion",
      value: counts[1],
      icon: Package,
      color: "text-teal-500",
      bg: "bg-teal-500/10",
    },
    {
      label: "Sin Stock",
      value: counts[2],
      icon: AlertTriangle,
      color: "text-red-500",
      bg: "bg-red-500/10",
    },
    {
      label: "Listos",
      value: counts[3],
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
  ];

  // ---- Loading state ----
  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="deposito-header">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Panel de Deposito
        </h1>
        <p className="text-muted-foreground">
          Gestion de preparacion de pedidos
        </p>
      </div>

      {/* KPI bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="deposito-kpi">
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`rounded-lg p-2.5 ${kpi.bg}`}>
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className="text-2xl font-bold tabular-nums">{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map((col, colIdx) => (
          <Card
            key={col.title}
            className={`deposito-column border-t-2 ${col.borderColor}`}
          >
            <CardHeader className="pb-2 px-3 pt-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">
                  {col.title}
                </CardTitle>
                <Badge variant={col.badgeVariant} className="tabular-nums">
                  {counts[colIdx]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="max-h-[calc(100vh-340px)] overflow-y-auto space-y-2 p-3">
                {columnData[colIdx].length === 0 ? (
                  <p className="py-8 text-center text-xs text-muted-foreground">
                    Sin pedidos
                  </p>
                ) : (
                  columnData[colIdx].map((pedido) => (
                    <OrderCard
                      key={pedido.id}
                      pedido={pedido}
                      columnIndex={colIdx}
                      transitionMutation={transitionMutation}
                    />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

"use client";

import { use, useState, useRef, useLayoutEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { usePedido, useTransitionPedido } from "@/hooks/queries/use-orders";
import { pedidosApi } from "@/lib/orders";
import type { PedidoDetail } from "@pronto/shared/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Package,
  CheckCircle2,
  AlertTriangle,
  Truck,
} from "lucide-react";
import gsap from "gsap";

/* ---------- Status config ---------- */

const ESTADO_LABELS: Record<string, string> = {
  APROBADO: "Aprobado",
  EN_CONSOLIDACION: "En Consolidacion",
  EN_PREPARACION: "En Preparacion",
  PENDIENTE_ABASTECIMIENTO: "Pendiente Abastecimiento",
  ABASTECIDO: "Abastecido",
  LISTO_PARA_ENVIO: "Listo para Envio",
  ENVIADO: "Enviado",
};

const ESTADO_COLORS: Record<string, string> = {
  APROBADO:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  EN_CONSOLIDACION:
    "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
  EN_PREPARACION:
    "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400",
  PENDIENTE_ABASTECIMIENTO:
    "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
  ABASTECIDO:
    "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-400",
  LISTO_PARA_ENVIO:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  ENVIADO:
    "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
};

const ESTADO_ACTIONS: Record<
  string,
  Array<{
    label: string;
    target: string;
    variant: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    icon: typeof Package;
  }>
> = {
  APROBADO: [
    { label: "Iniciar Preparacion", target: "EN_PREPARACION", variant: "default", icon: Package },
  ],
  EN_CONSOLIDACION: [
    { label: "Iniciar Preparacion", target: "EN_PREPARACION", variant: "default", icon: Package },
  ],
  EN_PREPARACION: [
    { label: "Marcar Listo", target: "LISTO_PARA_ENVIO", variant: "default", icon: CheckCircle2 },
    { label: "Sin Stock", target: "PENDIENTE_ABASTECIMIENTO", variant: "destructive", icon: AlertTriangle },
  ],
  PENDIENTE_ABASTECIMIENTO: [
    { label: "Stock Disponible", target: "EN_PREPARACION", variant: "default", icon: Package },
  ],
  LISTO_PARA_ENVIO: [
    { label: "Despachar", target: "ENVIADO", variant: "default", icon: Truck },
  ],
};

/* ---------- Helpers ---------- */

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(n);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/* ---------- Page component ---------- */

export default function DepositoPreparacionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const { data: pedido, isLoading } = usePedido(id);
  const transitionMutation = useTransitionPedido();

  // Picking progress (client-side only)
  const [pickedItems, setPickedItems] = useState<Set<string>>(new Set());

  // "Sin Stock" dialog state
  const [showStockDialog, setShowStockDialog] = useState(false);
  const [missingItems, setMissingItems] = useState<Set<string>>(new Set());
  const [stockNotes, setStockNotes] = useState("");

  // GSAP animation
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (isLoading || !pedido || !containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".prep-header",
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" },
      );
      gsap.fromTo(
        ".prep-item",
        { opacity: 0, y: 12 },
        {
          opacity: 1,
          y: 0,
          duration: 0.35,
          stagger: 0.05,
          delay: 0.15,
          ease: "power3.out",
        },
      );
      gsap.fromTo(
        ".prep-card",
        { opacity: 0, y: 15 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.08,
          delay: 0.25,
          ease: "power3.out",
        },
      );
    }, containerRef);
    return () => ctx.revert();
  }, [isLoading, pedido]);

  // Progress calculation
  const progressPercent = useMemo(() => {
    if (!pedido?.items?.length) return 0;
    return Math.round((pickedItems.size / pedido.items.length) * 100);
  }, [pickedItems.size, pedido?.items?.length]);

  const actions = pedido ? ESTADO_ACTIONS[pedido.estado] ?? [] : [];

  /* ---------- Handlers ---------- */

  function toggleItem(itemId: string) {
    setPickedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }

  function handleAction(target: string) {
    if (target === "PENDIENTE_ABASTECIMIENTO") {
      setMissingItems(new Set());
      setStockNotes("");
      setShowStockDialog(true);
      return;
    }

    if (target === "EN_PREPARACION" && pedido?.estado === "PENDIENTE_ABASTECIMIENTO") {
      // Chain: ABASTECIDO → EN_PREPARACION
      pedidosApi
        .transition(id, { estado: "ABASTECIDO" })
        .then(() => {
          transitionMutation.mutate({ id, data: { estado: "EN_PREPARACION" } });
        })
        .catch(() => {
          // toast handled by mutation
        });
      return;
    }

    transitionMutation.mutate({ id, data: { estado: target } });
  }

  function handleConfirmSinStock() {
    if (!pedido) return;
    const missingNames = pedido.items
      .filter((item) => missingItems.has(item.id))
      .map((item) => item.producto_nombre);

    const comentario = [
      missingNames.length > 0
        ? `Productos faltantes: ${missingNames.join(", ")}`
        : null,
      stockNotes.trim() || null,
    ]
      .filter(Boolean)
      .join(". ");

    transitionMutation.mutate(
      {
        id,
        data: {
          estado: "PENDIENTE_ABASTECIMIENTO",
          comentario: comentario || "Sin stock",
        },
      },
      {
        onSuccess: () => {
          setShowStockDialog(false);
          setMissingItems(new Set());
          setStockNotes("");
        },
      },
    );
  }

  function toggleMissingItem(itemId: string) {
    setMissingItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }

  /* ---------- Loading / Error states ---------- */

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Cargando pedido...</p>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Pedido no encontrado</p>
      </div>
    );
  }

  /* ---------- Render ---------- */

  return (
    <div ref={containerRef} className="space-y-6 pb-8">
      {/* Header */}
      <div className="prep-header space-y-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight font-mono sm:text-3xl">
                {pedido.numero}
              </h1>
              <Badge
                variant="secondary"
                className={`border-0 text-xs font-medium ${ESTADO_COLORS[pedido.estado] || ""}`}
              >
                {ESTADO_LABELS[pedido.estado] || pedido.estado}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
              <span className="font-medium text-foreground">
                {pedido.cliente_nombre}
              </span>
              <span aria-hidden="true">·</span>
              <span>{formatDate(pedido.fecha_pedido)}</span>
              {pedido.sucursal_nombre && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{pedido.sucursal_nombre}</span>
                </>
              )}
            </div>
          </div>

          {/* Action buttons */}
          {actions.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {actions.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.target}
                    variant={action.variant}
                    size="lg"
                    className="min-h-[48px] text-sm sm:text-base"
                    onClick={() => handleAction(action.target)}
                    disabled={transitionMutation.isPending}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {action.label}
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <Card className="prep-card border-0 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Progreso de preparacion</p>
            <p className="text-sm tabular-nums text-muted-foreground">
              <span className="font-semibold text-foreground">
                {pickedItems.size}
              </span>{" "}
              / {pedido.items.length} items preparados
            </p>
          </div>
          <Progress value={progressPercent} className="h-3" />
          {progressPercent === 100 && (
            <p className="mt-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              Todos los items fueron preparados
            </p>
          )}
        </CardContent>
      </Card>

      {/* Main content: picking list + summary side by side on large screens */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Picking list */}
        <Card className="prep-card border-0 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Lista de preparacion ({pedido.items.length} items)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {pedido.items.map((item) => {
                const isPicked = pickedItems.has(item.id);
                return (
                  <label
                    key={item.id}
                    className={`prep-item flex items-center gap-4 px-4 py-3 sm:px-6 sm:py-4 cursor-pointer transition-colors hover:bg-muted/50 select-none ${
                      isPicked ? "bg-muted/30" : ""
                    }`}
                  >
                    <Checkbox
                      checked={isPicked}
                      onCheckedChange={() => toggleItem(item.id)}
                      className="h-5 w-5 shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.producto_codigo ? (
                          <span
                            className={`font-mono text-xs ${
                              isPicked
                                ? "text-muted-foreground line-through"
                                : "text-muted-foreground"
                            }`}
                          >
                            {item.producto_codigo}
                          </span>
                        ) : (
                          <span className="font-mono text-xs text-muted-foreground/50">
                            Sin codigo
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-sm font-medium mt-0.5 ${
                          isPicked
                            ? "line-through text-muted-foreground"
                            : "text-foreground"
                        }`}
                      >
                        {item.producto_nombre}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p
                        className={`text-sm font-bold tabular-nums ${
                          isPicked ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {item.cantidad}
                        {item.unidad && (
                          <span className="ml-1 text-xs font-normal text-muted-foreground">
                            {item.unidad}
                          </span>
                        )}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>

            {pedido.items.length === 0 && (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No hay items en este pedido
              </p>
            )}
          </CardContent>
        </Card>

        {/* Right column: summary + observations */}
        <div className="space-y-6">
          {/* Order summary */}
          <Card className="prep-card border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Resumen del pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">{formatCurrency(pedido.subtotal)}</span>
              </div>
              {pedido.descuento_monto > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Descuento</span>
                  <span className="tabular-nums text-red-600 dark:text-red-400">
                    -{formatCurrency(pedido.descuento_monto)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Impuestos</span>
                <span className="tabular-nums">
                  {formatCurrency(pedido.total_impuestos)}
                </span>
              </div>
              <div className="border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Total</span>
                  <span className="text-lg font-bold tabular-nums">
                    {formatCurrency(pedido.total)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Observations */}
          {(pedido.observaciones || pedido.observaciones_internas) && (
            <Card className="prep-card border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Observaciones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pedido.observaciones && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                      Cliente
                    </p>
                    <p className="text-sm whitespace-pre-wrap">
                      {pedido.observaciones}
                    </p>
                  </div>
                )}
                {pedido.observaciones_internas && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                      Internas
                    </p>
                    <p className="text-sm whitespace-pre-wrap">
                      {pedido.observaciones_internas}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Sin Stock Dialog */}
      <Dialog open={showStockDialog} onOpenChange={setShowStockDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Reportar faltante de stock</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Selecciona los productos que no tienen stock disponible:
            </p>
            <div className="max-h-60 overflow-y-auto space-y-2 rounded-md border p-3">
              {pedido.items.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-3 py-1.5 cursor-pointer select-none"
                >
                  <Checkbox
                    checked={missingItems.has(item.id)}
                    onCheckedChange={() => toggleMissingItem(item.id)}
                  />
                  <span className="text-sm flex-1 min-w-0 truncate">
                    {item.producto_nombre}
                  </span>
                  <span className="text-sm tabular-nums font-medium shrink-0">
                    {item.cantidad}
                    {item.unidad && (
                      <span className="ml-1 text-xs font-normal text-muted-foreground">
                        {item.unidad}
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Notas adicionales
              </label>
              <Textarea
                placeholder="Detalles sobre el faltante..."
                rows={3}
                value={stockNotes}
                onChange={(e) => setStockNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowStockDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmSinStock}
              disabled={transitionMutation.isPending}
            >
              {transitionMutation.isPending ? "Enviando..." : "Confirmar Faltante"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState, useRef, useLayoutEffect } from "react";
import {
  useRepartos,
  useReparto,
  useTransitionReparto,
  useCreateEventoReparto,
} from "@/hooks/queries/use-logistics";
import type { RepartoList, RepartoPedido } from "@pronto/shared/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SignatureCapture } from "@/components/signature-pad";
import {
  Truck,
  MapPin,
  Package,
  CheckCircle2,
  XCircle,
  Navigation,
  Square,
  User,
  Hash,
  DollarSign,
} from "lucide-react";
import { EmptyDeliveries } from "@/components/illustrations";
import gsap from "gsap";

const ESTADO_REPARTO_LABELS: Record<string, string> = {
  PLANIFICADO: "Planificado",
  EN_CURSO: "En Curso",
  FINALIZADO: "Finalizado",
  CANCELADO: "Cancelado",
};

const ESTADO_REPARTO_COLORS: Record<string, string> = {
  PLANIFICADO:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  EN_CURSO:
    "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
  FINALIZADO:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  CANCELADO:
    "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
};

const PEDIDO_ESTADO_COLORS: Record<string, string> = {
  EN_REPARTO:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-teal-400",
  ENTREGADO:
    "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400",
  NO_ENTREGADO:
    "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400",
  PREPARADO:
    "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-400",
};

const PEDIDO_ESTADO_LABELS: Record<string, string> = {
  EN_REPARTO: "En Reparto",
  ENTREGADO: "Entregado",
  NO_ENTREGADO: "No Entregado",
  PREPARADO: "Preparado",
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(n);
}

export default function MiRutaPage() {
  // Fetch repartos EN_CURSO — the current user's active delivery
  const { data: repartosData, isLoading: isLoadingList } = useRepartos({
    page: 1,
    pageSize: 10,
    estado: "EN_CURSO",
  });

  const repartosList: RepartoList[] = repartosData?.data || [];

  // Find the first active reparto (the API filters by the current user)
  const activeRepartoId = repartosList.length > 0 ? repartosList[0].id : null;

  // Fetch full detail for the active reparto
  const { data: reparto, isLoading: isLoadingDetail } = useReparto(
    activeRepartoId || ""
  );

  const transitionMutation = useTransitionReparto();
  const createEventoMutation = useCreateEventoReparto();

  const [showFinalizarDialog, setShowFinalizarDialog] = useState(false);
  const [kmFin, setKmFin] = useState("");
  const [eventoConfirm, setEventoConfirm] = useState<{
    pedidoId: string;
    pedidoNumero: string;
    tipo: string;
    label: string;
  } | null>(null);
  const [entregaDialog, setEntregaDialog] = useState<{
    pedidoId: string;
    pedidoNumero: string;
  } | null>(null);
  const [entregaFirmaUrl, setEntregaFirmaUrl] = useState<string | null>(null);

  const isLoading = isLoadingList || (activeRepartoId ? isLoadingDetail : false);

  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (isLoading || !containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".miruta-header",
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
      );
      gsap.fromTo(
        ".miruta-card",
        { opacity: 0, y: 15 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.06,
          delay: 0.15,
          ease: "power3.out",
        }
      );
    }, containerRef);
    return () => ctx.revert();
  }, [isLoading, reparto]);

  const handleFinalizar = () => {
    if (!activeRepartoId) return;
    const data: { estado: string; km_fin?: number } = {
      estado: "FINALIZADO",
    };
    if (kmFin) data.km_fin = Number(kmFin);
    transitionMutation.mutate(
      { id: activeRepartoId, data },
      {
        onSuccess: () => {
          setShowFinalizarDialog(false);
          setKmFin("");
        },
      }
    );
  };

  const handleEvento = () => {
    if (!eventoConfirm || !activeRepartoId) return;
    createEventoMutation.mutate(
      {
        repartoId: activeRepartoId,
        data: {
          pedido_id: eventoConfirm.pedidoId,
          tipo: eventoConfirm.tipo,
        },
      },
      {
        onSuccess: () => setEventoConfirm(null),
      }
    );
  };

  const handleEntrega = () => {
    if (!entregaDialog || !activeRepartoId) return;
    const payload: Record<string, unknown> = {
      pedido_id: entregaDialog.pedidoId,
      tipo: "ENTREGA",
    };
    if (entregaFirmaUrl) {
      payload.firma_url = entregaFirmaUrl;
    }
    createEventoMutation.mutate(
      { repartoId: activeRepartoId, data: payload },
      {
        onSuccess: () => {
          setEntregaDialog(null);
          setEntregaFirmaUrl(null);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Cargando tu ruta...</p>
      </div>
    );
  }

  // No active reparto
  if (!activeRepartoId || !reparto) {
    return (
      <div ref={containerRef} className="space-y-6">
        <div className="miruta-header">
          <h1 className="text-3xl font-bold tracking-tight">Mi Ruta</h1>
          <p className="text-muted-foreground mt-1">
            Tu reparto activo del dia
          </p>
        </div>
        <div className="miruta-card flex flex-col items-center justify-center py-16 gap-6">
          <div className="w-56 h-56 opacity-70">
            <EmptyDeliveries className="w-full h-full" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-xl font-semibold text-foreground">
              No tienes un reparto activo
            </p>
            <p className="text-sm text-muted-foreground max-w-md">
              Cuando se te asigne un reparto y este en curso, aparecera aqui con
              todos los pedidos a entregar.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const pedidos = reparto.pedidos || [];
  const entregados = pedidos.filter(
    (p: RepartoPedido) => p.pedido_estado === "ENTREGADO"
  ).length;
  const totalPedidos = pedidos.length;

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="miruta-header space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {reparto.numero}
              </h1>
              <Badge
                variant="secondary"
                className={`border-0 text-sm font-medium ${ESTADO_REPARTO_COLORS[reparto.estado] || ""}`}
              >
                {ESTADO_REPARTO_LABELS[reparto.estado] || reparto.estado}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              {new Date(reparto.fecha + "T00:00:00").toLocaleDateString(
                "es-AR",
                { weekday: "long", year: "numeric", month: "long", day: "numeric" }
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Progress + info cards */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <Card className="miruta-card border-0 shadow-sm">
          <CardContent className="pt-5 pb-4 px-4">
            <div className="flex items-center gap-2.5">
              <Package className="h-5 w-5 text-primary" />
              <div>
                <p className="text-lg font-bold">
                  {entregados}/{totalPedidos}
                </p>
                <p className="text-xs text-muted-foreground">Entregados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="miruta-card border-0 shadow-sm">
          <CardContent className="pt-5 pb-4 px-4">
            <div className="flex items-center gap-2.5">
              <Truck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-sm font-medium truncate">
                  {reparto.vehiculo_patente || "N/A"}
                </p>
                <p className="text-xs text-muted-foreground">Vehiculo</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="miruta-card border-0 shadow-sm">
          <CardContent className="pt-5 pb-4 px-4">
            <div className="flex items-center gap-2.5">
              <MapPin className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              <div>
                <p className="text-sm font-medium truncate">
                  {reparto.zona_nombre || "Sin zona"}
                </p>
                <p className="text-xs text-muted-foreground">Zona</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="miruta-card border-0 shadow-sm">
          <CardContent className="pt-5 pb-4 px-4">
            <div className="flex items-center gap-2.5">
              <DollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-sm font-bold tabular-nums">
                  {formatCurrency(
                    pedidos.reduce(
                      (acc: number, p: RepartoPedido) => acc + p.pedido_total,
                      0
                    )
                  )}
                </p>
                <p className="text-xs text-muted-foreground">Total a cobrar</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pedidos cards - mobile friendly */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold miruta-card">
          Pedidos a entregar ({totalPedidos})
        </h2>
        {pedidos.map((pedido: RepartoPedido, index: number) => (
          <Card
            key={pedido.id}
            className="miruta-card border-0 shadow-sm overflow-hidden"
          >
            <div
              className={`h-1 ${
                pedido.pedido_estado === "ENTREGADO"
                  ? "bg-emerald-500"
                  : pedido.pedido_estado === "NO_ENTREGADO"
                    ? "bg-red-500"
                    : "bg-primary/50"
              }`}
            />
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-muted-foreground">
                      #{index + 1}
                    </span>
                    <Badge
                      variant="outline"
                      className="font-mono text-xs border-primary/30 text-primary"
                    >
                      {pedido.pedido_numero}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className={`border-0 text-xs font-medium ${PEDIDO_ESTADO_COLORS[pedido.pedido_estado] || ""}`}
                    >
                      {PEDIDO_ESTADO_LABELS[pedido.pedido_estado] ||
                        pedido.pedido_estado}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium truncate">
                        {pedido.cliente_nombre}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Hash className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm font-bold tabular-nums">
                      {formatCurrency(pedido.pedido_total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick action buttons - only for pedidos still in delivery */}
              {pedido.pedido_estado === "EN_REPARTO" && (
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-9 text-xs"
                    onClick={() =>
                      setEventoConfirm({
                        pedidoId: pedido.pedido_id,
                        pedidoNumero: pedido.pedido_numero,
                        tipo: "LLEGADA",
                        label: "Llegada",
                      })
                    }
                    disabled={createEventoMutation.isPending}
                  >
                    <Navigation className="mr-1.5 h-3.5 w-3.5" />
                    Llegada
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() =>
                      setEntregaDialog({
                        pedidoId: pedido.pedido_id,
                        pedidoNumero: pedido.pedido_numero,
                      })
                    }
                    disabled={createEventoMutation.isPending}
                  >
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                    Entregado
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1 h-9 text-xs"
                    onClick={() =>
                      setEventoConfirm({
                        pedidoId: pedido.pedido_id,
                        pedidoNumero: pedido.pedido_numero,
                        tipo: "NO_ENTREGA",
                        label: "No Entregado",
                      })
                    }
                    disabled={createEventoMutation.isPending}
                  >
                    <XCircle className="mr-1.5 h-3.5 w-3.5" />
                    No Entregado
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Finalizar Reparto button */}
      <div className="miruta-card pt-4 pb-8">
        <Button
          size="lg"
          className="w-full h-12 text-base font-semibold"
          onClick={() => setShowFinalizarDialog(true)}
          disabled={transitionMutation.isPending}
        >
          <Square className="mr-2 h-5 w-5" />
          Finalizar Reparto
        </Button>
      </div>

      {/* Evento confirmation dialog */}
      <AlertDialog
        open={!!eventoConfirm}
        onOpenChange={() => setEventoConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirmar: {eventoConfirm?.label}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Se registrara el evento &quot;{eventoConfirm?.label}&quot; para el
              pedido {eventoConfirm?.pedidoNumero}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleEvento}>
              {createEventoMutation.isPending ? "Registrando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Entrega with signature dialog */}
      <Dialog
        open={!!entregaDialog}
        onOpenChange={() => {
          setEntregaDialog(null);
          setEntregaFirmaUrl(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Entrega</DialogTitle>
            <DialogDescription>
              Pedido {entregaDialog?.pedidoNumero} — Capture la firma del
              receptor para confirmar la entrega.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3">
            {entregaFirmaUrl ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Firma capturada</p>
                <div className="rounded-lg border bg-white p-2">
                  <img
                    src={entregaFirmaUrl}
                    alt="Firma"
                    className="mx-auto h-24 object-contain"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => setEntregaFirmaUrl(null)}
                >
                  Cambiar firma
                </Button>
              </div>
            ) : (
              <SignatureCapture
                title="Firma del receptor"
                onSave={(dataUrl) => setEntregaFirmaUrl(dataUrl)}
                width={360}
                height={150}
                className="border shadow-none"
              />
            )}
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={handleEntrega}
              disabled={createEventoMutation.isPending}
            >
              Confirmar sin firma
            </Button>
            <Button
              onClick={handleEntrega}
              disabled={createEventoMutation.isPending || !entregaFirmaUrl}
            >
              {createEventoMutation.isPending
                ? "Registrando..."
                : "Confirmar Entrega"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Finalizar Reparto dialog */}
      <AlertDialog
        open={showFinalizarDialog}
        onOpenChange={setShowFinalizarDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar Reparto</AlertDialogTitle>
            <AlertDialogDescription>
              Una vez finalizado, no podras registrar mas eventos. Opcionalmente
              ingresa el kilometraje final.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2 space-y-2">
            <label className="text-sm font-medium">
              Kilometraje final (opcional)
            </label>
            <Input
              type="number"
              placeholder="Ej: 45380"
              value={kmFin}
              onChange={(e) => setKmFin(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleFinalizar}
              disabled={transitionMutation.isPending}
            >
              {transitionMutation.isPending
                ? "Finalizando..."
                : "Finalizar Reparto"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

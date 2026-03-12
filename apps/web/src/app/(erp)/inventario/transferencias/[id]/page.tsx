"use client";

import { use, useState, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import {
  useTransferencia,
  useTransitionTransferencia,
} from "@/hooks/queries/use-transfers";
import { useUserStore } from "@/store/user-store";
import { hasPermission } from "@/lib/permissions";
import type { ItemTransferencia } from "@nexora/shared/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  ArrowLeftRight,
  Building2,
  Check,
  CheckCircle2,
  Circle,
  Clock,
  Package,
  Truck,
  User,
  X,
  XCircle,
} from "lucide-react";
import gsap from "gsap";

const TRANSFER_STATUS_LABELS: Record<string, string> = {
  PENDIENTE: "Pendiente",
  APROBADA: "Aprobada",
  EN_TRANSITO: "En Transito",
  COMPLETADA: "Completada",
  CANCELADA: "Cancelada",
};

const TRANSFER_STATUS_COLORS: Record<string, string> = {
  PENDIENTE:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  APROBADA:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  EN_TRANSITO:
    "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
  COMPLETADA:
    "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400",
  CANCELADA:
    "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
};

const STATUS_ORDER = [
  "PENDIENTE",
  "APROBADA",
  "EN_TRANSITO",
  "COMPLETADA",
];

const TRANSITIONS: Record<string, string[]> = {
  PENDIENTE: ["APROBADA", "CANCELADA"],
  APROBADA: ["EN_TRANSITO", "CANCELADA"],
  EN_TRANSITO: ["COMPLETADA"],
};

const TRANSITION_BUTTON_STYLES: Record<string, string> = {
  APROBADA: "bg-emerald-600 hover:bg-emerald-700 text-white",
  EN_TRANSITO: "bg-blue-600 hover:bg-blue-700 text-white",
  COMPLETADA: "bg-green-600 hover:bg-green-700 text-white",
  CANCELADA: "bg-red-600 hover:bg-red-700 text-white",
};

export default function TransferenciaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const user = useUserStore((s) => s.user);
  const permissions = user?.permissions ?? [];
  const canManage = hasPermission(permissions, "stock:adjust");

  const { data: transferencia, isLoading } = useTransferencia(id);
  const transitionMutation = useTransitionTransferencia();

  const [transitionDialog, setTransitionDialog] = useState<string | null>(null);
  const [transitionItems, setTransitionItems] = useState<
    Array<{ id: string; cantidad_enviada: number; cantidad_recibida: number }>
  >([]);

  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (isLoading || !transferencia || !containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".detail-header",
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
      );
      gsap.fromTo(
        ".detail-card",
        { opacity: 0, y: 15 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.08,
          delay: 0.15,
          ease: "power3.out",
        }
      );
    }, containerRef);
    return () => ctx.revert();
  }, [isLoading, transferencia]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Cargando transferencia...</p>
      </div>
    );
  }

  if (!transferencia) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Transferencia no encontrada</p>
      </div>
    );
  }

  const availableTransitions = TRANSITIONS[transferencia.estado] || [];

  const openTransitionDialog = (targetEstado: string) => {
    if (targetEstado === "EN_TRANSITO" || targetEstado === "COMPLETADA") {
      setTransitionItems(
        transferencia.items.map((item) => ({
          id: item.id,
          cantidad_enviada:
            targetEstado === "EN_TRANSITO"
              ? item.cantidad_solicitada
              : item.cantidad_enviada,
          cantidad_recibida:
            targetEstado === "COMPLETADA"
              ? item.cantidad_enviada
              : item.cantidad_recibida,
        }))
      );
    }
    setTransitionDialog(targetEstado);
  };

  const executeTransition = () => {
    if (!transitionDialog) return;
    const needsItems =
      transitionDialog === "EN_TRANSITO" || transitionDialog === "COMPLETADA";
    transitionMutation.mutate(
      {
        id,
        data: {
          estado: transitionDialog,
          items: needsItems ? transitionItems : undefined,
        },
      },
      {
        onSuccess: () => {
          setTransitionDialog(null);
          setTransitionItems([]);
        },
      }
    );
  };

  const updateTransitionItem = (
    itemId: string,
    field: "cantidad_enviada" | "cantidad_recibida",
    value: number
  ) => {
    setTransitionItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );
  };

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="detail-header space-y-4">
        <Link
          href="/inventario/transferencias"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Transferencias
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {transferencia.numero}
              </h1>
              <Badge
                variant="secondary"
                className={`border-0 text-xs font-medium ${TRANSFER_STATUS_COLORS[transferencia.estado] || ""}`}
              >
                {TRANSFER_STATUS_LABELS[transferencia.estado] ||
                  transferencia.estado}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              {new Date(transferencia.fecha_solicitud).toLocaleDateString(
                "es-AR",
                {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Transition actions */}
      {canManage && availableTransitions.length > 0 && (
        <Card className="detail-card border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                Cambiar estado:
              </span>
              {availableTransitions.map((targetEstado) => (
                <Button
                  key={targetEstado}
                  size="sm"
                  className={TRANSITION_BUTTON_STYLES[targetEstado] || ""}
                  onClick={() => openTransitionDialog(targetEstado)}
                  disabled={transitionMutation.isPending}
                >
                  {targetEstado === "CANCELADA" && (
                    <X className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  {targetEstado === "APROBADA" && (
                    <Check className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  {targetEstado === "EN_TRANSITO" && (
                    <Truck className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  {targetEstado === "COMPLETADA" && (
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  {TRANSFER_STATUS_LABELS[targetEstado]}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Info card */}
          <Card className="detail-card border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Informacion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-5 text-sm">
                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Sucursal Origen
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">
                      {transferencia.sucursal_origen_nombre}
                    </p>
                  </div>
                </div>
                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Sucursal Destino
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">
                      {transferencia.sucursal_destino_nombre}
                    </p>
                  </div>
                </div>
                {transferencia.solicitado_por_nombre && (
                  <div>
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Solicitado por
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">
                        {transferencia.solicitado_por_nombre}
                      </p>
                    </div>
                  </div>
                )}
                {transferencia.aprobado_por_nombre && (
                  <div>
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Aprobado por
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">
                        {transferencia.aprobado_por_nombre}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              {transferencia.observaciones && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Observaciones
                    </span>
                    <p className="mt-1 text-sm">
                      {transferencia.observaciones}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Items card */}
          <Card className="detail-card border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Productos ({transferencia.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-muted/50">
                    <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Producto
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Codigo
                    </TableHead>
                    <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Solicitada
                    </TableHead>
                    <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Enviada
                    </TableHead>
                    <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Recibida
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transferencia.items.map((item) => (
                    <TableRow key={item.id} className="border-muted/30">
                      <TableCell className="font-medium">
                        {item.producto_nombre}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.producto_codigo || "\u2014"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {item.cantidad_solicitada}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {item.cantidad_enviada > 0
                          ? item.cantidad_enviada
                          : "\u2014"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {item.cantidad_recibida > 0
                          ? item.cantidad_recibida
                          : "\u2014"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Timeline sidebar */}
        <div className="detail-card">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Progreso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TransferStatusTimeline
                estado={transferencia.estado}
                fechaSolicitud={transferencia.fecha_solicitud}
                fechaAprobacion={transferencia.fecha_aprobacion}
                fechaEnvio={transferencia.fecha_envio}
                fechaRecepcion={transferencia.fecha_recepcion}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Transition Dialog */}
      <Dialog
        open={!!transitionDialog}
        onOpenChange={() => setTransitionDialog(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {transitionDialog === "EN_TRANSITO"
                ? "Registrar Envio"
                : transitionDialog === "COMPLETADA"
                  ? "Confirmar Recepcion"
                  : transitionDialog === "APROBADA"
                    ? "Aprobar Transferencia"
                    : "Cancelar Transferencia"}
            </DialogTitle>
          </DialogHeader>

          {(transitionDialog === "EN_TRANSITO" ||
            transitionDialog === "COMPLETADA") && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {transitionDialog === "EN_TRANSITO"
                  ? "Indica la cantidad enviada para cada producto:"
                  : "Indica la cantidad recibida para cada producto:"}
              </p>
              <Table>
                <TableHeader>
                  <TableRow className="border-muted/50">
                    <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Producto
                    </TableHead>
                    <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Solicitada
                    </TableHead>
                    <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground w-32">
                      {transitionDialog === "EN_TRANSITO"
                        ? "Enviada"
                        : "Recibida"}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transferencia.items.map((item) => {
                    const transItem = transitionItems.find(
                      (ti) => ti.id === item.id
                    );
                    return (
                      <TableRow key={item.id} className="border-muted/30">
                        <TableCell>
                          <div>
                            <span className="font-medium">
                              {item.producto_nombre}
                            </span>
                            {item.producto_codigo && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                {item.producto_codigo}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {transitionDialog === "EN_TRANSITO"
                            ? item.cantidad_solicitada
                            : item.cantidad_enviada}
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            min={0}
                            max={
                              transitionDialog === "EN_TRANSITO"
                                ? item.cantidad_solicitada
                                : item.cantidad_enviada
                            }
                            value={
                              transitionDialog === "EN_TRANSITO"
                                ? transItem?.cantidad_enviada ?? 0
                                : transItem?.cantidad_recibida ?? 0
                            }
                            onChange={(e) =>
                              updateTransitionItem(
                                item.id,
                                transitionDialog === "EN_TRANSITO"
                                  ? "cantidad_enviada"
                                  : "cantidad_recibida",
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-24 ml-auto text-right tabular-nums"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {transitionDialog === "APROBADA" && (
            <p className="text-sm text-muted-foreground">
              Se aprobara la transferencia y podra ser enviada.
            </p>
          )}

          {transitionDialog === "CANCELADA" && (
            <p className="text-sm text-destructive">
              Esta accion cancelara la transferencia. No se puede deshacer.
            </p>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTransitionDialog(null)}
            >
              Cancelar
            </Button>
            <Button
              onClick={executeTransition}
              disabled={transitionMutation.isPending}
              className={
                transitionDialog
                  ? TRANSITION_BUTTON_STYLES[transitionDialog]
                  : ""
              }
            >
              {transitionMutation.isPending
                ? "Procesando..."
                : transitionDialog === "EN_TRANSITO"
                  ? "Confirmar Envio"
                  : transitionDialog === "COMPLETADA"
                    ? "Confirmar Recepcion"
                    : transitionDialog === "APROBADA"
                      ? "Aprobar"
                      : "Cancelar Transferencia"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TransferStatusTimeline({
  estado,
  fechaSolicitud,
  fechaAprobacion,
  fechaEnvio,
  fechaRecepcion,
}: {
  estado: string;
  fechaSolicitud: string;
  fechaAprobacion?: string;
  fechaEnvio?: string;
  fechaRecepcion?: string;
}) {
  const isCancelled = estado === "CANCELADA";

  const steps = [
    {
      key: "PENDIENTE",
      label: "Solicitud",
      icon: Clock,
      date: fechaSolicitud,
    },
    {
      key: "APROBADA",
      label: "Aprobacion",
      icon: Check,
      date: fechaAprobacion,
    },
    {
      key: "EN_TRANSITO",
      label: "En Transito",
      icon: Truck,
      date: fechaEnvio,
    },
    {
      key: "COMPLETADA",
      label: "Completada",
      icon: CheckCircle2,
      date: fechaRecepcion,
    },
  ];

  const currentIndex = STATUS_ORDER.indexOf(estado);

  return (
    <div className="space-y-0">
      {steps.map((step, index) => {
        const isCompleted = !isCancelled && currentIndex >= index;
        const isCurrent = !isCancelled && currentIndex === index;
        const Icon = step.icon;

        return (
          <div key={step.key} className="flex gap-3">
            {/* Line + dot */}
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  isCompleted
                    ? isCurrent
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-0.5 flex-1 min-h-[32px] ${
                    isCompleted && currentIndex > index
                      ? "bg-primary/30"
                      : "bg-muted"
                  }`}
                />
              )}
            </div>
            {/* Content */}
            <div className="pb-6">
              <p
                className={`text-sm font-medium ${
                  isCompleted ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </p>
              {step.date && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(step.date).toLocaleDateString("es-AR", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>
          </div>
        );
      })}

      {isCancelled && (
        <div className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400">
              <XCircle className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-red-600 dark:text-red-400">
              Cancelada
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

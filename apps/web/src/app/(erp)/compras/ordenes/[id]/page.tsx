"use client";

import { use, useState, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useOrdenCompra,
  useApproveOrdenCompra,
  useCancelOrdenCompra,
  useReceiveOrdenCompra,
} from "@/hooks/queries/use-purchases";
import { useUserStore } from "@/store/user-store";
import { hasPermission } from "@/lib/permissions";
import { ESTADO_ORDEN_COMPRA_LABELS } from "@pronto/shared/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Pencil,
  CheckCircle,
  Ban,
  PackageCheck,
} from "lucide-react";
import gsap from "gsap";

const ESTADO_COLORS: Record<string, string> = {
  BORRADOR: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  APROBADA: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
  EN_RECEPCION: "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400",
  RECIBIDA: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  RECIBIDA_PARCIALMENTE: "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400",
  CANCELADA: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
};

const CONDICION_PAGO_LABELS: Record<string, string> = {
  CONTADO: "Contado",
  CUENTA_CORRIENTE: "Cuenta Corriente",
  CHEQUE: "Cheque",
  TRANSFERENCIA: "Transferencia",
  OTRO: "Otro",
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(n);
}

export default function OrdenCompraDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const permissions = user?.permissions ?? [];
  const canCreate = hasPermission(permissions, "purchases:create");
  const canCancel = hasPermission(permissions, "purchases:cancel");

  const { data: orden, isLoading } = useOrdenCompra(id);
  const approveMutation = useApproveOrdenCompra();
  const cancelMutation = useCancelOrdenCompra();
  const receiveMutation = useReceiveOrdenCompra();

  const [showReceiveSection, setShowReceiveSection] = useState(false);
  const [receiveQuantities, setReceiveQuantities] = useState<
    Record<string, number>
  >({});

  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (isLoading || !orden || !containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".detail-header",
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" },
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
        },
      );
    }, containerRef);
    return () => ctx.revert();
  }, [isLoading, orden]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Cargando orden de compra...</p>
      </div>
    );
  }

  if (!orden) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Orden de compra no encontrada</p>
      </div>
    );
  }

  const canApprove = orden.estado === "BORRADOR" && canCreate;
  const canCancelOrder =
    ["BORRADOR", "APROBADA", "EN_RECEPCION"].includes(orden.estado) &&
    canCancel;
  const canReceive =
    ["APROBADA", "EN_RECEPCION", "RECIBIDA_PARCIALMENTE"].includes(
      orden.estado,
    ) && canCreate;
  const isEditable = orden.estado === "BORRADOR" && canCreate;

  const handleOpenReceive = () => {
    const initialQuantities: Record<string, number> = {};
    for (const item of orden.items) {
      const pending = item.cantidad - (item.cantidad_recibida || 0);
      if (pending > 0) {
        initialQuantities[item.id] = pending;
      }
    }
    setReceiveQuantities(initialQuantities);
    setShowReceiveSection(true);
  };

  const handleConfirmReceive = () => {
    const items = Object.entries(receiveQuantities)
      .filter(([, qty]) => qty > 0)
      .map(([detalle_id, cantidad_recibida]) => ({
        detalle_id,
        cantidad_recibida,
      }));

    if (items.length === 0) return;

    receiveMutation.mutate(
      { id, data: { items } },
      {
        onSuccess: () => {
          setShowReceiveSection(false);
          setReceiveQuantities({});
        },
      },
    );
  };

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="detail-header space-y-4">
        <Link
          href="/compras/ordenes"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Ordenes de Compra
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {orden.numero}
              </h1>
              <Badge
                variant="secondary"
                className={`border-0 text-xs font-medium ${ESTADO_COLORS[orden.estado] || ""}`}
              >
                {ESTADO_ORDEN_COMPRA_LABELS[orden.estado] || orden.estado}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              {new Date(orden.fecha_orden + "T00:00:00").toLocaleDateString(
                "es-AR",
                {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                },
              )}
            </p>
          </div>
          <div className="flex gap-2">
            {isEditable && (
              <Button variant="outline" asChild>
                <Link href={`/compras/ordenes/${id}/editar`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </Button>
            )}
            {canApprove && (
              <Button
                onClick={() => approveMutation.mutate({ id })}
                disabled={approveMutation.isPending}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Aprobar
              </Button>
            )}
            {canReceive && (
              <Button
                variant="outline"
                onClick={handleOpenReceive}
                disabled={showReceiveSection}
              >
                <PackageCheck className="mr-2 h-4 w-4" />
                Registrar Recepcion
              </Button>
            )}
            {canCancelOrder && (
              <Button
                variant="destructive"
                onClick={() => cancelMutation.mutate({ id })}
                disabled={cancelMutation.isPending}
              >
                <Ban className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
            )}
          </div>
        </div>
      </div>

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
                    Proveedor
                  </span>
                  <p className="font-medium mt-1">{orden.proveedor_nombre}</p>
                  {orden.proveedor_cuit && (
                    <Badge variant="outline" className="mt-1.5 text-xs">
                      {orden.proveedor_cuit}
                    </Badge>
                  )}
                </div>
                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Sucursal
                  </span>
                  <p className="font-medium mt-1">{orden.sucursal_nombre}</p>
                </div>
                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Condicion de pago
                  </span>
                  <p className="font-medium mt-1">
                    {CONDICION_PAGO_LABELS[orden.condicion_pago] ||
                      orden.condicion_pago}
                  </p>
                </div>
                {orden.fecha_entrega_estimada && (
                  <div>
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Entrega estimada
                    </span>
                    <p className="font-medium mt-1">
                      {new Date(
                        orden.fecha_entrega_estimada + "T00:00:00",
                      ).toLocaleDateString("es-AR")}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Products card */}
          <Card className="detail-card border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Productos ({orden.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-muted/50">
                    <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Producto
                    </TableHead>
                    <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Cantidad
                    </TableHead>
                    <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Precio
                    </TableHead>
                    <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Dto%
                    </TableHead>
                    <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Subtotal
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orden.items.map((item) => {
                    const cantidadRecibida = item.cantidad_recibida || 0;
                    const progressPercent =
                      item.cantidad > 0
                        ? Math.round((cantidadRecibida / item.cantidad) * 100)
                        : 0;

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
                          {item.producto_unidad && (
                            <span className="text-xs text-muted-foreground">
                              {item.producto_unidad}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span className="tabular-nums">
                              {cantidadRecibida > 0
                                ? `${cantidadRecibida} / ${item.cantidad}`
                                : item.cantidad}
                            </span>
                            {cantidadRecibida > 0 && (
                              <div className="flex items-center gap-2 w-full max-w-[100px]">
                                <div className="h-1.5 w-full rounded-full bg-muted">
                                  <div
                                    className={`h-1.5 rounded-full transition-all ${
                                      progressPercent >= 100
                                        ? "bg-emerald-500"
                                        : "bg-blue-500"
                                    }`}
                                    style={{
                                      width: `${Math.min(progressPercent, 100)}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground tabular-nums">
                                  {progressPercent}%
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(item.precio_unitario)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {item.descuento_porcentaje > 0
                            ? `${item.descuento_porcentaje}%`
                            : "\u2014"}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatCurrency(item.subtotal)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Receive section */}
          {showReceiveSection && (
            <Card className="detail-card border-2 border-blue-200 dark:border-blue-900 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <PackageCheck className="h-5 w-5 text-blue-600" />
                  Registrar Recepcion
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Ingresa la cantidad recibida para cada producto. Solo se
                  muestran items con cantidades pendientes.
                </p>
                <div className="space-y-3">
                  {orden.items
                    .filter(
                      (item) =>
                        item.cantidad - (item.cantidad_recibida || 0) > 0,
                    )
                    .map((item) => {
                      const pending =
                        item.cantidad - (item.cantidad_recibida || 0);
                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 rounded-lg border border-border/50 p-3"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {item.producto_nombre}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Pendiente: {pending} de {item.cantidad}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground whitespace-nowrap">
                              Recibido:
                            </Label>
                            <Input
                              type="number"
                              min={0}
                              max={pending}
                              step={1}
                              className="h-8 w-20 text-right text-sm"
                              value={receiveQuantities[item.id] ?? 0}
                              onChange={(e) =>
                                setReceiveQuantities((prev) => ({
                                  ...prev,
                                  [item.id]: Math.min(
                                    Number(e.target.value) || 0,
                                    pending,
                                  ),
                                }))
                              }
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowReceiveSection(false);
                      setReceiveQuantities({});
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleConfirmReceive}
                    disabled={
                      receiveMutation.isPending ||
                      Object.values(receiveQuantities).every((v) => v === 0)
                    }
                  >
                    {receiveMutation.isPending
                      ? "Confirmando..."
                      : "Confirmar Recepcion"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes card */}
          {orden.observaciones && (
            <Card className="detail-card border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Observaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{orden.observaciones}</p>
              </CardContent>
            </Card>
          )}

          {/* Timeline card */}
          {orden.historial && orden.historial.length > 0 && (
            <Card className="detail-card border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Historial
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-0">
                  {orden.historial.map((h, idx) => (
                    <div key={h.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="h-2.5 w-2.5 rounded-full bg-primary mt-1.5" />
                        {idx < orden.historial.length - 1 && (
                          <div className="w-px flex-1 bg-border" />
                        )}
                      </div>
                      <div className="pb-6">
                        <p className="text-sm font-medium">
                          {ESTADO_ORDEN_COMPRA_LABELS[h.estado_nuevo] ||
                            h.estado_nuevo}
                        </p>
                        {h.comentario && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {h.comentario}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(h.created_at).toLocaleDateString("es-AR", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Summary sidebar */}
        <div className="detail-card space-y-4">
          <Card className="border-0 shadow-sm sticky top-6">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">
                  {formatCurrency(orden.subtotal)}
                </span>
              </div>
              {orden.descuento_monto > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Descuento ({orden.descuento_porcentaje}%)
                  </span>
                  <span className="tabular-nums text-red-600">
                    -{formatCurrency(orden.descuento_monto)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base imponible</span>
                <span className="tabular-nums">
                  {formatCurrency(orden.base_imponible)}
                </span>
              </div>
              {orden.impuestos && orden.impuestos.length > 0 && (
                <>
                  <Separator />
                  {orden.impuestos.map((imp, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="text-muted-foreground">
                        {imp.nombre} ({imp.porcentaje}%)
                      </span>
                      <span className="tabular-nums">
                        {formatCurrency(imp.monto)}
                      </span>
                    </div>
                  ))}
                </>
              )}
              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span className="tabular-nums">
                  {formatCurrency(orden.total)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

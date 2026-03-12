"use client";

import { use, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { useFactura, useEmitFactura, useVoidFactura, useAuthorizeAfip } from "@/hooks/queries/use-invoices";
import { useUserStore } from "@/store/user-store";
import { hasPermission } from "@/lib/permissions";
import {
  ESTADO_COMPROBANTE_LABELS,
  TIPO_COMPROBANTE_LABELS,
} from "@nexora/shared/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Send, Ban, ShieldCheck } from "lucide-react";
import gsap from "gsap";

const condicionPagoLabels: Record<string, string> = {
  CONTADO: "Contado",
  CUENTA_CORRIENTE: "Cuenta Corriente",
  CHEQUE: "Cheque",
  TRANSFERENCIA: "Transferencia",
  OTRO: "Otro",
};

const ESTADO_COLORS: Record<string, string> = {
  BORRADOR: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  EMITIDO: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  ANULADO: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
};

const AFIP_ESTADO_COLORS: Record<string, string> = {
  PENDIENTE: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  AUTORIZADO: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  RECHAZADO: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
};

const AFIP_ESTADO_LABELS: Record<string, string> = {
  NO_APLICA: "No aplica",
  PENDIENTE: "Pendiente",
  AUTORIZADO: "Autorizado",
  RECHAZADO: "Rechazado",
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(n);
}

export default function FacturaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const user = useUserStore((s) => s.user);
  const permissions = user?.permissions ?? [];
  const canCreate = hasPermission(permissions, "invoices:create");
  const canCancel = hasPermission(permissions, "invoices:cancel");

  const { data: factura, isLoading } = useFactura(id);
  const emitMutation = useEmitFactura();
  const voidMutation = useVoidFactura();
  const afipMutation = useAuthorizeAfip();
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (isLoading || !factura || !containerRef.current) return;
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
  }, [isLoading, factura]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Cargando factura...</p>
      </div>
    );
  }

  if (!factura) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Factura no encontrada</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="detail-header space-y-4">
        <Link
          href="/ventas/facturas"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Facturas
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {TIPO_COMPROBANTE_LABELS[factura.tipo] || factura.tipo} {factura.letra} {factura.numero}
              </h1>
              <Badge
                variant="secondary"
                className={`border-0 text-xs font-medium ${ESTADO_COLORS[factura.estado] || ""}`}
              >
                {ESTADO_COMPROBANTE_LABELS[factura.estado] || factura.estado}
              </Badge>
              {factura.afip_estado && factura.afip_estado !== "NO_APLICA" && (
                <Badge
                  variant="secondary"
                  className={`border-0 text-xs font-medium ${AFIP_ESTADO_COLORS[factura.afip_estado] || ""}`}
                >
                  AFIP: {AFIP_ESTADO_LABELS[factura.afip_estado] || factura.afip_estado}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1">
              {new Date(factura.fecha_emision + "T00:00:00").toLocaleDateString("es-AR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="flex gap-2">
            {factura.estado === "BORRADOR" && canCreate && (
              <Button onClick={() => emitMutation.mutate(id)} disabled={emitMutation.isPending}>
                <Send className="mr-2 h-4 w-4" />
                Emitir
              </Button>
            )}
            {factura.estado === "EMITIDO" && canCreate && factura.afip_estado && (factura.afip_estado === "PENDIENTE" || factura.afip_estado === "RECHAZADO") && (
              <Button variant="outline" onClick={() => afipMutation.mutate(id)} disabled={afipMutation.isPending}>
                <ShieldCheck className="mr-2 h-4 w-4" />
                {afipMutation.isPending ? "Autorizando..." : "Autorizar en AFIP"}
              </Button>
            )}
            {factura.estado === "EMITIDO" && canCancel && (
              <Button variant="destructive" onClick={() => voidMutation.mutate(id)} disabled={voidMutation.isPending}>
                <Ban className="mr-2 h-4 w-4" />
                Anular
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
                    Cliente
                  </span>
                  <p className="font-medium mt-1">{factura.cliente_nombre}</p>
                </div>
                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Sucursal
                  </span>
                  <p className="font-medium mt-1">{factura.sucursal_nombre}</p>
                </div>
                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Condicion de pago
                  </span>
                  <p className="font-medium mt-1">
                    {condicionPagoLabels[factura.condicion_pago] || factura.condicion_pago}
                  </p>
                </div>
                {factura.pedido_id && (
                  <div>
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Pedido vinculado
                    </span>
                    <p className="mt-1">
                      <Link
                        href={`/ventas/pedidos/${factura.pedido_id}`}
                        className="text-sm font-medium text-[var(--accent)] hover:underline"
                      >
                        Ver pedido
                      </Link>
                    </p>
                  </div>
                )}
                {factura.cae && (
                  <div>
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      CAE
                    </span>
                    <p className="font-medium mt-1 font-mono">{factura.cae}</p>
                    {factura.fecha_vencimiento_cae && (
                      <span className="text-xs text-muted-foreground">
                        Vence: {new Date(factura.fecha_vencimiento_cae + "T00:00:00").toLocaleDateString("es-AR")}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Items card */}
          <Card className="detail-card border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Items ({factura.items.length})
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
                      Cant.
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
                  {factura.items.map((item) => (
                    <TableRow key={item.id} className="border-muted/30">
                      <TableCell>
                        <div>
                          <span className="font-medium">{item.producto_nombre}</span>
                          {item.producto_codigo && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              {item.producto_codigo}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {item.producto_unidad}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {item.cantidad}
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
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Notes card */}
          {factura.observaciones && (
            <Card className="detail-card border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Observaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{factura.observaciones}</p>
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
                <span className="tabular-nums">{formatCurrency(factura.subtotal)}</span>
              </div>
              {factura.descuento_monto > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Descuento</span>
                  <span className="tabular-nums text-red-600">
                    -{formatCurrency(factura.descuento_monto)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base imponible</span>
                <span className="tabular-nums">{formatCurrency(factura.base_imponible)}</span>
              </div>
              {factura.impuestos && factura.impuestos.length > 0 && (
                <>
                  <Separator />
                  {factura.impuestos.map((imp, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="text-muted-foreground">
                        {imp.nombre} ({imp.porcentaje}%)
                      </span>
                      <span className="tabular-nums">{formatCurrency(imp.monto)}</span>
                    </div>
                  ))}
                </>
              )}
              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span className="tabular-nums">{formatCurrency(factura.total)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

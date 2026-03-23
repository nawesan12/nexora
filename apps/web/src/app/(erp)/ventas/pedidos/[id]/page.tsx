"use client";

import { use, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePedido, useUpdatePedido } from "@/hooks/queries/use-orders";
import { useUserStore } from "@/store/user-store";
import { hasPermission } from "@/lib/permissions";
import { ORDER_STATUS_LABELS, type Rol } from "@pronto/shared/constants";
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
import { ArrowLeft, Pencil } from "lucide-react";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderStatusTimeline } from "@/components/orders/order-status-timeline";
import { OrderTransitionActions } from "@/components/orders/order-transition-actions";
import { OrderSummary } from "@/components/orders/order-summary";
import gsap from "gsap";

const condicionPagoLabels: Record<string, string> = {
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

export default function PedidoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const permissions = user?.permissions ?? [];
  const canEdit = hasPermission(permissions, "orders:edit");
  const canTransition = hasPermission(permissions, "orders:approve");
  const role = (user?.rol || "VENDEDOR") as Rol;

  const { data: pedido, isLoading } = usePedido(id);
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (isLoading || !pedido || !containerRef.current) return;
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
  }, [isLoading, pedido]);

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

  const isEditable = pedido.estado === "PENDIENTE_APROBACION" && canEdit;
  const impuestosSummary = pedido.impuestos.map((i) => ({
    nombre: i.nombre,
    porcentaje: i.porcentaje,
    monto: i.monto,
  }));

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="detail-header space-y-4">
        <Link
          href="/ventas/pedidos"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Pedidos
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {pedido.numero}
              </h1>
              <OrderStatusBadge estado={pedido.estado} />
            </div>
            <p className="text-muted-foreground mt-1">
              {new Date(pedido.fecha_pedido).toLocaleDateString("es-AR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          {isEditable && (
            <Button variant="outline" asChild>
              <Link href={`/ventas/pedidos/${id}/editar`}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Transition actions */}
      {canTransition && (
        <Card className="detail-card border-0 shadow-sm">
          <CardContent className="pt-6">
            <OrderTransitionActions
              pedidoId={id}
              currentState={pedido.estado}
              role={role}
            />
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
                    Cliente
                  </span>
                  <p className="font-medium mt-1">
                    {[pedido.cliente_apellido, pedido.cliente_nombre]
                      .filter(Boolean)
                      .join(", ") || pedido.cliente_nombre}
                  </p>
                  {pedido.cliente_cuit && (
                    <Badge variant="outline" className="mt-1.5 text-xs">
                      {pedido.cliente_cuit}
                    </Badge>
                  )}
                </div>
                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Sucursal
                  </span>
                  <p className="font-medium mt-1">{pedido.sucursal_nombre}</p>
                </div>
                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Condicion de pago
                  </span>
                  <p className="font-medium mt-1">
                    {condicionPagoLabels[pedido.condicion_pago] || pedido.condicion_pago}
                  </p>
                </div>
                {pedido.empleado_nombre && (
                  <div>
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Vendedor
                    </span>
                    <p className="font-medium mt-1">{pedido.empleado_nombre}</p>
                  </div>
                )}
                {pedido.fecha_entrega_estimada && (
                  <div>
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Entrega estimada
                    </span>
                    <p className="font-medium mt-1">
                      {new Date(pedido.fecha_entrega_estimada + "T00:00:00").toLocaleDateString("es-AR")}
                    </p>
                  </div>
                )}
                {pedido.fecha_entrega_real && (
                  <div>
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Entrega real
                    </span>
                    <p className="font-medium mt-1">
                      {new Date(pedido.fecha_entrega_real).toLocaleDateString("es-AR")}
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
                Productos ({pedido.items.length})
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
                  {pedido.items.map((item) => (
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
          {(pedido.observaciones || pedido.observaciones_internas) && (
            <Card className="detail-card border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Notas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {pedido.observaciones && (
                  <div>
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Observaciones
                    </span>
                    <p className="mt-1">{pedido.observaciones}</p>
                  </div>
                )}
                {pedido.observaciones_internas && (
                  <div>
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Observaciones internas
                    </span>
                    <p className="mt-1">{pedido.observaciones_internas}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Timeline card */}
          <Card className="detail-card border-0 shadow-sm">
            <CardContent className="pt-6">
              <OrderStatusTimeline historial={pedido.historial} />
            </CardContent>
          </Card>
        </div>

        {/* Summary sidebar */}
        <div className="detail-card">
          <OrderSummary
            subtotal={pedido.subtotal}
            descuentoPorcentaje={pedido.descuento_porcentaje}
            descuentoMonto={pedido.descuento_monto}
            baseImponible={pedido.base_imponible}
            impuestos={impuestosSummary}
            totalImpuestos={pedido.total_impuestos}
            total={pedido.total}
          />
        </div>
      </div>
    </div>
  );
}

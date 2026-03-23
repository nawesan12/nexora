"use client";

import { use, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { usePagoProveedor, useAnularPagoProveedor } from "@/hooks/queries/use-payments";
import type { AplicacionPagoProveedor } from "@pronto/shared/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, FileCheck, Building2, DollarSign, Calendar, XCircle } from "lucide-react";
import gsap from "gsap";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n);
}

const ESTADO_COLORS: Record<string, string> = {
  PENDIENTE: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  CONFIRMADO: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  ANULADO: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
};

export default function PagoProveedorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: pago, isLoading } = usePagoProveedor(id);
  const anularMutation = useAnularPagoProveedor();

  const containerRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (isLoading || !pago || !containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".detail-header", { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" });
      gsap.fromTo(".detail-card", { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, delay: 0.15, ease: "power3.out" });
    }, containerRef);
    return () => ctx.revert();
  }, [isLoading, pago]);

  if (isLoading) return <div className="flex items-center justify-center py-20"><p className="text-muted-foreground">Cargando...</p></div>;
  if (!pago) return <div className="flex items-center justify-center py-20"><p className="text-muted-foreground">Pago no encontrado</p></div>;

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="detail-header space-y-4">
        <Link href="/finanzas/pagos-proveedor" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="h-4 w-4" />Pagos a Proveedores</Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{pago.numero}</h1>
            <Badge variant="secondary" className={`border-0 text-xs font-medium ${ESTADO_COLORS[pago.estado] || ""}`}>{pago.estado}</Badge>
          </div>
          {pago.estado !== "ANULADO" && (
            <Button variant="destructive" size="sm" onClick={() => anularMutation.mutate(id)} disabled={anularMutation.isPending}>
              <XCircle className="mr-2 h-4 w-4" />Anular
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="detail-card border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/50"><Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" /></div>
              <div><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Proveedor</p><p className="font-medium truncate">{pago.proveedor_nombre}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="detail-card border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/50"><DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /></div>
              <div><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Monto</p><p className="text-xl font-bold">{formatCurrency(pago.monto)}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="detail-card border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-950/50"><Calendar className="h-5 w-5 text-teal-600 dark:text-teal-400" /></div>
              <div><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Fecha</p><p className="font-medium">{pago.fecha_pago ? new Date(pago.fecha_pago + "T00:00:00").toLocaleDateString("es-AR") : "-"}</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {pago.observaciones && (
        <Card className="detail-card border-0 shadow-sm">
          <CardContent className="pt-6"><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Observaciones</p><p className="text-sm">{pago.observaciones}</p></CardContent>
        </Card>
      )}

      <Card className="detail-card border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base font-semibold">Aplicaciones ({pago.aplicaciones?.length || 0})</CardTitle></CardHeader>
        <CardContent>
          {(!pago.aplicaciones || pago.aplicaciones.length === 0) ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Sin aplicaciones</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow><TableHead className="text-xs">Orden de Compra</TableHead><TableHead className="text-xs text-right">Total OC</TableHead><TableHead className="text-xs text-right">Monto Aplicado</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {pago.aplicaciones.map((a: AplicacionPagoProveedor) => (
                  <TableRow key={a.id}>
                    <TableCell><Badge variant="outline" className="font-mono text-xs">{a.orden_compra_numero || a.orden_compra_id.substring(0, 8)}</Badge></TableCell>
                    <TableCell className="text-right tabular-nums">{a.orden_compra_total ? formatCurrency(a.orden_compra_total) : "-"}</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">{formatCurrency(a.monto_aplicado)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { use, useRef, useLayoutEffect, useState } from "react";
import Link from "next/link";
import { useRemito, useEmitirRemito, useEntregarRemito, useAnularRemito } from "@/hooks/queries/use-remitos";
import type { DetalleRemito } from "@pronto/shared/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SignatureCapture } from "@/components/signature-pad";
import { ArrowLeft, ScrollText, User, Building2, Truck, FileText, Send, CheckCircle, XCircle } from "lucide-react";
import gsap from "gsap";

const ESTADO_COLORS: Record<string, string> = {
  BORRADOR: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  EMITIDO: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
  ENTREGADO: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  ANULADO: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
};

export default function RemitoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: remito, isLoading } = useRemito(id);
  const emitirMutation = useEmitirRemito();
  const entregarMutation = useEntregarRemito();
  const anularMutation = useAnularRemito();

  const [showSignatureDialog, setShowSignatureDialog] = useState(false);

  const handleSignatureConfirm = (dataUrl: string) => {
    entregarMutation.mutate({ id, firma_url: dataUrl }, {
      onSuccess: () => setShowSignatureDialog(false),
    });
  };

  const containerRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (isLoading || !remito || !containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".detail-header", { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" });
      gsap.fromTo(".detail-card", { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, delay: 0.15, ease: "power3.out" });
    }, containerRef);
    return () => ctx.revert();
  }, [isLoading, remito]);

  if (isLoading) return <div className="flex items-center justify-center py-20"><p className="text-muted-foreground">Cargando remito...</p></div>;
  if (!remito) return <div className="flex items-center justify-center py-20"><p className="text-muted-foreground">Remito no encontrado</p></div>;

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="detail-header space-y-4">
        <Link href="/ventas/remitos" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Remitos
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{remito.numero}</h1>
              <Badge variant="secondary" className={`border-0 text-xs font-medium ${ESTADO_COLORS[remito.estado] || ""}`}>{remito.estado}</Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              {remito.fecha_emision ? new Date(remito.fecha_emision + "T00:00:00").toLocaleDateString("es-AR", { year: "numeric", month: "long", day: "numeric" }) : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {remito.estado === "BORRADOR" && (
              <Button size="sm" onClick={() => emitirMutation.mutate(id)} disabled={emitirMutation.isPending}>
                <Send className="mr-2 h-4 w-4" />Emitir
              </Button>
            )}
            {remito.estado === "EMITIDO" && (
              <>
                <Button size="sm" onClick={() => setShowSignatureDialog(true)} disabled={entregarMutation.isPending}>
                  <CheckCircle className="mr-2 h-4 w-4" />Entregar
                </Button>
                <Button size="sm" variant="destructive" onClick={() => anularMutation.mutate(id)} disabled={anularMutation.isPending}>
                  <XCircle className="mr-2 h-4 w-4" />Anular
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="detail-card border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/50">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Cliente</p>
                <p className="font-medium truncate">{remito.cliente_nombre}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="detail-card border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/50">
                <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pedido</p>
                <p className="font-medium truncate">{remito.pedido_numero || "Sin pedido"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="detail-card border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-950/50">
                <Truck className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Transporte</p>
                <p className="font-medium truncate">{remito.transportista || "Sin asignar"}</p>
                {remito.patente && <Badge variant="outline" className="mt-1 font-mono text-xs">{remito.patente}</Badge>}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="detail-card border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/50">
                <Building2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Sucursal</p>
                <p className="font-medium truncate">{remito.sucursal_nombre}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {remito.observaciones && (
        <Card className="detail-card border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Observaciones</p>
            <p className="text-sm">{remito.observaciones}</p>
          </CardContent>
        </Card>
      )}

      <Card className="detail-card border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Items ({remito.items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {remito.items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Sin items</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-muted/50">
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Producto</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Codigo</TableHead>
                  <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Cantidad</TableHead>
                  <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Entregado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {remito.items.map((item: DetalleRemito) => (
                  <TableRow key={item.id} className="border-muted/30">
                    <TableCell><span className="text-sm font-medium">{item.producto_nombre}</span></TableCell>
                    <TableCell>{item.producto_codigo ? <Badge variant="outline" className="font-mono text-xs">{item.producto_codigo}</Badge> : <span className="text-xs text-muted-foreground/50">-</span>}</TableCell>
                    <TableCell className="text-right tabular-nums">{item.cantidad} {item.producto_unidad}</TableCell>
                    <TableCell className="text-right tabular-nums">{item.cantidad_entregada} {item.producto_unidad}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Signature dialog for delivery confirmation */}
      <Dialog open={showSignatureDialog} onOpenChange={setShowSignatureDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Firma de Conformidad</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            El receptor debe firmar para confirmar la entrega del remito <strong>{remito.numero}</strong>.
          </p>
          <SignatureCapture
            title="Firma del receptor"
            onSave={handleSignatureConfirm}
            width={440}
            height={200}
            className="border shadow-none"
          />
          {entregarMutation.isPending && (
            <p className="text-center text-sm text-muted-foreground">Procesando entrega...</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

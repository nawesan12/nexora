"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { pagoSchema, tipoPagoValues, type PagoInput } from "@pronto/shared/schemas";
import { useCreatePago, useComprobantesConDeuda, useClienteBalance } from "@/hooks/queries/use-payments";
import { useCajas } from "@/hooks/queries/use-finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, CreditCard, Loader2 } from "lucide-react";
import Link from "next/link";
import { useUserStore } from "@/store/user-store";
import type { ComprobanteConDeuda } from "@pronto/shared/types";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n);
}

export default function NuevoCobrosPage() {
  const router = useRouter();
  const createMutation = useCreatePago();
  const user = useUserStore((s) => s.user);
  const sucursales = user?.sucursales || [];
  const { data: cajasData } = useCajas({ page: 1, pageSize: 100 });
  const cajas = cajasData?.data || [];

  const form = useForm<PagoInput>({
    resolver: zodResolver(pagoSchema),
    defaultValues: {
      cliente_id: "",
      sucursal_id: user?.sucursal_actual?.id || "",
      tipo: undefined,
      monto: 0,
      fecha_pago: new Date().toISOString().split("T")[0],
      referencia: "",
      metodo_pago_id: "",
      caja_id: "",
      observaciones: "",
      aplicaciones: [],
    },
  });

  const clienteId = form.watch("cliente_id");
  const { data: comprobantesData } = useComprobantesConDeuda({ clienteId });
  const { data: balanceData } = useClienteBalance(clienteId);
  const comprobantes = comprobantesData?.data || [];
  const balance = balanceData as { saldo_deudor: number; limite_credito: number; credito_disponible: number } | undefined;

  const [aplicaciones, setAplicaciones] = useState<Record<string, number>>({});

  const totalAplicado = Object.values(aplicaciones).reduce((acc, v) => acc + (v || 0), 0);

  const onSubmit = form.handleSubmit((data) => {
    const apps = Object.entries(aplicaciones)
      .filter(([, monto]) => monto > 0)
      .map(([comprobante_id, monto_aplicado]) => ({ comprobante_id, monto_aplicado }));
    if (apps.length === 0) return;
    createMutation.mutate(
      { ...data, aplicaciones: apps },
      { onSuccess: () => router.push("/finanzas/cobros") },
    );
  });

  return (
    <div className="space-y-5">
      <div>
        <Link href="/finanzas/cobros" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground mb-3">
          <ArrowLeft className="h-3.5 w-3.5" />Cobros
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]"><CreditCard className="h-5 w-5" /></div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Nuevo Cobro</h1>
            <p className="text-sm text-muted-foreground">Registrar un pago de cliente</p>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
          <div className="space-y-5">
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <h3 className="text-sm font-semibold text-foreground">Datos del cobro</h3>
                <Separator className="mt-2 mb-4" />
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cliente_id">ID del Cliente</Label>
                    <Input id="cliente_id" {...form.register("cliente_id")} placeholder="UUID del cliente" />
                    {form.formState.errors.cliente_id && <p className="text-sm text-destructive">{form.formState.errors.cliente_id.message}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fecha_pago">Fecha</Label>
                      <Input id="fecha_pago" type="date" {...form.register("fecha_pago")} />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select value={form.watch("tipo") || ""} onValueChange={(v) => form.setValue("tipo", v as any)}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                        <SelectContent>{tipoPagoValues.map((v) => (<SelectItem key={v} value={v}>{v}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="monto">Monto</Label>
                      <Input id="monto" type="number" step="0.01" {...form.register("monto", { valueAsNumber: true })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="referencia">Referencia</Label>
                      <Input id="referencia" {...form.register("referencia")} placeholder="Nro. transferencia, cheque..." />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Caja</Label>
                      <Select value={form.watch("caja_id") || ""} onValueChange={(v) => form.setValue("caja_id", v)}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar caja" /></SelectTrigger>
                        <SelectContent>{cajas.map((c) => (<SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Sucursal</Label>
                      <Select value={form.watch("sucursal_id") || ""} onValueChange={(v) => form.setValue("sucursal_id", v)}>
                        <SelectTrigger><SelectValue placeholder="Sucursal" /></SelectTrigger>
                        <SelectContent>{sucursales.map((s) => (<SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="observaciones">Observaciones</Label>
                    <Textarea id="observaciones" {...form.register("observaciones")} rows={2} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {clienteId && comprobantes.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardHeader><CardTitle className="text-sm font-semibold">Aplicar a comprobantes</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Comprobante</TableHead>
                        <TableHead className="text-xs text-right">Total</TableHead>
                        <TableHead className="text-xs text-right">Pendiente</TableHead>
                        <TableHead className="text-xs text-right w-[120px]">Aplicar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {comprobantes.map((c: ComprobanteConDeuda) => (
                        <TableRow key={c.id}>
                          <TableCell><span className="font-mono text-xs">{c.tipo}-{c.letra} {c.numero}</span></TableCell>
                          <TableCell className="text-right tabular-nums">{formatCurrency(c.total)}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatCurrency(c.saldo_pendiente)}</TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max={c.saldo_pendiente}
                              className="h-8 w-[100px] text-right"
                              value={aplicaciones[c.id] || ""}
                              onChange={(e) => setAplicaciones((prev) => ({ ...prev, [c.id]: Number(e.target.value) || 0 }))}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right sidebar */}
          <div className="space-y-5">
            <Card className="border-0 shadow-sm sticky top-20">
              <CardContent className="pt-6 space-y-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Monto Cobro</p>
                  <p className="text-2xl font-bold">{formatCurrency(form.watch("monto") || 0)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Aplicado</p>
                  <p className="text-lg font-semibold">{formatCurrency(totalAplicado)}</p>
                </div>
                {balance && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Balance Cliente</p>
                      <div className="flex justify-between text-sm"><span>Deuda</span><span className="font-semibold">{formatCurrency(balance.saldo_deudor)}</span></div>
                      <div className="flex justify-between text-sm"><span>Limite</span><span className="font-semibold">{formatCurrency(balance.limite_credito)}</span></div>
                      <div className="flex justify-between text-sm"><span>Disponible</span><span className="font-semibold">{formatCurrency(balance.credito_disponible)}</span></div>
                    </div>
                  </>
                )}
                <Button type="submit" className="w-full" disabled={createMutation.isPending || totalAplicado === 0}>
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Registrar Cobro
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface Props {
  subtotal: number;
  descuentoPorcentaje: number;
  descuentoMonto: number;
  baseImponible: number;
  impuestos: { nombre: string; porcentaje: number; monto: number }[];
  totalImpuestos: number;
  total: number;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(n);
}

export function OrderSummary({
  subtotal,
  descuentoPorcentaje,
  descuentoMonto,
  baseImponible,
  impuestos,
  totalImpuestos,
  total,
}: Props) {
  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-primary to-violet-500" />
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Resumen</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">{formatCurrency(subtotal)}</span>
        </div>
        {descuentoPorcentaje > 0 && (
          <div className="flex justify-between text-destructive">
            <span>Descuento ({descuentoPorcentaje}%)</span>
            <span className="font-medium">-{formatCurrency(descuentoMonto)}</span>
          </div>
        )}
        <div className="flex justify-between font-medium">
          <span>Base imponible</span>
          <span>{formatCurrency(baseImponible)}</span>
        </div>
        <Separator className="opacity-50" />
        {impuestos.map((imp, i) => (
          <div key={i} className="flex justify-between text-muted-foreground">
            <span>
              {imp.nombre} ({imp.porcentaje}%)
            </span>
            <span>{formatCurrency(imp.monto)}</span>
          </div>
        ))}
        {impuestos.length > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total impuestos</span>
            <span className="font-medium">{formatCurrency(totalImpuestos)}</span>
          </div>
        )}
        <Separator className="opacity-50" />
        <div className="flex justify-between items-baseline pt-1">
          <span className="text-base font-semibold">Total</span>
          <span className="text-xl font-bold text-primary">
            {formatCurrency(total)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

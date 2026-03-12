"use client";

import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/lib/reports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Package } from "lucide-react";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n);
}

export function InventoryReport() {
  const { data, isLoading } = useQuery({
    queryKey: ["report-inventory"],
    queryFn: () => reportsApi.inventory(),
  });

  if (isLoading) return <div className="py-10 text-center text-muted-foreground">Cargando reporte...</div>;
  if (!data) return null;

  const totalValue = data.stock_valuation.reduce((acc, i) => acc + i.valor_total, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-0 shadow-sm">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valor total del stock</p>
              <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Productos bajo stock</p>
              <p className="text-2xl font-bold">{data.low_stock.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base">Valuacion de Stock</CardTitle></CardHeader>
        <CardContent>
          {data.stock_valuation.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Sucursal</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.stock_valuation.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div>
                        <span className="font-medium">{item.producto_nombre}</span>
                        {item.producto_codigo && <span className="ml-2 text-xs text-muted-foreground">{item.producto_codigo}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.sucursal_nombre}</TableCell>
                    <TableCell className="text-right tabular-nums">{item.stock}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(item.precio)}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatCurrency(item.valor_total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {data.low_stock.length > 0 && (
        <Card className="border-0 shadow-sm border-l-4 border-l-amber-500">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /> Stock bajo</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.low_stock.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{item.producto_nombre}</span>
                    <span className="text-muted-foreground ml-2">({item.sucursal_nombre})</span>
                  </div>
                  <Badge variant="destructive" className="text-xs">{item.stock} unidades</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

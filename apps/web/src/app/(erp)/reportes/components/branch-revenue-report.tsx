"use client";

import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/lib/reports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n);
}

interface Props {
  desde: string;
  hasta: string;
}

export function BranchRevenueReport({ desde, hasta }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["report-revenue-branch", desde, hasta],
    queryFn: () => reportsApi.revenueByBranch({ desde: desde || undefined, hasta: hasta || undefined }),
  });

  if (isLoading) return <div className="py-10 text-center text-muted-foreground">Cargando reporte...</div>;
  if (!data) return null;

  const branchSummary = data.items.reduce<Record<string, { sucursal_nombre: string; sucursal_tipo: string; ingresos: number; gastos: number; neto: number; pedidos: number }>>((acc, item) => {
    if (!acc[item.sucursal_id]) {
      acc[item.sucursal_id] = {
        sucursal_nombre: item.sucursal_nombre,
        sucursal_tipo: item.sucursal_tipo,
        ingresos: 0,
        gastos: 0,
        neto: 0,
        pedidos: 0,
      };
    }
    acc[item.sucursal_id].ingresos += item.ingresos;
    acc[item.sucursal_id].gastos += item.gastos;
    acc[item.sucursal_id].neto += item.neto;
    acc[item.sucursal_id].pedidos += item.pedidos;
    return acc;
  }, {});

  const chartData = Object.values(branchSummary).map((b) => ({
    name: b.sucursal_nombre,
    ingresos: b.ingresos,
    gastos: b.gastos,
  }));

  const rows = Object.values(branchSummary);

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base">Ingresos vs Gastos por Sucursal</CardTitle></CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="ingresos" fill="#10B981" name="Ingresos" radius={[4, 4, 0, 0]} />
                <Bar dataKey="gastos" fill="#F87171" name="Gastos" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground text-center py-8">Sin datos para el periodo seleccionado</p>}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base">Resumen por Sucursal</CardTitle></CardHeader>
        <CardContent>
          {rows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="py-2 text-left font-medium">Sucursal</th>
                    <th className="py-2 text-left font-medium">Tipo</th>
                    <th className="py-2 text-right font-medium">Ingresos</th>
                    <th className="py-2 text-right font-medium">Gastos</th>
                    <th className="py-2 text-right font-medium">Neto</th>
                    <th className="py-2 text-right font-medium">Pedidos</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 font-medium">{row.sucursal_nombre}</td>
                      <td className="py-2">
                        <Badge variant={row.sucursal_tipo === "TIENDA" ? "default" : "secondary"} className={row.sucursal_tipo === "TIENDA" ? "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20" : "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20"}>
                          {row.sucursal_tipo}
                        </Badge>
                      </td>
                      <td className="py-2 text-right tabular-nums">{formatCurrency(row.ingresos)}</td>
                      <td className="py-2 text-right tabular-nums">{formatCurrency(row.gastos)}</td>
                      <td className={`py-2 text-right tabular-nums font-medium ${row.neto >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {formatCurrency(row.neto)}
                      </td>
                      <td className="py-2 text-right tabular-nums">{row.pedidos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>}
        </CardContent>
      </Card>
    </div>
  );
}

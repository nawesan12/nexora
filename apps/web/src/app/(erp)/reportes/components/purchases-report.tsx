"use client";

import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/lib/reports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n);
}

interface Props { desde: string; hasta: string; }

export function PurchasesReport({ desde, hasta }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["report-purchases", desde, hasta],
    queryFn: () => reportsApi.purchases({ desde: desde || undefined, hasta: hasta || undefined }),
  });

  if (isLoading) return <div className="py-10 text-center text-muted-foreground">Cargando reporte...</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base">Compras por periodo</CardTitle></CardHeader>
        <CardContent>
          {data.by_period.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.by_period}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="total" fill="#D97706" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base">Top Proveedores</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.by_supplier.length === 0 && <p className="text-sm text-muted-foreground">Sin datos</p>}
            {data.by_supplier.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="truncate mr-2">{item.label}</span>
                <span className="font-medium tabular-nums shrink-0">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

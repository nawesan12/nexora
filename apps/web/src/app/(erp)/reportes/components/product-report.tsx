"use client";

import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/lib/reports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n);
}

interface Props { desde: string; hasta: string; }

export function ProductReport({ desde, hasta }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["report-products", desde, hasta],
    queryFn: () => reportsApi.products({ desde: desde || undefined, hasta: hasta || undefined }),
  });

  if (isLoading) return <div className="py-10 text-center text-muted-foreground">Cargando reporte...</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base">Top 10 Productos por Facturacion</CardTitle></CardHeader>
        <CardContent>
          {data.top_sellers.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data.top_sellers} layout="vertical" margin={{ left: 120 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-xs" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="label" className="text-xs" width={120} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="value" fill="var(--accent)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>}
        </CardContent>
      </Card>

      {data.top_sellers.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Detalle</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.top_sellers.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">{i + 1}</span>
                    <span>{item.label}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">{item.count} vendidos</span>
                    <span className="font-medium tabular-nums">{formatCurrency(item.value)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

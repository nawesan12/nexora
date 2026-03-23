"use client";

import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/lib/reports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n);
}

const COLORS = ["#D97706", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#F59E0B", "#EC4899"];

interface Props { desde: string; hasta: string; }

export function FinanceReport({ desde, hasta }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["report-finance", desde, hasta],
    queryFn: () => reportsApi.finance({ desde: desde || undefined, hasta: hasta || undefined }),
  });

  if (isLoading) return <div className="py-10 text-center text-muted-foreground">Cargando reporte...</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base">Ingresos vs Gastos</CardTitle></CardHeader>
        <CardContent>
          {data.income_vs_expenses.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.income_vs_expenses}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Area type="monotone" dataKey="ingresos" fill="#10B981" fillOpacity={0.2} stroke="#10B981" name="Ingresos" />
                <Area type="monotone" dataKey="gastos" fill="#EF4444" fillOpacity={0.2} stroke="#EF4444" name="Gastos" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base">Desglose de Gastos</CardTitle></CardHeader>
        <CardContent>
          {data.expense_breakdown.length > 0 ? (
            <div className="flex flex-col items-center gap-6 lg:flex-row">
              <ResponsiveContainer width={250} height={250}>
                <PieChart>
                  <Pie data={data.expense_breakdown} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={100} innerRadius={60}>
                    {data.expense_breakdown.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-3">
                {data.expense_breakdown.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="flex-1">{item.label}</span>
                    <span className="font-medium tabular-nums">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>}
        </CardContent>
      </Card>
    </div>
  );
}

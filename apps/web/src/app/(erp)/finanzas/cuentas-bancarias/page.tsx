"use client";

import { useRef, useLayoutEffect } from "react";
import { useBankDashboard } from "@/hooks/queries/use-bank-accounts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Landmark, Wallet, DollarSign, Building2 } from "lucide-react";
import gsap from "gsap";
import type { LucideIcon } from "lucide-react";

function formatCurrency(n: number): string {
  return `$${n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface KpiDef {
  title: string;
  value: string;
  icon: LucideIcon;
  color: string;
}

function KpiSkeleton() {
  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <div className="h-1 bg-muted" />
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-9 rounded-lg" />
      </CardHeader>
      <CardContent className="pb-4">
        <Skeleton className="h-8 w-24" />
      </CardContent>
    </Card>
  );
}

export default function CuentasBancariasPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useBankDashboard();

  useLayoutEffect(() => {
    if (!pageRef.current || isLoading) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".bank-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      );
      gsap.fromTo(
        ".bank-kpi-card",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: "power2.out", delay: 0.2 },
      );
      gsap.fromTo(
        ".bank-table-card",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.4 },
      );
    }, pageRef);

    return () => ctx.revert();
  }, [isLoading, data]);

  const kpis: KpiDef[] = data
    ? [
        {
          title: "Saldo Total",
          value: formatCurrency(data.total_balance),
          icon: DollarSign,
          color: "#D97706",
        },
        {
          title: "Total Efectivo",
          value: formatCurrency(data.total_cash),
          icon: Wallet,
          color: "#10B981",
        },
        {
          title: "Total Banco",
          value: formatCurrency(data.total_bank),
          icon: Landmark,
          color: "#3B82F6",
        },
      ]
    : [];

  return (
    <div ref={pageRef} className="space-y-8">
      {/* Header */}
      <div className="bank-header">
        <h1 className="text-3xl font-bold tracking-tight">Cuentas Bancarias</h1>
        <p className="text-muted-foreground mt-1">
          Panorama de cuentas bancarias y saldos
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <KpiSkeleton key={i} />)
          : kpis.map((kpi) => (
              <Card
                key={kpi.title}
                className="bank-kpi-card border-0 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
              >
                <div className="h-1" style={{ backgroundColor: kpi.color }} />
                <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {kpi.title}
                  </CardTitle>
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${kpi.color}15` }}
                  >
                    <kpi.icon className="h-4 w-4" style={{ color: kpi.color }} />
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="text-3xl font-bold tracking-tight">{kpi.value}</div>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Accounts Table */}
      <Card className="bank-table-card border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base font-semibold">
                Entidades Bancarias
              </CardTitle>
              <CardDescription>
                Cuentas asociadas con sus saldos actuales
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          ) : !data || data.accounts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Landmark className="mx-auto h-12 w-12 mb-4 opacity-30" />
              <p className="text-lg font-medium">Sin cuentas bancarias</p>
              <p className="text-sm mt-1">
                Las cuentas aparecerán aquí al crear entidades bancarias.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entidad</TableHead>
                    <TableHead>N. Cuenta</TableHead>
                    <TableHead>CBU</TableHead>
                    <TableHead>Alias</TableHead>
                    <TableHead>Sucursal</TableHead>
                    <TableHead>Caja Asociada</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.accounts.map((account) => (
                    <TableRow key={account.entidad_bancaria_id}>
                      <TableCell className="font-medium">
                        {account.entidad_nombre}
                        {account.sucursal_banco && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({account.sucursal_banco})
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {account.numero_cuenta || "-"}
                        </code>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {account.cbu || "-"}
                        </code>
                      </TableCell>
                      <TableCell>{account.alias || "-"}</TableCell>
                      <TableCell>
                        {account.sucursal_nombre ? (
                          <Badge variant="secondary" className="text-xs">
                            {account.sucursal_nombre}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{account.caja_nombre || "-"}</TableCell>
                      <TableCell className="text-right">
                        <span
                          className="font-semibold"
                          style={{
                            color:
                              account.saldo > 0
                                ? "#10B981"
                                : account.saldo < 0
                                  ? "#EF4444"
                                  : undefined,
                          }}
                        >
                          {formatCurrency(account.saldo)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

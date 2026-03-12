"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { comisionesApi } from "@/lib/finance";
import type { ConfiguracionComision, ComisionVendedor } from "@nexora/shared/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Percent,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { EmptyCommissions } from "@/components/illustrations";

interface EmployeeCommissionsTabProps {
  empleadoId: string;
}

const TIPO_COMISION_LABELS: Record<string, string> = {
  PORCENTAJE: "Porcentaje",
  FIJO: "Fijo",
  ESCALONADO: "Escalonado",
};

export function EmployeeCommissionsTab({
  empleadoId,
}: EmployeeCommissionsTabProps) {
  const [page, setPage] = useState(1);

  const { data: configData, isLoading: configLoading } = useQuery({
    queryKey: ["comisiones-config", empleadoId],
    queryFn: () => comisionesApi.listConfig({ page: 1, pageSize: 100 }),
  });

  const { data: comisionesData, isLoading: comisionesLoading } = useQuery({
    queryKey: ["comisiones", empleadoId, page],
    queryFn: () =>
      comisionesApi.listComisiones({ empleadoId, page, pageSize: 10 }),
  });

  // Filter config for this employee
  const configs = (configData?.data || []).filter(
    (c: ConfiguracionComision) => c.empleado_id === empleadoId,
  );
  const comisiones = comisionesData?.data || [];
  const meta = comisionesData?.meta;

  const totalComisiones = comisiones.reduce(
    (sum: number, c: ComisionVendedor) => sum + c.monto,
    0,
  );

  return (
    <div className="space-y-4">
      {/* Commission Config Card */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Percent className="h-4 w-4 text-[var(--accent)]" />
            Configuracion de Comisiones
          </CardTitle>
        </CardHeader>
        <CardContent>
          {configLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : configs.length > 0 ? (
            <div className="space-y-3">
              {configs.map((config: ConfiguracionComision) => (
                <div
                  key={config.id}
                  className="flex items-center justify-between rounded-lg border border-border/50 p-3.5"
                >
                  <div className="space-y-1">
                    <Badge variant="secondary" className="text-xs">
                      {TIPO_COMISION_LABELS[config.tipo_comision] ||
                        config.tipo_comision}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Base: {config.porcentaje_base}%
                    </p>
                  </div>
                  {config.escalonamiento && (
                    <Badge variant="outline" className="text-xs">
                      Escalonado
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              illustration={<EmptyCommissions className="w-full h-full" />}
              title="No tiene configuracion de comisiones."
              size="sm"
            />
          )}
        </CardContent>
      </Card>

      {/* Commission History */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-[var(--accent)]" />
            Historial de Comisiones
          </CardTitle>
          {comisiones.length > 0 && (
            <Badge
              variant="secondary"
              className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
            >
              Total: ${totalComisiones.toLocaleString("es-AR")}
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {comisionesLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : comisiones.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Porcentaje</TableHead>
                    <TableHead>Periodo</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comisiones.map((c: ComisionVendedor) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString("es-AR")}
                      </TableCell>
                      <TableCell className="text-sm">
                        {c.porcentaje}%
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {c.periodo || "-"}
                      </TableCell>
                      <TableCell className="text-right font-medium font-mono text-sm">
                        ${c.monto.toLocaleString("es-AR")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {page} de {meta.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPage((p) => Math.min(meta.totalPages, p + 1))
                    }
                    disabled={page >= meta.totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              illustration={<EmptyCommissions className="w-full h-full" />}
              title="No tiene comisiones registradas."
              size="sm"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

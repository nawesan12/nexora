"use client";

import { use, useState, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import {
  useExtracto,
  useMovCajaParaConciliar,
  useConciliar,
  useDescartar,
} from "@/hooks/queries/use-reconciliacion";
import type { MovimientoBancario, MovCajaParaConciliar } from "@pronto/shared/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  ArrowLeftRight,
  Check,
  XCircle,
  Loader2,
} from "lucide-react";
import gsap from "gsap";

const ESTADO_COLORS: Record<string, string> = {
  PENDIENTE:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  CONCILIADO:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  DESCARTADO:
    "bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400",
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(n);
}

export default function ExtractoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: extracto, isLoading } = useExtracto(id);
  const conciliarMutation = useConciliar();
  const descartarMutation = useDescartar();

  const [selectedBankMov, setSelectedBankMov] = useState<string | null>(null);
  const [selectedCajaMov, setSelectedCajaMov] = useState<string | null>(null);

  const desde = extracto?.fecha_desde || "";
  const hasta = extracto?.fecha_hasta || "";
  const { data: movsCaja } = useMovCajaParaConciliar(id, desde, hasta);

  const containerRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (isLoading || !extracto || !containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".detail-header",
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" },
      );
      gsap.fromTo(
        ".detail-card",
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, delay: 0.15, ease: "power3.out" },
      );
    }, containerRef);
    return () => ctx.revert();
  }, [isLoading, extracto]);

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Cargando extracto...</p>
      </div>
    );
  if (!extracto)
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Extracto no encontrado</p>
      </div>
    );

  const pendientes =
    extracto.movimientos?.filter(
      (m) => m.estado_conciliacion === "PENDIENTE",
    ) || [];
  const conciliados =
    extracto.movimientos?.filter(
      (m) => m.estado_conciliacion === "CONCILIADO",
    ) || [];

  const handleConciliar = () => {
    if (!selectedBankMov || !selectedCajaMov) return;
    conciliarMutation.mutate(
      { movId: selectedBankMov, data: { movimiento_caja_id: selectedCajaMov } },
      {
        onSuccess: () => {
          setSelectedBankMov(null);
          setSelectedCajaMov(null);
        },
      },
    );
  };

  const handleDescartar = (movId: string) => {
    descartarMutation.mutate(movId);
  };

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="detail-header space-y-4">
        <Link
          href="/finanzas/reconciliacion"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Conciliacion
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {extracto.entidad_nombre || "Extracto"}
              </h1>
            </div>
            <p className="text-muted-foreground mt-1">
              {extracto.fecha_desde
                ? new Date(extracto.fecha_desde + "T00:00:00").toLocaleDateString("es-AR")
                : ""}{" "}
              -{" "}
              {extracto.fecha_hasta
                ? new Date(extracto.fecha_hasta + "T00:00:00").toLocaleDateString("es-AR")
                : ""}
              {extracto.archivo_nombre && (
                <span className="ml-3 text-xs text-muted-foreground/70">
                  ({extracto.archivo_nombre})
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="detail-card grid gap-4 sm:grid-cols-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/50">
                <ArrowLeftRight className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Pendientes
                </p>
                <p className="text-2xl font-bold">{pendientes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/50">
                <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Conciliados
                </p>
                <p className="text-2xl font-bold">{conciliados.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/50">
                <ArrowLeftRight className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Total Movimientos
                </p>
                <p className="text-2xl font-bold">
                  {extracto.movimientos?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conciliar action bar */}
      {selectedBankMov && selectedCajaMov && (
        <div className="detail-card flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30 px-5 py-3">
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
            Seleccionaste un movimiento bancario y uno de caja. Podes
            conciliarlos.
          </span>
          <Button
            size="sm"
            onClick={handleConciliar}
            disabled={conciliarMutation.isPending}
          >
            {conciliarMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            <Check className="mr-2 h-4 w-4" />
            Conciliar
          </Button>
        </div>
      )}

      {/* Two-column matching UI */}
      <div className="detail-card grid gap-4 lg:grid-cols-2">
        {/* Left: Bank movements */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Movimientos Bancarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(!extracto.movimientos || extracto.movimientos.length === 0) ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Sin movimientos importados
              </p>
            ) : (
              <div className="max-h-[500px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-muted/50">
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Fecha
                      </TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Descripcion
                      </TableHead>
                      <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Monto
                      </TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Estado
                      </TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Accion
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {extracto.movimientos.map((mov: MovimientoBancario) => (
                      <TableRow
                        key={mov.id}
                        className={`border-muted/30 cursor-pointer transition-colors ${
                          selectedBankMov === mov.id
                            ? "bg-primary/5 ring-1 ring-primary/20"
                            : mov.estado_conciliacion === "PENDIENTE"
                              ? "hover:bg-muted/30"
                              : "opacity-60"
                        }`}
                        onClick={() => {
                          if (mov.estado_conciliacion === "PENDIENTE") {
                            setSelectedBankMov(
                              selectedBankMov === mov.id ? null : mov.id,
                            );
                          }
                        }}
                      >
                        <TableCell className="text-sm">
                          {mov.fecha
                            ? new Date(
                                mov.fecha + "T00:00:00",
                              ).toLocaleDateString("es-AR")
                            : "-"}
                        </TableCell>
                        <TableCell className="text-sm max-w-[150px] truncate">
                          {mov.descripcion}
                        </TableCell>
                        <TableCell
                          className={`text-right text-sm tabular-nums font-medium ${
                            mov.monto < 0
                              ? "text-red-600 dark:text-red-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {formatCurrency(mov.monto)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`border-0 text-xs font-medium ${ESTADO_COLORS[mov.estado_conciliacion] || ""}`}
                          >
                            {mov.estado_conciliacion}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {mov.estado_conciliacion === "PENDIENTE" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDescartar(mov.id);
                              }}
                              disabled={descartarMutation.isPending}
                            >
                              <XCircle className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Caja movements */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Movimientos de Caja
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!movsCaja || movsCaja.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Sin movimientos de caja en el periodo
              </p>
            ) : (
              <div className="max-h-[500px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-muted/50">
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Caja
                      </TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Concepto
                      </TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Tipo
                      </TableHead>
                      <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Monto
                      </TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Fecha
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movsCaja.map((mc: MovCajaParaConciliar) => (
                      <TableRow
                        key={mc.id}
                        className={`border-muted/30 cursor-pointer transition-colors ${
                          selectedCajaMov === mc.id
                            ? "bg-primary/5 ring-1 ring-primary/20"
                            : "hover:bg-muted/30"
                        }`}
                        onClick={() =>
                          setSelectedCajaMov(
                            selectedCajaMov === mc.id ? null : mc.id,
                          )
                        }
                      >
                        <TableCell className="text-sm font-medium">
                          {mc.caja_nombre}
                        </TableCell>
                        <TableCell className="text-sm max-w-[150px] truncate">
                          {mc.concepto}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`border-0 text-xs font-medium ${
                              mc.tipo === "INGRESO"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                                : mc.tipo === "EGRESO"
                                  ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
                                  : "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
                            }`}
                          >
                            {mc.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={`text-right text-sm tabular-nums font-medium ${
                            mc.tipo === "EGRESO"
                              ? "text-red-600 dark:text-red-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {formatCurrency(mc.monto)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {mc.created_at
                            ? new Date(mc.created_at).toLocaleDateString(
                                "es-AR",
                              )
                            : "-"}
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
    </div>
  );
}

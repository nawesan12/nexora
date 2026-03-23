"use client";

import { useState, useMemo, useRef, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { useClientes } from "@/hooks/queries/use-clients";
import { useClienteBalance, useComprobantesConDeuda, usePagos } from "@/hooks/queries/use-payments";
import { useFacturas } from "@/hooks/queries/use-invoices";
import type { Cliente, ComprobanteConDeuda, Pago, ComprobanteList } from "@pronto/shared/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  CreditCard,
  TrendingDown,
  Check,
  ChevronsUpDown,
  Download,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import gsap from "gsap";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(n);
}

function formatDate(d: string) {
  if (!d) return "-";
  return new Date(d + "T00:00:00").toLocaleDateString("es-AR");
}

const ESTADO_DEUDA_COLORS: Record<string, string> = {
  PAGADO: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  PARCIAL: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  PENDIENTE: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
};

const ESTADO_PAGO_COLORS: Record<string, string> = {
  PENDIENTE: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  CONFIRMADO: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  ANULADO: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
};

const TIPO_PAGO_COLORS: Record<string, string> = {
  EFECTIVO: "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400",
  TRANSFERENCIA: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
  CHEQUE: "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400",
  TARJETA: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  OTRO: "bg-gray-100 text-gray-700 dark:bg-gray-950/50 dark:text-gray-400",
};

interface MovimientoUnificado {
  fecha: string;
  descripcion: string;
  debe: number;
  haber: number;
  saldo: number;
  tipo: "factura" | "pago";
  id: string;
}

export default function EstadoCuentaPage() {
  const router = useRouter();
  const [selectedClienteId, setSelectedClienteId] = useState("");
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [clienteSearch, setClienteSearch] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch clients for selector
  const { data: clientesData } = useClientes({
    page: 1,
    pageSize: 100,
    search: clienteSearch || undefined,
  });
  const clientes = (clientesData?.data || []) as Cliente[];

  const selectedCliente = clientes.find((c) => c.id === selectedClienteId);

  // Fetch balance
  const { data: balance, isLoading: balanceLoading } = useClienteBalance(selectedClienteId);

  // Fetch comprobantes con deuda
  const { data: comprobantesDeudaData, isLoading: comprobantesLoading } = useComprobantesConDeuda({
    clienteId: selectedClienteId,
    pageSize: 200,
  });
  const comprobantesConDeuda = (comprobantesDeudaData?.data || []) as ComprobanteConDeuda[];

  // Fetch all invoices for client
  const { data: facturasData, isLoading: facturasLoading } = useFacturas({
    cliente_id: selectedClienteId || undefined,
    pageSize: 200,
  });
  const facturas = (facturasData?.data || []) as ComprobanteList[];

  // Fetch pagos (search by client name)
  const { data: pagosData, isLoading: pagosLoading } = usePagos({
    search: selectedCliente?.nombre || "",
    pageSize: 200,
  });
  // Filter pagos to only show this client's payments
  const pagos = useMemo(() => {
    if (!selectedClienteId || !pagosData?.data) return [];
    return (pagosData.data as Pago[]).filter((p) => p.cliente_id === selectedClienteId);
  }, [pagosData, selectedClienteId]);

  // Build unified movements
  const movimientos = useMemo<MovimientoUnificado[]>(() => {
    if (!selectedClienteId) return [];

    const items: MovimientoUnificado[] = [];

    // Add invoices as DEBE (debt)
    for (const f of facturas) {
      items.push({
        fecha: f.fecha_emision,
        descripcion: `${f.tipo} ${f.letra}-${f.numero}`,
        debe: f.total,
        haber: 0,
        saldo: 0,
        tipo: "factura",
        id: f.id,
      });
    }

    // Add payments as HABER (credit)
    for (const p of pagos) {
      if (p.estado === "ANULADO") continue;
      items.push({
        fecha: p.fecha_pago,
        descripcion: `Pago #${p.numero}`,
        debe: 0,
        haber: p.monto,
        saldo: 0,
        tipo: "pago",
        id: p.id,
      });
    }

    // Sort chronologically
    items.sort((a, b) => a.fecha.localeCompare(b.fecha));

    // Calculate running balance
    let runningBalance = 0;
    for (const item of items) {
      runningBalance += item.debe - item.haber;
      item.saldo = runningBalance;
    }

    return items;
  }, [facturas, pagos, selectedClienteId]);

  // Determine deuda status for comprobantes
  function getEstadoDeuda(comp: ComprobanteConDeuda) {
    if (comp.saldo_pendiente <= 0) return "PAGADO";
    if (comp.pagado > 0) return "PARCIAL";
    return "PENDIENTE";
  }

  // GSAP animation
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".ec-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      );
      gsap.fromTo(
        ".ec-cards",
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.15 },
      );
      gsap.fromTo(
        ".ec-tabs",
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.25 },
      );
    }, containerRef);
    return () => ctx.revert();
  }, [selectedClienteId]);

  const clienteDisplayName = selectedCliente
    ? `${selectedCliente.nombre}${selectedCliente.cuit ? ` (${selectedCliente.cuit})` : ""}`
    : "";

  return (
    <div ref={containerRef} className="space-y-5">
      {/* Header */}
      <div className="ec-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Estado de Cuenta
          </h1>
          <p className="text-sm text-muted-foreground">
            Resumen de facturas, pagos y saldo de un cliente
          </p>
        </div>
        <Button variant="outline" disabled className="shadow-sm">
          <Download className="mr-2 h-4 w-4" />
          Exportar PDF
        </Button>
      </div>

      {/* Client selector */}
      <div className="ec-header">
        <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={comboboxOpen}
              className="w-full justify-between sm:max-w-md"
            >
              {selectedClienteId ? clienteDisplayName : "Seleccionar cliente..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0 sm:w-[400px]" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Buscar cliente por nombre o CUIT..."
                value={clienteSearch}
                onValueChange={setClienteSearch}
              />
              <CommandList>
                <CommandEmpty>No se encontraron clientes.</CommandEmpty>
                <CommandGroup>
                  {clientes.map((cliente) => (
                    <CommandItem
                      key={cliente.id}
                      value={cliente.id}
                      onSelect={(val) => {
                        setSelectedClienteId(val === selectedClienteId ? "" : val);
                        setComboboxOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedClienteId === cliente.id
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">{cliente.nombre}</span>
                        {cliente.cuit && (
                          <span className="text-xs text-muted-foreground">
                            CUIT: {cliente.cuit}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Balance cards */}
      {selectedClienteId && (
        <div className="ec-cards grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Saldo Deudor
              </CardTitle>
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg",
                  balance && balance.saldo > 0
                    ? "bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400"
                    : "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
                )}
              >
                <DollarSign className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p
                className={cn(
                  "text-2xl font-bold tabular-nums",
                  balance && balance.saldo > 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-emerald-600 dark:text-emerald-400",
                )}
              >
                {balanceLoading ? "..." : formatCurrency(balance?.saldo || 0)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Limite de Credito
              </CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                <Wallet className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums">
                {balanceLoading
                  ? "..."
                  : formatCurrency(balance?.limite_credito || 0)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Credito Disponible
              </CardTitle>
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg",
                  balance && balance.disponible > 0
                    ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                    : "bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
                )}
              >
                <TrendingDown className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p
                className={cn(
                  "text-2xl font-bold tabular-nums",
                  balance && balance.disponible > 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-600 dark:text-amber-400",
                )}
              >
                {balanceLoading
                  ? "..."
                  : formatCurrency(balance?.disponible || 0)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      {selectedClienteId && (
        <div className="ec-tabs">
          <Tabs defaultValue="comprobantes" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="comprobantes" className="gap-1.5">
                <FileText className="h-4 w-4 hidden sm:inline-block" />
                Comprobantes
              </TabsTrigger>
              <TabsTrigger value="pagos" className="gap-1.5">
                <CreditCard className="h-4 w-4 hidden sm:inline-block" />
                Pagos
              </TabsTrigger>
              <TabsTrigger value="movimientos" className="gap-1.5">
                <ArrowUpRight className="h-4 w-4 hidden sm:inline-block" />
                Movimientos
              </TabsTrigger>
            </TabsList>

            {/* Tab: Comprobantes */}
            <TabsContent value="comprobantes">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">
                    Comprobantes del cliente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {comprobantesLoading ? (
                    <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                      Cargando comprobantes...
                    </div>
                  ) : comprobantesConDeuda.length === 0 ? (
                    <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                      No se encontraron comprobantes con deuda para este
                      cliente.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Numero</TableHead>
                            <TableHead>Tipo/Letra</TableHead>
                            <TableHead className="hidden sm:table-cell">
                              Fecha
                            </TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right hidden md:table-cell">
                              Pagado
                            </TableHead>
                            <TableHead className="text-right">
                              Pendiente
                            </TableHead>
                            <TableHead>Estado</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {comprobantesConDeuda.map((comp) => {
                            const estadoDeuda = getEstadoDeuda(comp);
                            return (
                              <TableRow
                                key={comp.id}
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() =>
                                  router.push(
                                    `/ventas/facturas/${comp.id}`,
                                  )
                                }
                              >
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className="font-mono text-xs"
                                  >
                                    {comp.numero}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm">
                                  {comp.tipo} {comp.letra}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                                  {formatDate(comp.fecha_emision)}
                                </TableCell>
                                <TableCell className="text-right font-semibold tabular-nums">
                                  {formatCurrency(comp.total)}
                                </TableCell>
                                <TableCell className="text-right tabular-nums text-muted-foreground hidden md:table-cell">
                                  {formatCurrency(comp.pagado)}
                                </TableCell>
                                <TableCell className="text-right font-semibold tabular-nums">
                                  {formatCurrency(comp.saldo_pendiente)}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="secondary"
                                    className={cn(
                                      "border-0 text-xs font-medium",
                                      ESTADO_DEUDA_COLORS[estadoDeuda] || "",
                                    )}
                                  >
                                    {estadoDeuda}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Pagos */}
            <TabsContent value="pagos">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">
                    Historial de pagos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pagosLoading ? (
                    <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                      Cargando pagos...
                    </div>
                  ) : pagos.length === 0 ? (
                    <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                      No se encontraron pagos para este cliente.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Numero</TableHead>
                            <TableHead className="hidden sm:table-cell">
                              Fecha
                            </TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead className="text-right">Monto</TableHead>
                            <TableHead>Estado</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pagos.map((pago) => (
                            <TableRow
                              key={pago.id}
                              className="cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() =>
                                router.push(`/finanzas/cobros/${pago.id}`)
                              }
                            >
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="font-mono text-xs"
                                >
                                  {pago.numero}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                                {formatDate(pago.fecha_pago)}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="secondary"
                                  className={cn(
                                    "border-0 text-xs font-medium",
                                    TIPO_PAGO_COLORS[pago.tipo] || "",
                                  )}
                                >
                                  {pago.tipo}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-semibold tabular-nums">
                                {formatCurrency(pago.monto)}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="secondary"
                                  className={cn(
                                    "border-0 text-xs font-medium",
                                    ESTADO_PAGO_COLORS[pago.estado] || "",
                                  )}
                                >
                                  {pago.estado}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Movimientos */}
            <TabsContent value="movimientos">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">
                    Movimientos (cronologico)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {facturasLoading || pagosLoading ? (
                    <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                      Cargando movimientos...
                    </div>
                  ) : movimientos.length === 0 ? (
                    <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                      No hay movimientos para este cliente.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Descripcion</TableHead>
                            <TableHead className="text-right">Debe</TableHead>
                            <TableHead className="text-right">Haber</TableHead>
                            <TableHead className="text-right">Saldo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {movimientos.map((mov, idx) => (
                            <TableRow
                              key={`${mov.tipo}-${mov.id}-${idx}`}
                              className="cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() => {
                                if (mov.tipo === "factura") {
                                  router.push(`/ventas/facturas/${mov.id}`);
                                } else {
                                  router.push(`/finanzas/cobros/${mov.id}`);
                                }
                              }}
                            >
                              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                {formatDate(mov.fecha)}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {mov.tipo === "factura" ? (
                                    <ArrowUpRight className="h-3.5 w-3.5 text-red-500 shrink-0" />
                                  ) : (
                                    <ArrowDownRight className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                  )}
                                  <span className="text-sm font-medium">
                                    {mov.descripcion}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right tabular-nums text-sm">
                                {mov.debe > 0 ? (
                                  <span className="text-red-600 dark:text-red-400 font-medium">
                                    {formatCurrency(mov.debe)}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">
                                    -
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-right tabular-nums text-sm">
                                {mov.haber > 0 ? (
                                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                    {formatCurrency(mov.haber)}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">
                                    -
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-right tabular-nums text-sm">
                                <span
                                  className={cn(
                                    "font-semibold",
                                    mov.saldo > 0
                                      ? "text-red-600 dark:text-red-400"
                                      : mov.saldo < 0
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : "text-foreground",
                                  )}
                                >
                                  {formatCurrency(mov.saldo)}
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
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Empty state when no client selected */}
      {!selectedClienteId && (
        <div className="ec-cards flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50 mb-4">
            <FileText className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">
            Selecciona un cliente
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Elige un cliente para ver su estado de cuenta completo.
          </p>
        </div>
      )}
    </div>
  );
}

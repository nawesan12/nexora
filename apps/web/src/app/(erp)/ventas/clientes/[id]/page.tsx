"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  useCliente,
  useUpdateCliente,
  useDirecciones,
  useCreateDireccion,
  useUpdateDireccion,
  useDeleteDireccion,
  useSetDireccionPrincipal,
} from "@/hooks/queries/use-clients";
import { api } from "@/lib/api-client";
import { ClientForm } from "@/components/clients/client-form";
import { AddressDialog } from "@/components/clients/address-dialog";
import type { ClienteInput, DireccionInput } from "@pronto/shared/schemas";
import type { Direccion } from "@pronto/shared/types";
import { useUserStore } from "@/store/user-store";
import { hasPermission } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  MapPin,
  Loader2,
  DollarSign,
  CreditCard,
  FileText,
  ExternalLink,
} from "lucide-react";

const REPUTACION_COLORS: Record<string, string> = {
  EXCELENTE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  BUENA: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
  NORMAL: "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400",
  CRITICA: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  DEUDOR: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
};

const IVA_COLORS: Record<string, string> = {
  RESPONSABLE_INSCRIPTO: "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400",
  MONOTRIBUTO: "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400",
  EXENTO: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  NO_RESPONSABLE: "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400",
  CONSUMIDOR_FINAL: "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400",
};

const reputacionLabels: Record<string, string> = {
  DEUDOR: "Deudor",
  BUENA: "Buena",
  CRITICA: "Critica",
  EXCELENTE: "Excelente",
  NORMAL: "Normal",
};

const condicionIvaLabels: Record<string, string> = {
  RESPONSABLE_INSCRIPTO: "Resp. Inscripto",
  MONOTRIBUTO: "Monotributo",
  EXENTO: "Exento",
  NO_RESPONSABLE: "No Responsable",
  CONSUMIDOR_FINAL: "Cons. Final",
};

// --- Finance types & helpers ---

interface ClienteSaldo {
  saldo_deudor: number;
  limite_credito: number;
}

interface ComprobanteConDeuda {
  id: string;
  numero: string;
  tipo: string;
  fecha: string;
  total: number;
  pagado: number;
  pendiente: number;
  estado: string;
}

interface PagoReciente {
  id: string;
  fecha: string;
  tipo: string;
  monto: number;
  estado: string;
}

const ESTADO_DEUDA_COLORS: Record<string, string> = {
  PENDIENTE: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  PARCIAL: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
  PAGADA: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  VENCIDA: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(value);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function ClienteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const permissions = user?.permissions ?? [];
  const canManage = hasPermission(permissions, "clients:manage");

  const { data: cliente, isLoading } = useCliente(id);
  const updateMutation = useUpdateCliente();
  const { data: direcciones } = useDirecciones(id);
  const createDireccionMutation = useCreateDireccion();
  const updateDireccionMutation = useUpdateDireccion();
  const deleteDireccionMutation = useDeleteDireccion();
  const setPrincipalMutation = useSetDireccionPrincipal();

  // Finance queries (inline, as requested)
  const { data: saldo, isLoading: saldoLoading } = useQuery<ClienteSaldo>({
    queryKey: ["clientes", id, "saldo"],
    queryFn: () => api.get<ClienteSaldo>(`/api/v1/clientes/${id}/saldo`),
    enabled: !!id,
  });

  const { data: comprobantesDeuda, isLoading: deudaLoading } = useQuery<ComprobanteConDeuda[]>({
    queryKey: ["clientes", id, "comprobantes-deuda"],
    queryFn: () =>
      api.get<ComprobanteConDeuda[]>(
        `/api/v1/finanzas/cobros/comprobantes-con-deuda?cliente_id=${id}`,
      ),
    enabled: !!id,
  });

  const { data: pagosRecientes } = useQuery<PagoReciente[]>({
    queryKey: ["clientes", id, "pagos-recientes"],
    queryFn: () =>
      api.get<PagoReciente[]>(
        `/api/v1/finanzas/cobros?cliente_id=${id}&page=1&pageSize=5`,
      ),
    enabled: !!id,
  });

  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Direccion | null>(null);
  const [deleteAddressId, setDeleteAddressId] = useState<string | null>(null);

  const handleUpdateCliente = (data: ClienteInput) => {
    updateMutation.mutate({ id, data });
  };

  const handleCreateAddress = (data: DireccionInput) => {
    createDireccionMutation.mutate(
      { clienteId: id, data },
      { onSuccess: () => setAddressDialogOpen(false) },
    );
  };

  const handleUpdateAddress = (data: DireccionInput) => {
    if (!editingAddress) return;
    updateDireccionMutation.mutate(
      { clienteId: id, direccionId: editingAddress.id, data },
      { onSuccess: () => setEditingAddress(null) },
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-3" />
        <p className="text-sm">Cargando cliente...</p>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-lg font-medium">Cliente no encontrado</p>
        <Link
          href="/ventas/clientes"
          className="mt-2 text-sm text-primary hover:underline"
        >
          Volver a clientes
        </Link>
      </div>
    );
  }

  const displayName =
    [cliente.apellido, cliente.nombre].filter(Boolean).join(", ") || cliente.nombre;

  return (
    <div className="space-y-5">
      {/* Back link */}
      <Link
        href="/ventas/clientes"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a clientes
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{displayName}</h1>
          {cliente.razon_social && (
            <p className="text-muted-foreground">{cliente.razon_social}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className={`text-xs font-medium border-0 ${REPUTACION_COLORS[cliente.reputacion] || ""}`}
          >
            {reputacionLabels[cliente.reputacion] || cliente.reputacion}
          </Badge>
          {cliente.condicion_iva && (
            <Badge
              variant="secondary"
              className={`text-xs font-medium border-0 ${IVA_COLORS[cliente.condicion_iva] || ""}`}
            >
              {condicionIvaLabels[cliente.condicion_iva] || cliente.condicion_iva}
            </Badge>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="datos">
        <TabsList>
          <TabsTrigger value="datos">Datos</TabsTrigger>
          <TabsTrigger value="direcciones">Direcciones</TabsTrigger>
          <TabsTrigger value="finanzas">Finanzas</TabsTrigger>
        </TabsList>

        <TabsContent value="datos" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Datos del cliente</CardTitle>
              <CardDescription>
                Actualiza la informacion del cliente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ClientForm
                defaultValues={{
                  nombre: cliente.nombre,
                  apellido: cliente.apellido || "",
                  razon_social: cliente.razon_social || "",
                  cuit: cliente.cuit || "",
                  condicion_iva: cliente.condicion_iva as ClienteInput["condicion_iva"],
                  email: cliente.email || "",
                  telefono: cliente.telefono || "",
                  reputacion: cliente.reputacion as ClienteInput["reputacion"],
                }}
                onSubmit={handleUpdateCliente}
                isLoading={updateMutation.isPending}
                submitLabel="Actualizar"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="direcciones" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Direcciones</CardTitle>
                  <CardDescription>
                    Gestiona las direcciones del cliente
                  </CardDescription>
                </div>
                {canManage && (
                  <Button onClick={() => setAddressDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Direccion
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!direcciones || direcciones.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-3">
                    <MapPin className="h-7 w-7" />
                  </div>
                  <p className="text-base font-medium">No hay direcciones registradas</p>
                  <p className="text-sm mt-1">Agrega la primera direccion del cliente</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {direcciones.map((d) => {
                    const fullAddress = [
                      d.calle,
                      d.numero,
                      d.piso && `Piso ${d.piso}`,
                      d.departamento && `Dpto ${d.departamento}`,
                    ]
                      .filter(Boolean)
                      .join(" ");
                    const subtitleParts = [d.ciudad, d.provincia, d.codigo_postal && `CP ${d.codigo_postal}`].filter(Boolean);

                    return (
                      <div
                        key={d.id}
                        className="flex items-center gap-4 rounded-lg border border-border/50 p-3 transition-colors hover:bg-muted/30"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{fullAddress}</p>
                          {subtitleParts.length > 0 && (
                            <p className="text-sm text-muted-foreground truncate">
                              {subtitleParts.join(", ")}
                            </p>
                          )}
                        </div>
                        {d.principal && (
                          <Badge className="shrink-0">Principal</Badge>
                        )}
                        {canManage && (
                          <div className="flex items-center gap-1 shrink-0">
                            {!d.principal && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title="Marcar como principal"
                                onClick={() =>
                                  setPrincipalMutation.mutate({
                                    clienteId: id,
                                    direccionId: d.id,
                                  })
                                }
                              >
                                <MapPin className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setEditingAddress(d)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setDeleteAddressId(d.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finanzas" className="mt-4 space-y-5">
          {/* Balance cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4" />
                  Saldo Deudor
                </CardDescription>
              </CardHeader>
              <CardContent>
                {saldoLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <p
                    className={`text-2xl font-bold tracking-tight ${
                      (saldo?.saldo_deudor ?? 0) > 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-foreground"
                    }`}
                  >
                    {formatCurrency(saldo?.saldo_deudor ?? 0)}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription className="flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4" />
                    Limite de Credito
                  </CardDescription>
                  {canManage && (
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {saldoLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <p className="text-2xl font-bold tracking-tight">
                    {formatCurrency(saldo?.limite_credito ?? 0)}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick action */}
          <div className="flex justify-end">
            <Button
              onClick={() =>
                router.push(`/finanzas/cobros/nuevo?cliente_id=${id}`)
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Registrar Cobro
            </Button>
          </div>

          {/* Comprobantes con deuda */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Comprobantes con deuda
              </CardTitle>
              <CardDescription>
                Comprobantes pendientes de pago para este cliente
              </CardDescription>
            </CardHeader>
            <CardContent>
              {deudaLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : !comprobantesDeuda || comprobantesDeuda.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-3">
                    <FileText className="h-7 w-7" />
                  </div>
                  <p className="text-base font-medium">Sin comprobantes con deuda</p>
                  <p className="text-sm mt-1">Este cliente no tiene saldos pendientes</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Numero</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Pagado</TableHead>
                        <TableHead className="text-right">Pendiente</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {comprobantesDeuda.map((comp) => (
                        <TableRow key={comp.id}>
                          <TableCell className="font-medium">
                            {comp.numero}
                          </TableCell>
                          <TableCell>{comp.tipo}</TableCell>
                          <TableCell>{formatDate(comp.fecha)}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(comp.total)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(comp.pagado)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(comp.pendiente)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={`text-xs font-medium border-0 ${
                                ESTADO_DEUDA_COLORS[comp.estado] || ""
                              }`}
                            >
                              {comp.estado}
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

          {/* Recent payments */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Pagos recientes</CardTitle>
                  <CardDescription>
                    Ultimos cobros registrados para este cliente
                  </CardDescription>
                </div>
                <Link
                  href={`/finanzas/cobros?cliente_id=${id}`}
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  Ver todos
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {!pagosRecientes || pagosRecientes.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No hay pagos registrados
                </p>
              ) : (
                <div className="space-y-2">
                  {pagosRecientes.map((pago) => (
                    <div
                      key={pago.id}
                      className="flex items-center justify-between rounded-lg border border-border/50 p-3 transition-colors hover:bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <DollarSign className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{pago.tipo}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(pago.fecha)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold">
                          {formatCurrency(pago.monto)}
                        </span>
                        <Badge
                          variant="secondary"
                          className={`text-xs font-medium border-0 ${
                            ESTADO_DEUDA_COLORS[pago.estado] || ""
                          }`}
                        >
                          {pago.estado}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create address dialog */}
      <AddressDialog
        open={addressDialogOpen}
        onOpenChange={setAddressDialogOpen}
        onSubmit={handleCreateAddress}
        isLoading={createDireccionMutation.isPending}
      />

      {/* Edit address dialog */}
      <AddressDialog
        open={!!editingAddress}
        onOpenChange={() => setEditingAddress(null)}
        defaultValues={
          editingAddress
            ? {
                calle: editingAddress.calle,
                numero: editingAddress.numero || "",
                piso: editingAddress.piso || "",
                departamento: editingAddress.departamento || "",
                ciudad: editingAddress.ciudad || "",
                provincia: editingAddress.provincia || "",
                codigo_postal: editingAddress.codigo_postal || "",
                principal: editingAddress.principal,
              }
            : undefined
        }
        onSubmit={handleUpdateAddress}
        isLoading={updateDireccionMutation.isPending}
        title="Editar Direccion"
      />

      {/* Delete address confirmation */}
      <AlertDialog
        open={!!deleteAddressId}
        onOpenChange={() => setDeleteAddressId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar direccion</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. La direccion sera eliminada
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteAddressId) {
                  deleteDireccionMutation.mutate({
                    clienteId: id,
                    direccionId: deleteAddressId,
                  });
                  setDeleteAddressId(null);
                }
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

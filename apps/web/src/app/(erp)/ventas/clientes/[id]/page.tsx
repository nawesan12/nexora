"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useCliente,
  useUpdateCliente,
  useDirecciones,
  useCreateDireccion,
  useUpdateDireccion,
  useDeleteDireccion,
  useSetDireccionPrincipal,
} from "@/hooks/queries/use-clients";
import { ClientForm } from "@/components/clients/client-form";
import { AddressDialog } from "@/components/clients/address-dialog";
import type { ClienteInput, DireccionInput } from "@nexora/shared/schemas";
import type { Direccion } from "@nexora/shared/types";
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
} from "lucide-react";

const REPUTACION_COLORS: Record<string, string> = {
  EXCELENTE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  BUENA: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
  NORMAL: "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400",
  CRITICA: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  DEUDOR: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
};

const IVA_COLORS: Record<string, string> = {
  RESPONSABLE_INSCRIPTO: "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400",
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

export default function ClienteDetailPage() {
  const { id } = useParams<{ id: string }>();
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

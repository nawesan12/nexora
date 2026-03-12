"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  useEmpleado,
  useUpdateEmpleado,
  useEmpleadoBranches,
  useRegenerateAccessCode,
} from "@/hooks/queries/use-employees";
import { useUserStore } from "@/store/user-store";
import { hasPermission } from "@/lib/permissions";
import {
  ROLE_LABELS,
  ESTADO_EMPLEADO_LABELS,
  TIPO_CONTRATO_LABELS,
  type Rol,
} from "@nexora/shared/constants";
import { EmployeeForm } from "@/components/employees/employee-form";
import { EmployeeCommissionsTab } from "@/components/employees/employee-commissions-tab";
import { BranchAssignmentDialog } from "@/components/employees/branch-assignment-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Building2,
  Loader2,
  Mail,
  Hash,
  Phone,
  MapPin,
  RefreshCw,
  Calendar,
  CreditCard,
  FileText,
  Briefcase,
} from "lucide-react";
import type { EmpleadoInput } from "@nexora/shared/schemas";

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400",
  VENDEDOR: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
  SUPERVISOR: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  FINANZAS: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  REPARTIDOR: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-400",
  JEFE_VENTAS: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400",
  DEPOSITO: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400",
  VENDEDOR_CALLE: "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400",
};

const ROLE_AVATAR_COLORS: Record<string, string> = {
  ADMIN: "bg-violet-500",
  VENDEDOR: "bg-blue-500",
  SUPERVISOR: "bg-amber-500",
  FINANZAS: "bg-emerald-500",
  REPARTIDOR: "bg-cyan-500",
  JEFE_VENTAS: "bg-rose-500",
  DEPOSITO: "bg-indigo-500",
  VENDEDOR_CALLE: "bg-sky-500",
};

const ESTADO_COLORS: Record<string, string> = {
  ACTIVO: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  LICENCIA: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  DESVINCULADO: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
};

function ReadOnlyField({
  label,
  value,
  icon,
  mono,
}: {
  label: string;
  value?: string | number | null;
  icon?: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="flex items-center gap-2">
        {icon}
        <p
          className={`text-sm font-medium text-foreground ${mono ? "font-mono" : ""}`}
        >
          {value || "-"}
        </p>
      </div>
    </div>
  );
}

export default function EmpleadoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useUserStore((s) => s.user);
  const permissions = user?.permissions ?? [];
  const canManage = hasPermission(permissions, "employees:edit");

  const { data: empleado, isLoading } = useEmpleado(id);
  const { data: branches } = useEmpleadoBranches(id);
  const updateMutation = useUpdateEmpleado();
  const regenerateMutation = useRegenerateAccessCode();

  const [branchDialogOpen, setBranchDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Cargando empleado...
        </span>
      </div>
    );
  }

  if (!empleado) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        Empleado no encontrado
      </div>
    );
  }

  const handleUpdate = (data: EmpleadoInput) => {
    updateMutation.mutate({ id, data });
  };

  const initials =
    `${empleado.nombre.charAt(0)}${empleado.apellido.charAt(0)}`.toUpperCase();

  return (
    <div className="space-y-5">
      {/* Back link */}
      <Link
        href="/empleados"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Empleados
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white ${ROLE_AVATAR_COLORS[empleado.rol] || "bg-gray-500"}`}
          >
            {initials}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {empleado.apellido}, {empleado.nombre}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge
                variant="secondary"
                className={`border-0 text-xs font-medium ${ROLE_COLORS[empleado.rol] || ""}`}
              >
                {ROLE_LABELS[empleado.rol as Rol] || empleado.rol}
              </Badge>
              <Badge
                variant="secondary"
                className={`border-0 text-xs font-medium ${ESTADO_COLORS[empleado.estado] || ""}`}
              >
                {ESTADO_EMPLEADO_LABELS[empleado.estado] || empleado.estado}
              </Badge>
              {empleado.access_code && (
                <Badge
                  variant="outline"
                  className="font-mono text-xs border-[var(--accent)]/30 text-[var(--accent)]"
                >
                  {empleado.access_code}
                </Badge>
              )}
              {canManage && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      disabled={regenerateMutation.isPending}
                    >
                      <RefreshCw
                        className={`mr-1 h-3 w-3 ${regenerateMutation.isPending ? "animate-spin" : ""}`}
                      />
                      Regenerar Codigo
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Regenerar codigo de acceso
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Se generara un nuevo codigo de acceso para este
                        empleado. El codigo anterior dejara de funcionar.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => regenerateMutation.mutate(id)}
                      >
                        Regenerar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="datos">
        <TabsList>
          <TabsTrigger value="datos">Datos</TabsTrigger>
          <TabsTrigger value="sucursales">Sucursales</TabsTrigger>
          <TabsTrigger value="comisiones">Comisiones</TabsTrigger>
        </TabsList>

        <TabsContent value="datos" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              {canManage ? (
                <EmployeeForm
                  defaultValues={{
                    nombre: empleado.nombre,
                    apellido: empleado.apellido,
                    email: empleado.email || "",
                    cuil: empleado.cuil || "",
                    rol: empleado.rol as EmpleadoInput["rol"],
                    sucursal_id: empleado.sucursal_id,
                    telefono: empleado.telefono || "",
                    fecha_ingreso: empleado.fecha_ingreso || "",
                    fecha_egreso: empleado.fecha_egreso || "",
                    estado:
                      (empleado.estado as EmpleadoInput["estado"]) || "ACTIVO",
                    dni: empleado.dni || "",
                    direccion: empleado.direccion || "",
                    salario_base: empleado.salario_base ?? undefined,
                    observaciones: empleado.observaciones || "",
                    tipo_contrato:
                      (empleado.tipo_contrato as EmpleadoInput["tipo_contrato"]) ||
                      "RELACION_DEPENDENCIA",
                    obra_social: empleado.obra_social || "",
                    numero_legajo: empleado.numero_legajo || "",
                    banco: empleado.banco || "",
                    cbu: empleado.cbu || "",
                  }}
                  onSubmit={handleUpdate}
                  isPending={updateMutation.isPending}
                  submitLabel="Actualizar"
                />
              ) : (
                <div className="space-y-6">
                  {/* Personal */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Informacion Personal
                    </h3>
                    <Separator className="mt-2 mb-4" />
                    <div className="grid gap-6 sm:grid-cols-2">
                      <ReadOnlyField label="Nombre" value={empleado.nombre} />
                      <ReadOnlyField
                        label="Apellido"
                        value={empleado.apellido}
                      />
                    </div>
                  </div>

                  {/* Contacto */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Contacto
                    </h3>
                    <Separator className="mt-2 mb-4" />
                    <div className="grid gap-6 sm:grid-cols-2">
                      <ReadOnlyField
                        label="Email"
                        value={empleado.email}
                        icon={
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        }
                      />
                      <ReadOnlyField
                        label="CUIL"
                        value={empleado.cuil}
                        icon={
                          <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                        }
                        mono
                      />
                      <ReadOnlyField
                        label="Telefono"
                        value={empleado.telefono}
                        icon={
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        }
                      />
                      <ReadOnlyField
                        label="DNI"
                        value={empleado.dni}
                        icon={
                          <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                        }
                        mono
                      />
                      <ReadOnlyField
                        label="Direccion"
                        value={empleado.direccion}
                        icon={
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        }
                      />
                    </div>
                  </div>

                  {/* Info Laboral */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Informacion Laboral
                    </h3>
                    <Separator className="mt-2 mb-4" />
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Rol
                        </p>
                        <Badge
                          variant="secondary"
                          className={`border-0 text-xs font-medium ${ROLE_COLORS[empleado.rol] || ""}`}
                        >
                          {ROLE_LABELS[empleado.rol as Rol] || empleado.rol}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Estado
                        </p>
                        <Badge
                          variant="secondary"
                          className={`border-0 text-xs font-medium ${ESTADO_COLORS[empleado.estado] || ""}`}
                        >
                          {ESTADO_EMPLEADO_LABELS[empleado.estado] ||
                            empleado.estado}
                        </Badge>
                      </div>
                      <ReadOnlyField
                        label="Tipo de Contrato"
                        value={
                          TIPO_CONTRATO_LABELS[empleado.tipo_contrato] ||
                          empleado.tipo_contrato
                        }
                        icon={
                          <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                        }
                      />
                      <ReadOnlyField
                        label="Numero de Legajo"
                        value={empleado.numero_legajo}
                        icon={
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        }
                        mono
                      />
                      <ReadOnlyField
                        label="Fecha de Ingreso"
                        value={
                          empleado.fecha_ingreso
                            ? new Date(
                                empleado.fecha_ingreso,
                              ).toLocaleDateString("es-AR")
                            : undefined
                        }
                        icon={
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        }
                      />
                      {empleado.fecha_egreso && (
                        <ReadOnlyField
                          label="Fecha de Egreso"
                          value={new Date(
                            empleado.fecha_egreso,
                          ).toLocaleDateString("es-AR")}
                          icon={
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          }
                        />
                      )}
                      <ReadOnlyField
                        label="Salario Base"
                        value={
                          empleado.salario_base != null
                            ? `$${empleado.salario_base.toLocaleString("es-AR")}`
                            : undefined
                        }
                      />
                    </div>
                  </div>

                  {/* Datos Bancarios */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Datos Bancarios
                    </h3>
                    <Separator className="mt-2 mb-4" />
                    <div className="grid gap-6 sm:grid-cols-2">
                      <ReadOnlyField
                        label="Banco"
                        value={empleado.banco}
                        icon={
                          <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                        }
                      />
                      <ReadOnlyField
                        label="CBU"
                        value={empleado.cbu}
                        mono
                      />
                      <ReadOnlyField
                        label="Obra Social"
                        value={empleado.obra_social}
                      />
                    </div>
                  </div>

                  {/* Observaciones */}
                  {empleado.observaciones && (
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        Observaciones
                      </h3>
                      <Separator className="mt-2 mb-4" />
                      <p className="text-sm text-foreground whitespace-pre-wrap">
                        {empleado.observaciones}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sucursales" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Sucursales Asignadas
              </CardTitle>
              {canManage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBranchDialogOpen(true)}
                  className="hover:border-[var(--accent)]/30 hover:bg-[var(--accent)]/5"
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Gestionar
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {branches && branches.length > 0 ? (
                <div className="space-y-2">
                  {branches.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center gap-3 rounded-lg border border-border/50 p-3.5 transition-colors hover:bg-muted/30"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {b.nombre}
                        </p>
                        {b.direccion && (
                          <p className="text-xs text-muted-foreground">
                            {b.direccion}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50 mb-3">
                    <Building2 className="h-6 w-6 text-muted-foreground/60" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    No tiene sucursales asignadas.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <BranchAssignmentDialog
            empleadoId={id}
            open={branchDialogOpen}
            onOpenChange={setBranchDialogOpen}
          />
        </TabsContent>

        <TabsContent value="comisiones" className="mt-4">
          <EmployeeCommissionsTab empleadoId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

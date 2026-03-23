"use client";

import { use, useState, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRuta, useDeleteRuta, useGenerarReparto } from "@/hooks/queries/use-rutas";
import { useEmpleados } from "@/hooks/queries/use-employees";
import { useUserStore } from "@/store/user-store";
import { hasPermission } from "@/lib/permissions";
import type { RutaParada } from "@pronto/shared/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  ArrowLeft,
  Route,
  MapPin,
  Truck,
  Building2,
  Calendar,
  Clock,
  FileText,
  Pencil,
  Trash2,
  Play,
} from "lucide-react";
import gsap from "gsap";

const DIA_SEMANA_LABELS: Record<number, string> = {
  0: "Domingo",
  1: "Lunes",
  2: "Martes",
  3: "Miercoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sabado",
};

export default function RutaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const permissions = user?.permissions ?? [];
  const canManage = hasPermission(permissions, "delivery:manage");

  const { data: ruta, isLoading } = useRuta(id);
  const deleteMutation = useDeleteRuta();
  const generarRepartoMutation = useGenerarReparto();

  const { data: empleadosData } = useEmpleados({
    page: 1,
    pageSize: 100,
    rol: "REPARTIDOR",
    estado: "ACTIVO",
  });
  const empleados = empleadosData?.data || [];

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showGenerarDialog, setShowGenerarDialog] = useState(false);
  const [generarFecha, setGenerarFecha] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [generarEmpleadoId, setGenerarEmpleadoId] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (isLoading || !ruta || !containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".detail-header",
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
      );
      gsap.fromTo(
        ".detail-card",
        { opacity: 0, y: 15 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.08,
          delay: 0.15,
          ease: "power3.out",
        }
      );
    }, containerRef);
    return () => ctx.revert();
  }, [isLoading, ruta]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Cargando ruta...</p>
      </div>
    );
  }

  if (!ruta) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Ruta no encontrada</p>
      </div>
    );
  }

  const handleDelete = () => {
    deleteMutation.mutate(id, {
      onSuccess: () => router.push("/logistica/rutas"),
    });
  };

  const handleGenerarReparto = () => {
    if (!generarEmpleadoId || !generarFecha) return;
    generarRepartoMutation.mutate(
      { id, data: { fecha: generarFecha, empleado_id: generarEmpleadoId } },
      {
        onSuccess: () => {
          setShowGenerarDialog(false);
          setGenerarEmpleadoId("");
        },
      },
    );
  };

  const paradasOrdenadas = [...(ruta.paradas || [])].sort(
    (a, b) => a.orden - b.orden,
  );

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="detail-header space-y-4">
        <Link
          href="/logistica/rutas"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Rutas
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Route className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {ruta.nombre}
              </h1>
              <p className="text-muted-foreground mt-0.5">
                {ruta.dia_semana != null
                  ? DIA_SEMANA_LABELS[ruta.dia_semana] || `Dia ${ruta.dia_semana}`
                  : "Sin dia asignado"}
                {ruta.hora_salida_estimada && ` - Salida: ${ruta.hora_salida_estimada}`}
              </p>
            </div>
          </div>
          {canManage && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowGenerarDialog(true)}
              >
                <Play className="mr-2 h-4 w-4" />
                Generar Reparto
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(`/logistica/rutas/${id}/editar`)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Info cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="detail-card border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-950/50">
                <MapPin className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Zona
                </p>
                <p className="font-medium truncate">
                  {ruta.zona_nombre || "Sin asignar"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="detail-card border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/50">
                <Truck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Vehiculo
                </p>
                <p className="font-medium truncate">
                  {ruta.vehiculo_descripcion || ruta.vehiculo_patente || "Sin asignar"}
                </p>
                {ruta.vehiculo_patente && ruta.vehiculo_descripcion && (
                  <Badge variant="outline" className="mt-1 font-mono text-xs">
                    {ruta.vehiculo_patente}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="detail-card border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/50">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Dia de la semana
                </p>
                <p className="font-medium">
                  {ruta.dia_semana != null
                    ? DIA_SEMANA_LABELS[ruta.dia_semana] || String(ruta.dia_semana)
                    : "No especificado"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="detail-card border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-950/50">
                <Clock className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Hora salida estimada
                </p>
                <p className="font-medium">
                  {ruta.hora_salida_estimada || "No especificada"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="detail-card border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/50">
                <Building2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Sucursal
                </p>
                <p className="font-medium truncate">
                  {ruta.sucursal_nombre || "Sin asignar"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {ruta.notas && (
          <Card className="detail-card border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-950/50">
                  <FileText className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Notas
                  </p>
                  <p className="font-medium text-sm">{ruta.notas}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Paradas */}
      <Card className="detail-card border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Paradas ({paradasOrdenadas.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paradasOrdenadas.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No hay paradas configuradas
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-muted/50">
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground w-16">
                    Orden
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Cliente
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Direccion
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground text-center w-32">
                    Tiempo est. (min)
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Notas
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paradasOrdenadas.map((p: RutaParada) => {
                  const direccionParts = [
                    p.direccion_calle,
                    p.direccion_numero,
                    p.direccion_ciudad,
                  ].filter(Boolean);
                  return (
                    <TableRow key={p.id} className="border-muted/30">
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="border-0 text-xs font-medium"
                        >
                          {p.orden}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">
                          {p.cliente_nombre}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {direccionParts.length > 0
                            ? direccionParts.join(" ")
                            : "-"}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm tabular-nums">
                          {p.tiempo_estimado_minutos}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {p.notas || "-"}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Generar Reparto dialog */}
      <Dialog open={showGenerarDialog} onOpenChange={setShowGenerarDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generar Reparto desde Ruta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha del reparto</label>
              <Input
                type="date"
                value={generarFecha}
                onChange={(e) => setGenerarFecha(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Repartidor</label>
              <Select
                onValueChange={setGenerarEmpleadoId}
                value={generarEmpleadoId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar repartidor" />
                </SelectTrigger>
                <SelectContent>
                  {empleados.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.apellido}, {emp.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowGenerarDialog(false);
                setGenerarEmpleadoId("");
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleGenerarReparto}
              disabled={
                generarRepartoMutation.isPending ||
                !generarEmpleadoId ||
                !generarFecha
              }
            >
              {generarRepartoMutation.isPending
                ? "Generando..."
                : "Generar Reparto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar ruta</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. La ruta &quot;{ruta.nombre}&quot;
              sera eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

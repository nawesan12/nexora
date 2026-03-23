"use client";

import { useState, useMemo, useRef, useLayoutEffect } from "react";
import {
  useSalidasVendedor,
  useRegistrarSalida,
  useRegistrarRegreso,
  useDeleteSalida,
} from "@/hooks/queries/use-salidas-vendedor";
import { useEmpleados } from "@/hooks/queries/use-employees";
import { useBranches } from "@/hooks/queries/use-branches";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  registrarSalidaSchema,
  registrarRegresoSchema,
  type RegistrarSalidaInput,
  type RegistrarRegresoInput,
} from "@pronto/shared/schemas";
import type { SalidaVendedor } from "@pronto/shared/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  MapPin,
  Plus,
  Users,
  Navigation,
  CheckCircle2,
  Clock,
  Trash2,
  CornerDownLeft,
  Loader2,
} from "lucide-react";
import gsap from "gsap";

function formatTime(iso?: string) {
  if (!iso) return "-";
  return new Date(iso).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatKm(v?: number) {
  if (!v) return "-";
  return `${v.toFixed(1)} km`;
}

const estadoBadge: Record<string, { variant: "default" | "secondary" | "outline"; label: string }> = {
  EN_CAMPO: { variant: "default", label: "En Campo" },
  REGRESADO: { variant: "secondary", label: "Regresado" },
  SIN_SALIR: { variant: "outline", label: "Sin Salir" },
};

export default function SalidasVendedorPage() {
  const today = new Date().toISOString().split("T")[0];
  const [fecha, setFecha] = useState(today);
  const [page, setPage] = useState(1);
  const [showSalidaDialog, setShowSalidaDialog] = useState(false);
  const [regresoId, setRegresoId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useSalidasVendedor({ page, pageSize: 50, fecha });
  const { data: empleadosData } = useEmpleados({ page: 1, pageSize: 200 });
  const { data: branchesData } = useBranches();
  const registrarSalidaMutation = useRegistrarSalida();
  const registrarRegresoMutation = useRegistrarRegreso();
  const deleteMutation = useDeleteSalida();

  const salidas = data?.data || [];
  const meta = data?.meta;
  const empleados = empleadosData?.data || [];
  const branches = branchesData?.data || [];

  // Summary
  const totalVendedores = salidas.length;
  const enCampo = salidas.filter((s) => s.estado === "EN_CAMPO").length;
  const regresados = salidas.filter((s) => s.estado === "REGRESADO").length;
  const kmTotal = salidas.reduce((acc, s) => acc + (s.km_recorridos || 0), 0);

  // Salida form
  const salidaForm = useForm<RegistrarSalidaInput>({
    resolver: zodResolver(registrarSalidaSchema),
    defaultValues: {
      empleado_id: "",
      sucursal_id: "",
      km_inicio: undefined,
      observaciones: "",
    },
  });

  // Regreso form
  const regresoForm = useForm<RegistrarRegresoInput>({
    resolver: zodResolver(registrarRegresoSchema),
    defaultValues: {
      km_fin: undefined,
      observaciones: "",
    },
  });

  const onSubmitSalida = (data: RegistrarSalidaInput) => {
    registrarSalidaMutation.mutate(data, {
      onSuccess: () => {
        setShowSalidaDialog(false);
        salidaForm.reset();
      },
    });
  };

  const onSubmitRegreso = (data: RegistrarRegresoInput) => {
    if (!regresoId) return;
    registrarRegresoMutation.mutate(
      { id: regresoId, data },
      {
        onSuccess: () => {
          setRegresoId(null);
          regresoForm.reset();
        },
      },
    );
  };

  // Animation
  const containerRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".salidas-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      );
      gsap.fromTo(
        ".salidas-cards",
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.15 },
      );
      gsap.fromTo(
        ".salidas-table",
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.25 },
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="space-y-5">
      {/* Header */}
      <div className="salidas-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Salidas de Vendedores
          </h1>
          <p className="text-sm text-muted-foreground">
            Control de salidas y regresos del equipo de ventas
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            type="date"
            value={fecha}
            onChange={(e) => {
              setFecha(e.target.value);
              setPage(1);
            }}
            className="h-9 w-[160px]"
          />
          <Button
            className="shadow-sm"
            onClick={() => setShowSalidaDialog(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Registrar Salida
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="salidas-cards grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendedores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVendedores}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Campo</CardTitle>
            <Navigation className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{enCampo}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regresados</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{regresados}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">KM Totales</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kmTotal.toFixed(1)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="salidas-table">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Sucursal</TableHead>
                  <TableHead>Hora Salida</TableHead>
                  <TableHead>Hora Regreso</TableHead>
                  <TableHead className="text-right">KM Inicio</TableHead>
                  <TableHead className="text-right">KM Fin</TableHead>
                  <TableHead className="text-right">KM Recorridos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : salidas.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No hay salidas registradas para esta fecha
                    </TableCell>
                  </TableRow>
                ) : (
                  salidas.map((s) => {
                    const badge = estadoBadge[s.estado] || estadoBadge.SIN_SALIR;
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">
                          {s.empleado_nombre}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {s.sucursal_nombre || "-"}
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1 text-sm">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            {formatTime(s.hora_salida)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {formatTime(s.hora_regreso)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm">
                          {formatKm(s.km_inicio)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm">
                          {formatKm(s.km_fin)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-semibold text-sm">
                          {formatKm(s.km_recorridos)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {s.estado === "EN_CAMPO" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setRegresoId(s.id);
                                  regresoForm.reset();
                                }}
                              >
                                <CornerDownLeft className="mr-1 h-3.5 w-3.5" />
                                Regreso
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteId(s.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <span className="text-sm text-muted-foreground">
                {meta.total} registros
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Registrar Salida Dialog */}
      <Dialog open={showSalidaDialog} onOpenChange={setShowSalidaDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Registrar Salida</DialogTitle>
          </DialogHeader>
          <Form {...salidaForm}>
            <form onSubmit={salidaForm.handleSubmit(onSubmitSalida)} className="space-y-4">
              <FormField
                control={salidaForm.control}
                name="empleado_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empleado</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar empleado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {empleados.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.nombre} {e.apellido}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={salidaForm.control}
                name="sucursal_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sucursal</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar sucursal" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {branches.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={salidaForm.control}
                name="km_inicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>KM Inicio</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === "" ? undefined : Number(e.target.value),
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={salidaForm.control}
                name="observaciones"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observaciones</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Observaciones opcionales..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowSalidaDialog(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={registrarSalidaMutation.isPending}>
                  {registrarSalidaMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Registrar
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Registrar Regreso Dialog */}
      <Dialog open={!!regresoId} onOpenChange={() => setRegresoId(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Registrar Regreso</DialogTitle>
          </DialogHeader>
          <Form {...regresoForm}>
            <form onSubmit={regresoForm.handleSubmit(onSubmitRegreso)} className="space-y-4">
              <FormField
                control={regresoForm.control}
                name="km_fin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>KM Fin</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === "" ? undefined : Number(e.target.value),
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={regresoForm.control}
                name="observaciones"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observaciones</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Observaciones opcionales..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRegresoId(null)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={registrarRegresoMutation.isPending}>
                  {registrarRegresoMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Confirmar Regreso
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar salida</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. Se eliminara el registro de salida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  deleteMutation.mutate(deleteId);
                  setDeleteId(null);
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

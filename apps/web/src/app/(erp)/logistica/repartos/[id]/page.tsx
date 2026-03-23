"use client";

import { use, useState, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useReparto,
  useTransitionReparto,
  useEventosReparto,
  useCreateEventoReparto,
} from "@/hooks/queries/use-logistics";
import { useUserStore } from "@/store/user-store";
import { hasPermission } from "@/lib/permissions";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  eventoRepartoSchema,
  type EventoRepartoInput,
} from "@pronto/shared/schemas";
import type { EventoReparto, RepartoPedido } from "@pronto/shared/types";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Truck,
  User,
  MapPin,
  Building2,
  Gauge,
  Clock,
  Plus,
  Play,
  Square,
  XCircle,
} from "lucide-react";
import { SignatureCapture } from "@/components/signature-pad";
import gsap from "gsap";

const ESTADO_REPARTO_LABELS: Record<string, string> = {
  PLANIFICADO: "Planificado",
  EN_CURSO: "En Curso",
  FINALIZADO: "Finalizado",
  CANCELADO: "Cancelado",
};

const ESTADO_REPARTO_COLORS: Record<string, string> = {
  PLANIFICADO:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  EN_CURSO:
    "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
  FINALIZADO:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  CANCELADO:
    "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
};

const EVENTO_TIPO_LABELS: Record<string, string> = {
  LLEGADA: "Llegada",
  ENTREGA: "Entrega",
  NO_ENTREGA: "No Entregado",
  ENTREGA_PARCIAL: "Entrega Parcial",
  COBRO: "Cobro",
};

const EVENTO_TIPO_COLORS: Record<string, string> = {
  LLEGADA:
    "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
  ENTREGA:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  NO_ENTREGA:
    "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
  ENTREGA_PARCIAL:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  COBRO:
    "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400",
};

const PEDIDO_ESTADO_COLORS: Record<string, string> = {
  EN_REPARTO:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-teal-400",
  ENTREGADO:
    "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400",
  NO_ENTREGADO:
    "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400",
  PREPARADO:
    "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-400",
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(n);
}

export default function RepartoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const permissions = user?.permissions ?? [];
  const canManage = hasPermission(permissions, "delivery:manage");

  const { data: reparto, isLoading } = useReparto(id);
  const { data: eventosData } = useEventosReparto(id);
  const transitionMutation = useTransitionReparto();
  const createEventoMutation = useCreateEventoReparto();

  const eventos = (eventosData as EventoReparto[] | undefined) || reparto?.eventos || [];

  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showTransitionDialog, setShowTransitionDialog] = useState<string | null>(null);
  const [kmInicio, setKmInicio] = useState("");
  const [kmFin, setKmFin] = useState("");
  const [eventoFirmaUrl, setEventoFirmaUrl] = useState<string | null>(null);

  const eventoForm = useForm<EventoRepartoInput>({
    resolver: zodResolver(eventoRepartoSchema),
    defaultValues: {
      pedido_id: "",
      tipo: undefined,
      comentario: "",
      monto_cobrado: undefined,
    },
  });

  const eventoTipo = eventoForm.watch("tipo");

  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (isLoading || !reparto || !containerRef.current) return;
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
  }, [isLoading, reparto]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Cargando reparto...</p>
      </div>
    );
  }

  if (!reparto) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Reparto no encontrado</p>
      </div>
    );
  }

  const handleTransition = (nuevoEstado: string) => {
    const data: { estado: string; km_inicio?: number; km_fin?: number } = {
      estado: nuevoEstado,
    };
    if (nuevoEstado === "EN_CURSO" && kmInicio) {
      data.km_inicio = Number(kmInicio);
    }
    if (nuevoEstado === "FINALIZADO" && kmFin) {
      data.km_fin = Number(kmFin);
    }
    transitionMutation.mutate(
      { id, data },
      {
        onSuccess: () => {
          setShowTransitionDialog(null);
          setKmInicio("");
          setKmFin("");
        },
      },
    );
  };

  const handleCreateEvento = (data: EventoRepartoInput) => {
    const payload: Record<string, unknown> = {
      ...data,
      pedido_id: data.pedido_id || undefined,
      comentario: data.comentario || undefined,
      monto_cobrado: data.monto_cobrado || undefined,
    };
    if (eventoFirmaUrl) {
      payload.firma_url = eventoFirmaUrl;
    }
    createEventoMutation.mutate(
      { repartoId: id, data: payload as EventoRepartoInput },
      {
        onSuccess: () => {
          setShowEventDialog(false);
          setEventoFirmaUrl(null);
          eventoForm.reset();
        },
      },
    );
  };

  const transitionButtons = [];
  if (reparto.estado === "PLANIFICADO") {
    transitionButtons.push({
      label: "Iniciar Reparto",
      estado: "EN_CURSO",
      icon: <Play className="mr-2 h-4 w-4" />,
      variant: "default" as const,
    });
    transitionButtons.push({
      label: "Cancelar",
      estado: "CANCELADO",
      icon: <XCircle className="mr-2 h-4 w-4" />,
      variant: "destructive" as const,
    });
  } else if (reparto.estado === "EN_CURSO") {
    transitionButtons.push({
      label: "Finalizar Reparto",
      estado: "FINALIZADO",
      icon: <Square className="mr-2 h-4 w-4" />,
      variant: "default" as const,
    });
    transitionButtons.push({
      label: "Cancelar",
      estado: "CANCELADO",
      icon: <XCircle className="mr-2 h-4 w-4" />,
      variant: "destructive" as const,
    });
  }

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="detail-header space-y-4">
        <Link
          href="/logistica/repartos"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Repartos
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {reparto.numero}
              </h1>
              <Badge
                variant="secondary"
                className={`border-0 text-xs font-medium ${ESTADO_REPARTO_COLORS[reparto.estado] || ""}`}
              >
                {ESTADO_REPARTO_LABELS[reparto.estado] || reparto.estado}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              {new Date(reparto.fecha + "T00:00:00").toLocaleDateString("es-AR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          {canManage && reparto.estado === "EN_CURSO" && (
            <Button
              variant="outline"
              onClick={() => setShowEventDialog(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Registrar Evento
            </Button>
          )}
        </div>
      </div>

      {/* Transition actions */}
      {canManage && transitionButtons.length > 0 && (
        <Card className="detail-card border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">
                Acciones:
              </span>
              {transitionButtons.map((btn) => (
                <Button
                  key={btn.estado}
                  variant={btn.variant}
                  size="sm"
                  onClick={() => {
                    if (
                      btn.estado === "EN_CURSO" ||
                      btn.estado === "FINALIZADO"
                    ) {
                      setShowTransitionDialog(btn.estado);
                    } else {
                      handleTransition(btn.estado);
                    }
                  }}
                  disabled={transitionMutation.isPending}
                >
                  {btn.icon}
                  {btn.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="detail-card border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/50">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Repartidor
                </p>
                <p className="font-medium truncate">{reparto.empleado_nombre}</p>
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
                  {reparto.vehiculo_descripcion || reparto.vehiculo_patente || "Sin asignar"}
                </p>
                {reparto.vehiculo_patente && reparto.vehiculo_descripcion && (
                  <Badge variant="outline" className="mt-1 font-mono text-xs">
                    {reparto.vehiculo_patente}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

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
                  {reparto.zona_nombre || "Sin asignar"}
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
                <p className="font-medium truncate">{reparto.sucursal_nombre}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="detail-card border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-950/50">
                <Gauge className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Kilometraje
                </p>
                <p className="font-medium">
                  {reparto.km_inicio != null ? `${reparto.km_inicio} km` : "-"}
                  {" → "}
                  {reparto.km_fin != null ? `${reparto.km_fin} km` : "-"}
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
                  Horarios
                </p>
                <p className="font-medium">
                  {reparto.hora_salida
                    ? new Date(reparto.hora_salida).toLocaleTimeString("es-AR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-"}
                  {" → "}
                  {reparto.hora_regreso
                    ? new Date(reparto.hora_regreso).toLocaleTimeString("es-AR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assigned orders */}
      <Card className="detail-card border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Pedidos asignados ({reparto.pedidos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reparto.pedidos.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No hay pedidos asignados
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-muted/50">
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Pedido
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Cliente
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Estado
                  </TableHead>
                  <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Total
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reparto.pedidos.map((p: RepartoPedido) => (
                  <TableRow
                    key={p.id}
                    className="border-muted/30 cursor-pointer hover:bg-muted/50"
                    onClick={() =>
                      router.push(`/ventas/pedidos/${p.pedido_id}`)
                    }
                  >
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="font-mono text-xs border-primary/30 text-primary"
                      >
                        {p.pedido_numero}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">
                        {p.cliente_nombre}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`border-0 text-xs font-medium ${PEDIDO_ESTADO_COLORS[p.pedido_estado] || ""}`}
                      >
                        {p.pedido_estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatCurrency(p.pedido_total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Events timeline */}
      <Card className="detail-card border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">
              Eventos del reparto
            </CardTitle>
            {canManage && reparto.estado === "EN_CURSO" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEventDialog(true)}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Registrar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {eventos.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No hay eventos registrados
            </p>
          ) : (
            <div className="relative space-y-0">
              {eventos.map((evento: EventoReparto, index: number) => (
                <div key={evento.id} className="relative flex gap-4 pb-6 last:pb-0">
                  {/* Vertical line */}
                  {index < eventos.length - 1 && (
                    <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border" />
                  )}
                  {/* Dot */}
                  <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-background bg-muted">
                    <div
                      className={`h-3 w-3 rounded-full ${
                        evento.tipo === "ENTREGA"
                          ? "bg-emerald-500"
                          : evento.tipo === "NO_ENTREGA"
                            ? "bg-red-500"
                            : evento.tipo === "COBRO"
                              ? "bg-amber-500"
                              : "bg-blue-500"
                      }`}
                    />
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={`border-0 text-xs font-medium ${EVENTO_TIPO_COLORS[evento.tipo] || ""}`}
                      >
                        {EVENTO_TIPO_LABELS[evento.tipo] || evento.tipo}
                      </Badge>
                      {evento.pedido_numero && (
                        <Badge variant="outline" className="font-mono text-xs">
                          {evento.pedido_numero}
                        </Badge>
                      )}
                      {evento.monto_cobrado != null && evento.monto_cobrado > 0 && (
                        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(evento.monto_cobrado)}
                        </span>
                      )}
                    </div>
                    {evento.comentario && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {evento.comentario}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground/70">
                      {new Date(evento.created_at).toLocaleString("es-AR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {evento.empleado_nombre && ` - ${evento.empleado_nombre}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transition dialog */}
      <Dialog
        open={!!showTransitionDialog}
        onOpenChange={() => setShowTransitionDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {showTransitionDialog === "EN_CURSO"
                ? "Iniciar Reparto"
                : "Finalizar Reparto"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {showTransitionDialog === "EN_CURSO" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Kilometraje de inicio
                </label>
                <Input
                  type="number"
                  placeholder="Ej: 45230"
                  value={kmInicio}
                  onChange={(e) => setKmInicio(e.target.value)}
                />
              </div>
            )}
            {showTransitionDialog === "FINALIZADO" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Kilometraje final
                </label>
                <Input
                  type="number"
                  placeholder="Ej: 45380"
                  value={kmFin}
                  onChange={(e) => setKmFin(e.target.value)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTransitionDialog(null)}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => handleTransition(showTransitionDialog!)}
              disabled={transitionMutation.isPending}
            >
              {transitionMutation.isPending ? "Guardando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create event dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Evento</DialogTitle>
          </DialogHeader>
          <Form {...eventoForm}>
            <form
              onSubmit={eventoForm.handleSubmit(handleCreateEvento)}
              className="space-y-4"
            >
              <FormField
                control={eventoForm.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de evento</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(EVENTO_TIPO_LABELS).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={eventoForm.control}
                name="pedido_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pedido (opcional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar pedido" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {reparto.pedidos.map((p: RepartoPedido) => (
                          <SelectItem key={p.pedido_id} value={p.pedido_id}>
                            {p.pedido_numero} - {p.cliente_nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={eventoForm.control}
                name="comentario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comentario</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Detalles del evento..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {eventoTipo === "COBRO" && (
                <FormField
                  control={eventoForm.control}
                  name="monto_cobrado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto cobrado</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? Number(e.target.value) : undefined,
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {(eventoTipo === "ENTREGA" || eventoTipo === "ENTREGA_PARCIAL") && (
                <div className="space-y-2">
                  {eventoFirmaUrl ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Firma capturada</p>
                      <div className="rounded-lg border bg-white p-2">
                        <img src={eventoFirmaUrl} alt="Firma" className="mx-auto h-24 object-contain" />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => setEventoFirmaUrl(null)}
                      >
                        Cambiar firma
                      </Button>
                    </div>
                  ) : (
                    <SignatureCapture
                      title="Firma del receptor (opcional)"
                      onSave={(dataUrl) => setEventoFirmaUrl(dataUrl)}
                      width={400}
                      height={150}
                      className="border shadow-none"
                    />
                  )}
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEventDialog(false);
                    setEventoFirmaUrl(null);
                    eventoForm.reset();
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createEventoMutation.isPending}
                >
                  {createEventoMutation.isPending
                    ? "Guardando..."
                    : "Registrar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

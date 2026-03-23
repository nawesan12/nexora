"use client";

import { useState, useRef, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { usePedidos, useTransitionPedido } from "@/hooks/queries/use-orders";
import { useUserStore } from "@/store/user-store";
import { hasPermission } from "@/lib/permissions";
import { ORDER_STATUS_LABELS } from "@pronto/shared/constants";
import type { PedidoList } from "@pronto/shared/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ShieldCheck,
  Check,
  X,
  Eye,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { EmptyOrders } from "@/components/illustrations";
import gsap from "gsap";

const STATUS_COLORS: Record<string, string> = {
  PENDIENTE_APROBACION:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  EN_EVALUACION:
    "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(n);
}

export default function AprobacionesPage() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const permissions = user?.permissions ?? [];
  const canApprove = hasPermission(permissions, "orders:approve");

  const [page, setPage] = useState(1);

  // Fetch PENDIENTE_APROBACION pedidos
  const { data: pendienteData, isLoading: isLoadingPendiente } = usePedidos({
    page,
    pageSize: 50,
    estado: "PENDIENTE_APROBACION",
  });

  // Fetch EN_EVALUACION pedidos
  const { data: evaluacionData, isLoading: isLoadingEvaluacion } = usePedidos({
    page: 1,
    pageSize: 50,
    estado: "EN_EVALUACION",
  });

  const transitionMutation = useTransitionPedido();

  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState("");
  const [approveId, setApproveId] = useState<string | null>(null);

  const pendientes = pendienteData?.data || [];
  const enEvaluacion = evaluacionData?.data || [];
  const allPedidos = [...pendientes, ...enEvaluacion];
  const totalCount = allPedidos.length;
  const isLoading = isLoadingPendiente || isLoadingEvaluacion;

  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".approvals-header",
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
      );
      gsap.fromTo(
        ".approvals-summary",
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, delay: 0.1, ease: "power3.out" }
      );
      gsap.fromTo(
        ".approvals-table",
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, delay: 0.2, ease: "power3.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const handleApprove = (id: string) => {
    transitionMutation.mutate(
      { id, data: { estado: "APROBADO" } },
      { onSuccess: () => setApproveId(null) }
    );
  };

  const handleReject = () => {
    if (!rejectId) return;
    transitionMutation.mutate(
      {
        id: rejectId,
        data: {
          estado: "RECHAZADO",
          comentario: rejectComment || undefined,
        },
      },
      {
        onSuccess: () => {
          setRejectId(null);
          setRejectComment("");
        },
      }
    );
  };

  if (!canApprove) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground text-lg">
          No tienes permisos para aprobar pedidos
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="approvals-header">
        <h1 className="text-3xl font-bold tracking-tight">Aprobaciones</h1>
        <p className="text-muted-foreground mt-1">
          Pedidos pendientes de aprobacion
        </p>
      </div>

      {/* Summary bar */}
      <Card className="approvals-summary border-0 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
        <CardContent className="py-4">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/50">
                <ShieldCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalCount}</p>
                <p className="text-xs text-muted-foreground">
                  Pedidos pendientes de aprobacion
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/30">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendientes.length}</p>
                <p className="text-xs text-muted-foreground">
                  Pendiente aprobacion
                </p>
              </div>
            </div>
            {enEvaluacion.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                  <Eye className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{enEvaluacion.length}</p>
                  <p className="text-xs text-muted-foreground">En evaluacion</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="approvals-table border-0 shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-muted-foreground">
                Cargando pedidos pendientes...
              </p>
            </div>
          ) : allPedidos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-48 h-48">
                <EmptyOrders className="w-full h-full" />
              </div>
              <p className="text-lg font-medium text-foreground">
                Sin aprobaciones pendientes
              </p>
              <p className="text-sm text-muted-foreground">
                No hay pedidos que requieran tu aprobacion en este momento.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-muted/50">
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Numero
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Cliente
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Fecha
                  </TableHead>
                  <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Total
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Estado
                  </TableHead>
                  <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allPedidos.map((pedido: PedidoList) => (
                  <TableRow
                    key={pedido.id}
                    className="border-muted/30 cursor-pointer hover:bg-muted/50"
                    onClick={() =>
                      router.push(`/ventas/pedidos/${pedido.id}`)
                    }
                  >
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="font-mono text-xs border-primary/30 text-primary"
                      >
                        {pedido.numero}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-foreground">
                        {pedido.cliente_nombre}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {new Date(pedido.fecha_pedido).toLocaleDateString(
                          "es-AR",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-bold tabular-nums">
                      {formatCurrency(pedido.total)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`border-0 text-xs font-medium ${STATUS_COLORS[pedido.estado] || ""}`}
                      >
                        {ORDER_STATUS_LABELS[
                          pedido.estado as keyof typeof ORDER_STATUS_LABELS
                        ] || pedido.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div
                        className="flex items-center justify-end gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-3 text-xs"
                          onClick={() =>
                            router.push(`/ventas/pedidos/${pedido.id}`)
                          }
                        >
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          Ver
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => setApproveId(pedido.id)}
                          disabled={transitionMutation.isPending}
                        >
                          <Check className="mr-1.5 h-3.5 w-3.5" />
                          Aprobar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-8 px-3 text-xs"
                          onClick={() => setRejectId(pedido.id)}
                          disabled={transitionMutation.isPending}
                        >
                          <X className="mr-1.5 h-3.5 w-3.5" />
                          Rechazar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Approve confirmation dialog */}
      <AlertDialog
        open={!!approveId}
        onOpenChange={() => setApproveId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aprobar pedido</AlertDialogTitle>
            <AlertDialogDescription>
              El pedido pasara al estado &quot;Aprobado&quot; y podra continuar
              con su preparacion. Esta accion quedara registrada en el
              historial.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => {
                if (approveId) handleApprove(approveId);
              }}
            >
              Confirmar aprobacion
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject dialog with comment */}
      <AlertDialog
        open={!!rejectId}
        onOpenChange={() => {
          setRejectId(null);
          setRejectComment("");
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rechazar pedido</AlertDialogTitle>
            <AlertDialogDescription>
              El pedido sera rechazado. Opcionalmente puedes agregar un motivo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Textarea
              placeholder="Motivo del rechazo (opcional)..."
              rows={3}
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={handleReject}
            >
              Confirmar rechazo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

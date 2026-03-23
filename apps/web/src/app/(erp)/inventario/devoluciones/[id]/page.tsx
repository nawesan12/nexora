"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import {
  useDevolucion,
  useApproveDevolucion,
  useRejectDevolucion,
  useDeleteDevolucion,
} from "@/hooks/queries/use-devoluciones";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, PackageMinus, Check, X, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";

const estadoBadge: Record<string, { className: string }> = {
  PENDIENTE: { className: "border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400" },
  APROBADA: { className: "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400" },
  RECHAZADA: { className: "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400" },
  PROCESADA: { className: "border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-400" },
};

export default function DevolucionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data, isLoading } = useDevolucion(id);
  const approveMutation = useApproveDevolucion();
  const rejectMutation = useRejectDevolucion();
  const deleteMutation = useDeleteDevolucion();

  const devolucion = data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!devolucion) {
    return (
      <div className="space-y-4">
        <Link
          href="/inventario/devoluciones"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Devoluciones
        </Link>
        <p className="text-muted-foreground">Devolucion no encontrada.</p>
      </div>
    );
  }

  const badge = estadoBadge[devolucion.estado] || estadoBadge.PENDIENTE;
  const isPending = devolucion.estado === "PENDIENTE";

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/inventario/devoluciones"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Devoluciones
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
              <PackageMinus className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {devolucion.numero}
              </h1>
              <p className="text-sm text-muted-foreground">
                Devolucion de {devolucion.cliente_nombre}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={badge.className}>
              {devolucion.estado}
            </Badge>
            {isPending && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-green-500/50 text-green-700 hover:bg-green-500/10 dark:text-green-400"
                  onClick={() => approveMutation.mutate(id)}
                  disabled={approveMutation.isPending}
                >
                  {approveMutation.isPending ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Aprobar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-500/50 text-red-700 hover:bg-red-500/10 dark:text-red-400"
                  onClick={() => rejectMutation.mutate(id)}
                  disabled={rejectMutation.isPending}
                >
                  {rejectMutation.isPending ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <X className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Rechazar
                </Button>
              </>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive">
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Eliminar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Eliminar devolucion</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta accion no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() =>
                      deleteMutation.mutate(id, {
                        onSuccess: () => router.push("/inventario/devoluciones"),
                      })
                    }
                  >
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informacion General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <span className="text-muted-foreground">Numero</span>
              <span className="font-mono font-semibold">{devolucion.numero}</span>

              <span className="text-muted-foreground">Cliente</span>
              <span className="font-medium">{devolucion.cliente_nombre}</span>

              <span className="text-muted-foreground">Sucursal</span>
              <span>{devolucion.sucursal_nombre}</span>

              <span className="text-muted-foreground">Fecha</span>
              <span>
                {devolucion.fecha
                  ? new Date(devolucion.fecha + "T00:00:00").toLocaleDateString("es-AR")
                  : "-"}
              </span>

              {devolucion.pedido_numero && (
                <>
                  <span className="text-muted-foreground">Pedido</span>
                  <span className="font-mono">{devolucion.pedido_numero}</span>
                </>
              )}

              <span className="text-muted-foreground">Creada</span>
              <span>
                {new Date(devolucion.created_at).toLocaleDateString("es-AR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Motivo y Observaciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Motivo</p>
              <p className="text-sm">{devolucion.motivo}</p>
            </div>
            {devolucion.observaciones && (
              <>
                <Separator />
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Observaciones</p>
                  <p className="text-sm text-muted-foreground">{devolucion.observaciones}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Productos ({devolucion.items?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Codigo</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead>Motivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devolucion.items?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.producto_nombre}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {item.producto_codigo || "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{item.producto_unidad}</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {item.cantidad}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.motivo_item || "-"}
                  </TableCell>
                </TableRow>
              ))}
              {(!devolucion.items || devolucion.items.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Sin productos
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

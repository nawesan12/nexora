"use client";

import { use, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  usePlantilla,
  useDeletePlantilla,
  useGenerarPedido,
} from "@/hooks/queries/use-plantillas";
import type { DetallePlantillaPedido } from "@pronto/shared/types";
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
  ClipboardList,
  User,
  Building2,
  Calendar,
  RefreshCw,
  Trash2,
  Play,
  Loader2,
} from "lucide-react";
import gsap from "gsap";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(n);
}

export default function PlantillaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: plantilla, isLoading } = usePlantilla(id);
  const deleteMutation = useDeletePlantilla();
  const generarMutation = useGenerarPedido();

  const containerRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (isLoading || !plantilla || !containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".detail-header",
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" },
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
        },
      );
    }, containerRef);
    return () => ctx.revert();
  }, [isLoading, plantilla]);

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Cargando plantilla...</p>
      </div>
    );
  if (!plantilla)
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Plantilla no encontrada</p>
      </div>
    );

  const handleGenerar = () => {
    generarMutation.mutate(id, {
      onSuccess: (result) => {
        const pedidoId = (result as any)?.pedido_id;
        if (pedidoId) {
          router.push(`/ventas/pedidos/${pedidoId}`);
        }
      },
    });
  };

  const total = plantilla.items?.reduce(
    (sum, item) => sum + item.cantidad * item.precio,
    0,
  ) || 0;

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="detail-header space-y-4">
        <Link
          href="/ventas/plantillas"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Plantillas
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {plantilla.nombre}
              </h1>
              <Badge
                variant="secondary"
                className={`border-0 text-xs font-medium ${
                  plantilla.activa
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400"
                }`}
              >
                {plantilla.activa ? "Activa" : "Inactiva"}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleGenerar}
              disabled={generarMutation.isPending}
            >
              {generarMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Generar Pedido
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() =>
                deleteMutation.mutate(id, {
                  onSuccess: () => router.push("/ventas/plantillas"),
                })
              }
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="detail-card border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/50">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Cliente
                </p>
                <p className="font-medium truncate">
                  {plantilla.cliente_nombre || "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="detail-card border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/50">
                <Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Sucursal
                </p>
                <p className="font-medium truncate">
                  {plantilla.sucursal_nombre || "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="detail-card border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-950/50">
                <RefreshCw className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Frecuencia
                </p>
                <p className="font-medium">
                  Cada {plantilla.frecuencia_dias}{" "}
                  {plantilla.frecuencia_dias === 1 ? "dia" : "dias"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="detail-card border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/50">
                <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Proxima Generacion
                </p>
                <p className="font-medium">
                  {plantilla.proximo_generacion
                    ? new Date(
                        plantilla.proximo_generacion + "T00:00:00",
                      ).toLocaleDateString("es-AR")
                    : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="detail-card border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">
              Productos ({plantilla.items?.length || 0})
            </CardTitle>
            <span className="text-sm font-semibold text-foreground">
              Total estimado: {formatCurrency(total)}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {!plantilla.items || plantilla.items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Sin productos
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-muted/50">
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Producto
                  </TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Codigo
                  </TableHead>
                  <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Cantidad
                  </TableHead>
                  <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Precio
                  </TableHead>
                  <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Subtotal
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plantilla.items.map((item: DetallePlantillaPedido) => (
                  <TableRow key={item.id} className="border-muted/30">
                    <TableCell>
                      <span className="text-sm font-medium">
                        {item.producto_nombre || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {item.producto_codigo ? (
                        <Badge
                          variant="outline"
                          className="font-mono text-xs"
                        >
                          {item.producto_codigo}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">
                          -
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.cantidad} {item.producto_unidad || ""}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(item.precio)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatCurrency(item.cantidad * item.precio)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

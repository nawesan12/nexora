"use client";

import { useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useConvenio, useDeleteConvenio } from "@/hooks/queries/use-convenios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, FileText, Trash2 } from "lucide-react";
import gsap from "gsap";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n);
}

export default function ConvenioDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: convenio, isLoading } = useConvenio(id);
  const deleteMutation = useDeleteConvenio();
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current || isLoading) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".conv-detail", { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: "power2.out" });
    }, containerRef);
    return () => ctx.revert();
  }, [isLoading]);

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(id);
    router.push("/compras/convenios");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!convenio) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-muted-foreground">Convenio no encontrado</p>
        <Button asChild variant="outline"><Link href="/compras/convenios">Volver</Link></Button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="conv-detail flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/compras/convenios"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
              <FileText className="h-5 w-5 text-[var(--accent)]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{convenio.nombre}</h1>
              <p className="text-sm text-muted-foreground">{convenio.proveedor_nombre}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleteMutation.isPending}>
            <Trash2 className="mr-1.5 h-4 w-4" />
            Eliminar
          </Button>
        </div>
      </div>

      {/* Info Card */}
      <Card className="conv-detail border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base">Informacion del Convenio</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Proveedor</p>
              <p className="mt-1 text-sm font-medium">{convenio.proveedor_nombre}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Fecha Inicio</p>
              <p className="mt-1 text-sm font-medium">
                {new Date(convenio.fecha_inicio + "T00:00:00").toLocaleDateString("es-AR")}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Fecha Fin</p>
              <p className="mt-1 text-sm font-medium">
                {convenio.fecha_fin ? new Date(convenio.fecha_fin + "T00:00:00").toLocaleDateString("es-AR") : "Indefinido"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Estado</p>
              <Badge className="mt-1" variant={convenio.activo ? "default" : "secondary"}>
                {convenio.activo ? "Activo" : "Inactivo"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card className="conv-detail border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">
            Productos ({convenio.items?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!convenio.items || convenio.items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Sin productos en este convenio</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Codigo</TableHead>
                  <TableHead className="text-right">Precio Convenido</TableHead>
                  <TableHead className="text-right">Cant. Minima</TableHead>
                  <TableHead className="text-right">Descuento %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {convenio.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.producto_nombre}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{item.producto_codigo || "-"}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{formatCurrency(item.precio_convenido)}</TableCell>
                    <TableCell className="text-right tabular-nums">{item.cantidad_minima}</TableCell>
                    <TableCell className="text-right tabular-nums">{item.descuento_porcentaje}%</TableCell>
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

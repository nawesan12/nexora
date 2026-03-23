"use client";

import { use, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { useMetaVenta, useDeleteMetaVenta } from "@/hooks/queries/use-metas-venta";
import { useUserStore } from "@/store/user-store";
import { hasPermission } from "@/lib/permissions";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Trash2, DollarSign, Calendar, User, Building2 } from "lucide-react";
import gsap from "gsap";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n);
}

function getProgressColor(p: number) {
  if (p >= 80) return "bg-emerald-500";
  if (p >= 50) return "bg-blue-500";
  return "bg-amber-500";
}

export default function MetaVentaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: m, isLoading } = useMetaVenta(id);
  const deleteMutation = useDeleteMetaVenta();
  const user = useUserStore((s) => s.user);
  const canManage = hasPermission(user?.permissions ?? [], "sales_targets:manage");

  const containerRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (isLoading || !m || !containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".detail-header", { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" });
      gsap.fromTo(".detail-card", { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, delay: 0.15, ease: "power3.out" });
    }, containerRef);
    return () => ctx.revert();
  }, [isLoading, m]);

  if (isLoading) return <div className="flex items-center justify-center py-20"><p className="text-muted-foreground">Cargando...</p></div>;
  if (!m) return <div className="flex items-center justify-center py-20"><p className="text-muted-foreground">Meta no encontrada</p></div>;

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="detail-header space-y-4">
        <Link href="/administracion/metas-venta" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />Metas de Venta
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{m.nombre}</h1>
              <Badge variant="secondary" className={`border-0 text-xs font-medium ${m.tipo === "EMPLEADO" ? "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400" : "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400"}`}>{m.tipo}</Badge>
            </div>
          </div>
          {canManage && (
            <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(id, { onSuccess: () => router.push("/administracion/metas-venta") })} disabled={deleteMutation.isPending}>
              <Trash2 className="mr-2 h-4 w-4" />Eliminar
            </Button>
          )}
        </div>
      </div>

      {/* Progress visualization */}
      <Card className="detail-card border-0 shadow-sm">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Progreso</span>
              <span className="text-2xl font-bold">{m.progreso}%</span>
            </div>
            <div className="h-4 rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full transition-all ${getProgressColor(m.progreso)}`} style={{ width: `${Math.min(m.progreso, 100)}%` }} />
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Actual: {formatCurrency(m.monto_actual)}</span>
              <span>Objetivo: {formatCurrency(m.monto_objetivo)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="detail-card border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/50"><DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /></div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Objetivo</p>
                <p className="font-medium">{formatCurrency(m.monto_objetivo)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="detail-card border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/50">{m.tipo === "EMPLEADO" ? <User className="h-5 w-5 text-blue-600 dark:text-blue-400" /> : <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />}</div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{m.tipo === "EMPLEADO" ? "Empleado" : "Sucursal"}</p>
                <p className="font-medium truncate">{m.empleado_nombre || m.sucursal_nombre || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="detail-card border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-950/50"><Calendar className="h-5 w-5 text-teal-600 dark:text-teal-400" /></div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Periodo</p>
                <p className="font-medium">{m.fecha_inicio ? new Date(m.fecha_inicio + "T00:00:00").toLocaleDateString("es-AR") : ""} - {m.fecha_fin ? new Date(m.fecha_fin + "T00:00:00").toLocaleDateString("es-AR") : ""}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { use, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { useMantenimiento } from "@/hooks/queries/use-mantenimientos";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Truck, Calendar, DollarSign, FileText, Building2 } from "lucide-react";
import gsap from "gsap";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n);
}

export default function MantenimientoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: m, isLoading } = useMantenimiento(id);

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
  if (!m) return <div className="flex items-center justify-center py-20"><p className="text-muted-foreground">Mantenimiento no encontrado</p></div>;

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="detail-header space-y-4">
        <Link href="/logistica/mantenimientos" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />Mantenimientos
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{m.tipo}</h1>
            <Badge variant="outline" className="font-mono text-xs">{m.vehiculo_patente}</Badge>
          </div>
          <p className="text-muted-foreground mt-1">{m.fecha ? new Date(m.fecha + "T00:00:00").toLocaleDateString("es-AR", { year: "numeric", month: "long", day: "numeric" }) : ""}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="detail-card border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/50"><Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" /></div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Vehiculo</p>
                <p className="font-medium truncate">{m.vehiculo_patente}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="detail-card border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/50"><DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /></div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Costo</p>
                <p className="font-medium">{m.costo ? formatCurrency(m.costo) : "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="detail-card border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-950/50"><Calendar className="h-5 w-5 text-teal-600 dark:text-teal-400" /></div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Proximo Servicio</p>
                <p className="font-medium">{m.proximo_fecha ? new Date(m.proximo_fecha + "T00:00:00").toLocaleDateString("es-AR") : "-"}</p>
                {m.proximo_km != null && m.proximo_km > 0 && <p className="text-xs text-muted-foreground">{m.proximo_km.toLocaleString("es-AR")} km</p>}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="detail-card border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/50"><Building2 className="h-5 w-5 text-amber-600 dark:text-amber-400" /></div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Proveedor</p>
                <p className="font-medium truncate">{m.proveedor || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {m.numero_factura && (
          <Card className="detail-card border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-950/50"><FileText className="h-5 w-5 text-cyan-600 dark:text-cyan-400" /></div>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Factura</p>
                  <p className="font-medium truncate">{m.numero_factura}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {m.descripcion && (
        <Card className="detail-card border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Descripcion</p>
            <p className="text-sm">{m.descripcion}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

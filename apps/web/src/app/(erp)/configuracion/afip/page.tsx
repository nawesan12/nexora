"use client";

import { useState, useRef, useLayoutEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { afipConfigSchema, type AfipConfigInput } from "@nexora/shared/schemas";
import { useBranches } from "@/hooks/queries/use-branches";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { afipApi } from "@/lib/afip";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { FileCheck, Building2, Plug, Save, CheckCircle, XCircle } from "lucide-react";
import gsap from "gsap";

export default function AfipConfigPage() {
  const [selectedSucursal, setSelectedSucursal] = useState<string | null>(null);
  const { data: branchData } = useBranches();
  const branches = branchData?.data || [];
  const queryClient = useQueryClient();

  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ["afip-config", selectedSucursal],
    queryFn: () => afipApi.getConfig(selectedSucursal!),
    enabled: !!selectedSucursal,
  });

  const saveMutation = useMutation({
    mutationFn: (data: AfipConfigInput) => afipApi.saveConfig(selectedSucursal!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["afip-config"] });
      toast.success("Configuracion AFIP guardada");
    },
    onError: () => toast.error("Error al guardar configuracion AFIP"),
  });

  const testMutation = useMutation({
    mutationFn: () => afipApi.testConnection(selectedSucursal!),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    },
    onError: () => toast.error("Error al probar conexion"),
  });

  const form = useForm<AfipConfigInput>({
    resolver: zodResolver(afipConfigSchema),
    defaultValues: { cuit: "", punto_venta: 1, modo: "TESTING", activo: false },
  });

  // Update form when config loads
  const prevSucursal = useRef<string | null>(null);
  if (config && selectedSucursal !== prevSucursal.current) {
    prevSucursal.current = selectedSucursal;
    form.reset({
      cuit: config.cuit || "",
      punto_venta: config.punto_venta || 1,
      modo: config.modo || "TESTING",
      activo: config.activo || false,
    });
  }

  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".afip-header", { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" });
      gsap.fromTo(".afip-content", { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.15 });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="afip-header space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">AFIP</h1>
        <p className="text-sm text-muted-foreground">
          Configuracion de facturacion electronica AFIP por sucursal
        </p>
      </div>

      <div className="afip-content grid gap-6 lg:grid-cols-3">
        {/* Sucursales list */}
        <Card className="border-0 shadow-sm lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Sucursales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {branches.length === 0 && (
              <p className="text-sm text-muted-foreground">No hay sucursales configuradas</p>
            )}
            {branches.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedSucursal(b.id)}
                className={`w-full text-left rounded-lg border p-3 transition-colors ${
                  selectedSucursal === b.id
                    ? "border-[var(--accent)] bg-[var(--accent)]/5"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{b.nombre}</span>
                  <Badge variant="outline" className="text-xs">
                    <FileCheck className="mr-1 h-3 w-3" />
                    Config
                  </Badge>
                </div>
                {b.direccion && (
                  <p className="text-xs text-muted-foreground mt-1">{b.direccion}</p>
                )}
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Config form */}
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileCheck className="h-4 w-4" /> Configuracion AFIP
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedSucursal ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Selecciona una sucursal para configurar AFIP
              </p>
            ) : configLoading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Cargando...</p>
            ) : (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit((data) => saveMutation.mutate(data))}
                  className="space-y-4"
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField control={form.control} name="cuit" render={({ field }) => (
                      <FormItem>
                        <FormLabel>CUIT</FormLabel>
                        <FormControl>
                          <Input placeholder="20-12345678-9" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="punto_venta" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Punto de Venta</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} max={99999} {...field}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 1)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="modo" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="TESTING">Testing (Homologacion)</SelectItem>
                          <SelectItem value="PRODUCCION">Produccion</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="activo" render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Activo</FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Habilitar facturacion electronica para esta sucursal
                        </p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )} />

                  <div className="flex gap-3 pt-2">
                    <Button type="submit" disabled={saveMutation.isPending}>
                      <Save className="mr-2 h-4 w-4" />
                      {saveMutation.isPending ? "Guardando..." : "Guardar"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => testMutation.mutate()}
                      disabled={testMutation.isPending}
                    >
                      <Plug className="mr-2 h-4 w-4" />
                      {testMutation.isPending ? "Probando..." : "Probar Conexion"}
                    </Button>
                  </div>

                  {testMutation.data && (
                    <div className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
                      testMutation.data.success
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                        : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                    }`}>
                      {testMutation.data.success
                        ? <CheckCircle className="h-4 w-4" />
                        : <XCircle className="h-4 w-4" />}
                      {testMutation.data.message}
                    </div>
                  )}
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useLayoutEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { configuracionEmpresaSchema, condicionIvaValues, type ConfiguracionEmpresaInput } from "@pronto/shared/schemas";
import { useConfiguracionEmpresa, useUpsertConfiguracionEmpresa } from "@/hooks/queries/use-empresa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Building, Loader2 } from "lucide-react";
import gsap from "gsap";

const CONDICION_IVA_LABELS: Record<string, string> = {
  RESPONSABLE_INSCRIPTO: "Responsable Inscripto",
  MONOTRIBUTO: "Monotributo",
  EXENTO: "Exento",
  NO_RESPONSABLE: "No Responsable",
  CONSUMIDOR_FINAL: "Consumidor Final",
};

export default function EmpresaPage() {
  const { data, isLoading } = useConfiguracionEmpresa();
  const upsertMutation = useUpsertConfiguracionEmpresa();

  const form = useForm<ConfiguracionEmpresaInput>({
    resolver: zodResolver(configuracionEmpresaSchema),
    defaultValues: {
      razon_social: "",
      cuit: "",
      condicion_iva: "",
      direccion: "",
      telefono: "",
      email: "",
      logo_url: "",
      pie_factura: "",
    },
  });

  useEffect(() => {
    if (data) {
      form.reset({
        razon_social: data.razon_social || "",
        cuit: data.cuit || "",
        condicion_iva: (data.condicion_iva || "") as any,
        direccion: data.direccion || "",
        telefono: data.telefono || "",
        email: data.email || "",
        logo_url: data.logo_url || "",
        pie_factura: data.pie_factura || "",
      });
    }
  }, [data, form]);

  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".empresa-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      );
      gsap.fromTo(
        ".empresa-card",
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.15 },
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const onSubmit = form.handleSubmit((formData) => {
    upsertMutation.mutate(formData);
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Cargando configuracion...</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-5">
      <div className="empresa-header">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
            <Building className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Configuracion de Empresa
            </h1>
            <p className="text-sm text-muted-foreground">
              Datos generales de la empresa
            </p>
          </div>
        </div>
      </div>

      <Card className="empresa-card max-w-lg border-0 shadow-sm">
        <CardContent className="pt-6">
          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Datos de la Empresa
              </h3>
              <Separator className="mt-2 mb-4" />
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="razon_social">Razon Social</Label>
                  <Input
                    id="razon_social"
                    {...form.register("razon_social")}
                    placeholder="Nombre de la empresa"
                  />
                  {form.formState.errors.razon_social && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.razon_social.message}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cuit">CUIT</Label>
                    <Input
                      id="cuit"
                      {...form.register("cuit")}
                      placeholder="20-12345678-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Condicion IVA</Label>
                    <Select
                      value={form.watch("condicion_iva") || ""}
                      onValueChange={(v) => form.setValue("condicion_iva", v as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {condicionIvaValues.map((v) => (
                          <SelectItem key={v} value={v}>
                            {CONDICION_IVA_LABELS[v] || v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground">Contacto</h3>
              <Separator className="mt-2 mb-4" />
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="direccion">Direccion</Label>
                  <Input
                    id="direccion"
                    {...form.register("direccion")}
                    placeholder="Direccion de la empresa"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Telefono</Label>
                    <Input
                      id="telefono"
                      {...form.register("telefono")}
                      placeholder="+54 11 1234-5678"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...form.register("email")}
                      placeholder="contacto@empresa.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Facturacion
              </h3>
              <Separator className="mt-2 mb-4" />
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="logo_url">URL del Logo</Label>
                  <Input
                    id="logo_url"
                    {...form.register("logo_url")}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pie_factura">Pie de Factura</Label>
                  <Textarea
                    id="pie_factura"
                    {...form.register("pie_factura")}
                    placeholder="Texto al pie de las facturas..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={upsertMutation.isPending}>
                {upsertMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Guardar configuracion
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

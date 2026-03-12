"use client";

import { useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { proveedorSchema, type ProveedorInput } from "@nexora/shared/schemas";
import { useCreateProveedor } from "@/hooks/queries/use-suppliers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { ArrowLeft, Building2, Loader2 } from "lucide-react";
import gsap from "gsap";

const CONDICION_IVA_OPTIONS = [
  { value: "RESPONSABLE_INSCRIPTO", label: "Responsable Inscripto" },
  { value: "MONOTRIBUTO", label: "Monotributo" },
  { value: "EXENTO", label: "Exento" },
  { value: "NO_RESPONSABLE", label: "No Responsable" },
  { value: "CONSUMIDOR_FINAL", label: "Consumidor Final" },
] as const;

export default function NuevoProveedorPage() {
  const router = useRouter();
  const createMutation = useCreateProveedor();

  const form = useForm<ProveedorInput>({
    resolver: zodResolver(proveedorSchema),
    defaultValues: {
      nombre: "",
      cuit: "",
      condicion_iva: undefined,
      email: "",
      telefono: "",
      contacto: "",
      direccion: "",
      banco: "",
      cbu: "",
      alias: "",
      notas: "",
    },
  });

  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".nuevo-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      );

      gsap.fromTo(
        ".nuevo-card",
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: "power2.out", delay: 0.2 },
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const onSubmit = (data: ProveedorInput) => {
    createMutation.mutate(data, {
      onSuccess: (result) => {
        const newId = result?.id;
        if (newId) {
          router.push(`/compras/proveedores/${newId}`);
        } else {
          router.push("/compras/proveedores");
        }
      },
    });
  };

  return (
    <div ref={containerRef} className="mx-auto max-w-2xl space-y-5">
      {/* Header */}
      <div className="nuevo-header space-y-3">
        <Link
          href="/compras/proveedores"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a proveedores
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Nuevo Proveedor
            </h1>
            <p className="text-sm text-muted-foreground">
              Completa los datos para registrar un nuevo proveedor
            </p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* General Info */}
        <Card className="nuevo-card border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Informacion General
            </CardTitle>
            <CardDescription>
              Datos principales del proveedor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="nombre">
                  Nombre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nombre"
                  placeholder="Nombre o razon social del proveedor"
                  {...form.register("nombre")}
                />
                {form.formState.errors.nombre && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.nombre.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cuit">CUIT</Label>
                <Input
                  id="cuit"
                  placeholder="20-12345678-9"
                  {...form.register("cuit")}
                />
                {form.formState.errors.cuit && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.cuit.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="condicion_iva">Condicion IVA</Label>
                <Select
                  value={form.watch("condicion_iva") || ""}
                  onValueChange={(value) =>
                    form.setValue("condicion_iva", value as ProveedorInput["condicion_iva"], {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger id="condicion_iva">
                    <SelectValue placeholder="Seleccionar condicion" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDICION_IVA_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.condicion_iva && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.condicion_iva.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="proveedor@ejemplo.com"
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono">Telefono</Label>
                <Input
                  id="telefono"
                  placeholder="+54 11 1234-5678"
                  {...form.register("telefono")}
                />
                {form.formState.errors.telefono && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.telefono.message}
                  </p>
                )}
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="contacto">Persona de contacto</Label>
                <Input
                  id="contacto"
                  placeholder="Nombre del contacto principal"
                  {...form.register("contacto")}
                />
                {form.formState.errors.contacto && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.contacto.message}
                  </p>
                )}
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="direccion">Direccion</Label>
                <Textarea
                  id="direccion"
                  placeholder="Direccion completa del proveedor"
                  rows={2}
                  {...form.register("direccion")}
                />
                {form.formState.errors.direccion && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.direccion.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Banking */}
        <Card className="nuevo-card border-0 shadow-sm mt-5">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Datos Bancarios
            </CardTitle>
            <CardDescription>
              Informacion para pagos y transferencias
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="banco">Banco</Label>
                <Input
                  id="banco"
                  placeholder="Nombre del banco"
                  {...form.register("banco")}
                />
                {form.formState.errors.banco && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.banco.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cbu">CBU</Label>
                <Input
                  id="cbu"
                  placeholder="0000000000000000000000"
                  {...form.register("cbu")}
                />
                {form.formState.errors.cbu && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.cbu.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="alias">Alias</Label>
                <Input
                  id="alias"
                  placeholder="alias.de.cuenta"
                  {...form.register("alias")}
                />
                {form.formState.errors.alias && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.alias.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="nuevo-card border-0 shadow-sm mt-5">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              id="notas"
              placeholder="Observaciones o notas adicionales sobre el proveedor"
              rows={3}
              {...form.register("notas")}
            />
            {form.formState.errors.notas && (
              <p className="text-sm text-destructive">
                {form.formState.errors.notas.message}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-5">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/compras/proveedores")}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Crear Proveedor
          </Button>
        </div>
      </form>
    </div>
  );
}

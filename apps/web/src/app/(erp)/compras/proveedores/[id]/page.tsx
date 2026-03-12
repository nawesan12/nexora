"use client";

import { use, useRef, useLayoutEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { proveedorSchema, type ProveedorInput } from "@nexora/shared/schemas";
import {
  useProveedor,
  useUpdateProveedor,
  useDeleteProveedor,
} from "@/hooks/queries/use-suppliers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { ArrowLeft, Pencil, Trash2, Building2, Loader2 } from "lucide-react";
import gsap from "gsap";

const CONDICION_IVA_LABELS: Record<string, string> = {
  RESPONSABLE_INSCRIPTO: "Responsable Inscripto",
  MONOTRIBUTO: "Monotributo",
  EXENTO: "Exento",
  NO_RESPONSABLE: "No Responsable",
  CONSUMIDOR_FINAL: "Consumidor Final",
};

const CONDICION_IVA_OPTIONS = [
  { value: "RESPONSABLE_INSCRIPTO", label: "Responsable Inscripto" },
  { value: "MONOTRIBUTO", label: "Monotributo" },
  { value: "EXENTO", label: "Exento" },
  { value: "NO_RESPONSABLE", label: "No Responsable" },
  { value: "CONSUMIDOR_FINAL", label: "Consumidor Final" },
] as const;

const IVA_COLORS: Record<string, string> = {
  RESPONSABLE_INSCRIPTO:
    "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400",
  MONOTRIBUTO:
    "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400",
  EXENTO:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  NO_RESPONSABLE:
    "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400",
  CONSUMIDOR_FINAL:
    "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400",
};

export default function ProveedorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const { data: proveedor, isLoading } = useProveedor(id);
  const updateMutation = useUpdateProveedor();
  const deleteMutation = useDeleteProveedor();

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const form = useForm<ProveedorInput>({
    resolver: zodResolver(proveedorSchema),
    values: proveedor
      ? {
          nombre: proveedor.nombre || "",
          cuit: proveedor.cuit || "",
          condicion_iva: proveedor.condicion_iva as ProveedorInput["condicion_iva"],
          email: proveedor.email || "",
          telefono: proveedor.telefono || "",
          contacto: proveedor.contacto || "",
          direccion: proveedor.direccion || "",
          banco: proveedor.banco || "",
          cbu: proveedor.cbu || "",
          alias: proveedor.alias || "",
          notas: proveedor.notas || "",
        }
      : undefined,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current || isLoading) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".detail-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" },
      );

      gsap.fromTo(
        ".detail-card",
        { y: 15, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.4,
          stagger: 0.08,
          delay: 0.15,
          ease: "power3.out",
        },
      );
    }, containerRef);

    return () => ctx.revert();
  }, [isLoading, proveedor]);

  const onSubmit = (data: ProveedorInput) => {
    updateMutation.mutate(
      { id, data },
      {
        onSuccess: () => setIsEditing(false),
      },
    );
  };

  const handleDelete = () => {
    deleteMutation.mutate(id, {
      onSuccess: () => router.push("/compras/proveedores"),
    });
    setShowDeleteDialog(false);
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="space-y-3">
          <Skeleton className="h-5 w-40" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-4 w-36" />
            </div>
          </div>
        </div>
        <Skeleton className="h-[300px] w-full rounded-lg" />
        <Skeleton className="h-[200px] w-full rounded-lg" />
      </div>
    );
  }

  if (!proveedor) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <Link
          href="/compras/proveedores"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a proveedores
        </Link>
        <div className="flex flex-col items-center gap-2 py-20">
          <p className="font-medium text-foreground">
            Proveedor no encontrado
          </p>
          <p className="text-sm text-muted-foreground">
            El proveedor que buscas no existe o fue eliminado
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="mx-auto max-w-2xl space-y-5">
      {/* Header */}
      <div className="detail-header space-y-3">
        <Link
          href="/compras/proveedores"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a proveedores
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  {proveedor.nombre}
                </h1>
                {proveedor.cuit && (
                  <Badge variant="outline" className="font-mono text-xs">
                    {proveedor.cuit}
                  </Badge>
                )}
              </div>
              {proveedor.condicion_iva && (
                <Badge
                  variant="secondary"
                  className={`mt-1 border-0 text-xs font-medium ${IVA_COLORS[proveedor.condicion_iva] || ""}`}
                >
                  {CONDICION_IVA_LABELS[proveedor.condicion_iva] || proveedor.condicion_iva}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={isEditing ? "secondary" : "outline"}
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              {isEditing ? "Cancelar edicion" : "Editar"}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          </div>
        </div>
      </div>

      {isEditing ? (
        /* Edit Form */
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* General Info */}
          <Card className="detail-card border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Informacion General
              </CardTitle>
              <CardDescription>
                Modifica los datos del proveedor
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
                      form.setValue(
                        "condicion_iva",
                        value as ProveedorInput["condicion_iva"],
                        { shouldValidate: true },
                      )
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
          <Card className="detail-card border-0 shadow-sm mt-5">
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
          <Card className="detail-card border-0 shadow-sm mt-5">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Notas</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                id="notas"
                placeholder="Observaciones o notas adicionales"
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
              onClick={() => setIsEditing(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Guardar Cambios
            </Button>
          </div>
        </form>
      ) : (
        /* Read-only View */
        <>
          {/* General Info */}
          <Card className="detail-card border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Informacion General
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-5 text-sm">
                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Nombre
                  </span>
                  <p className="font-medium mt-1">{proveedor.nombre}</p>
                </div>
                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    CUIT
                  </span>
                  <p className="font-medium mt-1 font-mono">
                    {proveedor.cuit || "\u2014"}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Condicion IVA
                  </span>
                  <p className="font-medium mt-1">
                    {proveedor.condicion_iva
                      ? CONDICION_IVA_LABELS[proveedor.condicion_iva] || proveedor.condicion_iva
                      : "\u2014"}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Email
                  </span>
                  <p className="font-medium mt-1">
                    {proveedor.email || "\u2014"}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Telefono
                  </span>
                  <p className="font-medium mt-1">
                    {proveedor.telefono || "\u2014"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="detail-card border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Contacto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Persona de contacto
                </span>
                <p className="font-medium mt-1">
                  {proveedor.contacto || "\u2014"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card className="detail-card border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Direccion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                <p className="font-medium">
                  {proveedor.direccion || "\u2014"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Banking */}
          <Card className="detail-card border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Datos Bancarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-5 text-sm">
                <div className="col-span-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Banco
                  </span>
                  <p className="font-medium mt-1">
                    {proveedor.banco || "\u2014"}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    CBU
                  </span>
                  <p className="font-medium mt-1 font-mono">
                    {proveedor.cbu || "\u2014"}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Alias
                  </span>
                  <p className="font-medium mt-1">
                    {proveedor.alias || "\u2014"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {proveedor.notas && (
            <Card className="detail-card border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Notas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{proveedor.notas}</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar proveedor</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. El proveedor
              &ldquo;{proveedor.nombre}&rdquo; sera desactivado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

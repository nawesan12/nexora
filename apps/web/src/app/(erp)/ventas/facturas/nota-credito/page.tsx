"use client";

import { useRef, useLayoutEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createManualComprobanteSchema,
  type CreateManualComprobanteInput,
} from "@pronto/shared/schemas";
import { useCreateFacturaManual } from "@/hooks/queries/use-invoices";
import { useFacturas } from "@/hooks/queries/use-invoices";
import { useClientes } from "@/hooks/queries/use-clients";
import { useBranches } from "@/hooks/queries/use-branches";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import gsap from "gsap";

const LETRA_OPTIONS = [
  { value: "A", label: "A" },
  { value: "B", label: "B" },
  { value: "N", label: "N" },
  { value: "X", label: "X" },
] as const;

const CONDICION_PAGO_OPTIONS = [
  { value: "CONTADO", label: "Contado" },
  { value: "CUENTA_CORRIENTE", label: "Cuenta Corriente" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
  { value: "OTRO", label: "Otro" },
] as const;

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(n);
}

export default function NotaCreditoPage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const createMutation = useCreateFacturaManual();

  const { data: facturasData } = useFacturas({
    page: 1,
    pageSize: 100,
    estado: "EMITIDO",
  });
  const { data: clientesData } = useClientes({ page: 1, pageSize: 200 });
  const { data: branchesData } = useBranches();

  const facturas = facturasData?.data ?? [];
  const clientes = clientesData?.data ?? [];
  const branches = branchesData?.data ?? [];

  const [selectedFacturaId, setSelectedFacturaId] = useState("");

  const selectedFactura = useMemo(
    () => facturas.find((f) => f.id === selectedFacturaId),
    [facturas, selectedFacturaId],
  );

  const form = useForm<CreateManualComprobanteInput>({
    resolver: zodResolver(createManualComprobanteSchema),
    defaultValues: {
      tipo: "NOTA_CREDITO",
      letra: "A",
      cliente_id: "",
      sucursal_id: "",
      condicion_pago: "CONTADO",
      observaciones: "",
      items: [
        {
          producto_id: "",
          nombre: "",
          codigo: "",
          unidad: "UN",
          cantidad: 1,
          precio_unitario: 0,
          descuento_porcentaje: 0,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = form.watch("items");
  const subtotal = useMemo(() => {
    return watchedItems.reduce((sum, item) => {
      const lineTotal =
        (item.cantidad || 0) *
        (item.precio_unitario || 0) *
        (1 - (item.descuento_porcentaje || 0) / 100);
      return sum + lineTotal;
    }, 0);
  }, [watchedItems]);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".nc-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      );
      gsap.fromTo(
        ".nc-card",
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.4,
          stagger: 0.08,
          delay: 0.15,
          ease: "power2.out",
        },
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  // When a factura is selected, pre-fill the letra
  const handleFacturaSelect = (facturaId: string) => {
    setSelectedFacturaId(facturaId);
    const factura = facturas.find((f) => f.id === facturaId);
    if (factura) {
      form.setValue("letra", factura.letra as "A" | "B" | "N" | "X");
    }
  };

  const onSubmit = (data: CreateManualComprobanteInput) => {
    // Ensure tipo is always NOTA_CREDITO
    const payload = {
      ...data,
      tipo: "NOTA_CREDITO" as const,
      observaciones: data.observaciones
        ? selectedFacturaId
          ? `Ref. Factura: ${selectedFactura?.numero || selectedFacturaId}. ${data.observaciones}`
          : data.observaciones
        : selectedFacturaId
          ? `Ref. Factura: ${selectedFactura?.numero || selectedFacturaId}`
          : "",
    };
    createMutation.mutate(payload, {
      onSuccess: () => router.push("/ventas/facturas"),
    });
  };

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="nc-header space-y-4">
        <Link
          href="/ventas/facturas"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Facturas
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Nueva Nota de Credito
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Crea una nota de credito, opcionalmente vinculada a una factura
            existente
          </p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Reference factura (optional) */}
            <Card className="nc-card border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Factura de Referencia
                </CardTitle>
                <CardDescription>
                  Selecciona la factura original (opcional)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select
                  value={selectedFacturaId || "none"}
                  onValueChange={(v) =>
                    handleFacturaSelect(v === "none" ? "" : v)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sin factura de referencia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      Sin factura de referencia
                    </SelectItem>
                    {facturas
                      .filter((f) => f.tipo === "FACTURA")
                      .map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.numero} - {f.cliente_nombre} -{" "}
                          {formatCurrency(f.total)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* General info */}
            <Card className="nc-card border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Datos Generales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Letra
                    </Label>
                    <Select
                      value={form.watch("letra")}
                      onValueChange={(v) =>
                        form.setValue(
                          "letra",
                          v as "A" | "B" | "N" | "X",
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LETRA_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.letra && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.letra.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Condicion de Pago
                    </Label>
                    <Select
                      value={form.watch("condicion_pago")}
                      onValueChange={(v) =>
                        form.setValue("condicion_pago", v as CreateManualComprobanteInput["condicion_pago"])
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONDICION_PAGO_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Cliente
                    </Label>
                    <Select
                      value={form.watch("cliente_id") || "none"}
                      onValueChange={(v) =>
                        form.setValue("cliente_id", v === "none" ? "" : v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" disabled>
                          Seleccionar cliente
                        </SelectItem>
                        {clientes.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.cliente_id && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.cliente_id.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Sucursal
                    </Label>
                    <Select
                      value={form.watch("sucursal_id") || "none"}
                      onValueChange={(v) =>
                        form.setValue("sucursal_id", v === "none" ? "" : v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar sucursal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" disabled>
                          Seleccionar sucursal
                        </SelectItem>
                        {branches.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.sucursal_id && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.sucursal_id.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Motivo / Observaciones
                  </Label>
                  <Textarea
                    {...form.register("observaciones")}
                    placeholder="Motivo de la nota de credito..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Items */}
            <Card className="nc-card border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">
                    Items ({fields.length})
                  </CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      append({
                        producto_id: "",
                        nombre: "",
                        codigo: "",
                        unidad: "UN",
                        cantidad: 1,
                        precio_unitario: 0,
                        descuento_porcentaje: 0,
                      })
                    }
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Agregar Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-12 items-end gap-3 rounded-lg border border-border/50 p-4"
                    >
                      <div className="col-span-4 space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          Nombre
                        </Label>
                        <Input
                          {...form.register(`items.${index}.nombre`)}
                          placeholder="Producto o concepto"
                        />
                        {form.formState.errors.items?.[index]?.nombre && (
                          <p className="text-xs text-destructive">
                            {form.formState.errors.items[index].nombre?.message}
                          </p>
                        )}
                      </div>
                      <div className="col-span-1 space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          Unidad
                        </Label>
                        <Input
                          {...form.register(`items.${index}.unidad`)}
                          placeholder="UN"
                        />
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          Cantidad
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          {...form.register(`items.${index}.cantidad`, {
                            valueAsNumber: true,
                          })}
                        />
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          Precio Unit.
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          {...form.register(
                            `items.${index}.precio_unitario`,
                            { valueAsNumber: true },
                          )}
                        />
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          Dto %
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          {...form.register(
                            `items.${index}.descuento_porcentaje`,
                            { valueAsNumber: true },
                          )}
                        />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground hover:text-destructive"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {form.formState.errors.items && !Array.isArray(form.formState.errors.items) && (
                  <p className="mt-2 text-xs text-destructive">
                    {form.formState.errors.items.message}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar summary */}
          <div className="nc-card space-y-4">
            <Card className="border-0 shadow-sm sticky top-6">
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Resumen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipo</span>
                  <span className="font-medium">Nota de Credito</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Letra</span>
                  <span className="font-medium">{form.watch("letra")}</span>
                </div>
                {selectedFactura && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ref. Factura</span>
                    <span className="font-medium font-mono text-xs">
                      {selectedFactura.numero}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items</span>
                  <span className="font-medium">{fields.length}</span>
                </div>
                <div className="flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span className="tabular-nums">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <Separator />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    "Crear Nota de Credito"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

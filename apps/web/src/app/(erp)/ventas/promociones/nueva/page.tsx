"use client";

import { useEffect, useRef, useLayoutEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { promocionSchema, type PromocionInput } from "@pronto/shared/schemas";
import {
  useCreatePromocion,
  useUpdatePromocion,
  usePromocion,
} from "@/hooks/queries/use-promociones";
import { useUserStore } from "@/store/user-store";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import gsap from "gsap";

const TIPO_OPTIONS = [
  { value: "PORCENTAJE", label: "Porcentaje" },
  { value: "MONTO_FIJO", label: "Monto Fijo" },
  { value: "CANTIDAD_MINIMA", label: "Cantidad Minima" },
  { value: "COMBO", label: "Combo" },
];

export default function NuevaPromocionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const user = useUserStore((s) => s.user);
  const sucursales = user?.sucursales || [];

  const { data: existing } = usePromocion(editId || "");
  const createMutation = useCreatePromocion();
  const updateMutation = useUpdatePromocion();

  const form = useForm<PromocionInput>({
    resolver: zodResolver(promocionSchema),
    defaultValues: {
      nombre: "",
      tipo: "PORCENTAJE",
      valor: 0,
      cantidad_minima: undefined,
      producto_id: "",
      categoria_id: "",
      fecha_inicio: "",
      fecha_fin: "",
      activa: true,
      sucursal_id: "",
    },
  });

  const tipo = form.watch("tipo");

  useEffect(() => {
    if (existing && editId) {
      form.reset({
        nombre: existing.nombre,
        tipo: existing.tipo as PromocionInput["tipo"],
        valor: existing.valor,
        cantidad_minima: existing.cantidad_minima ?? undefined,
        producto_id: existing.producto_id || "",
        categoria_id: existing.categoria_id || "",
        fecha_inicio: existing.fecha_inicio,
        fecha_fin: existing.fecha_fin,
        activa: existing.activa,
        sucursal_id: existing.sucursal_id || "",
      });
    }
  }, [existing, editId, form]);

  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".promo-form",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" },
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const handleSubmit = (data: PromocionInput) => {
    const payload = {
      ...data,
      producto_id: data.producto_id || undefined,
      categoria_id: data.categoria_id || undefined,
      sucursal_id: data.sucursal_id || undefined,
      cantidad_minima: data.cantidad_minima || undefined,
    };

    if (editId) {
      updateMutation.mutate(
        { id: editId, data: payload },
        { onSuccess: () => router.push("/ventas/promociones") },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => router.push("/ventas/promociones"),
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/ventas/promociones">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {editId ? "Editar Promocion" : "Nueva Promocion"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {editId
              ? "Modifica los datos de la promocion"
              : "Configura un descuento, oferta o combo"}
          </p>
        </div>
      </div>

      <Card className="promo-form max-w-2xl">
        <CardHeader>
          <CardTitle>Datos de la Promocion</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: 10% OFF Bebidas"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TIPO_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="valor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {tipo === "PORCENTAJE" ? "Porcentaje (%)" : "Monto ($)"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder={tipo === "PORCENTAJE" ? "10" : "500"}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {(tipo === "NXM" || tipo === "2X1") && (
                <FormField
                  control={form.control}
                  name="cantidad_minima"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cantidad Minima</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="3"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="producto_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Producto ID (opcional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="UUID del producto (dejar vacio para todos)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoria_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria Producto ID (opcional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="UUID de la categoria (dejar vacio para todas)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fecha_inicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha Inicio</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fecha_fin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha Fin</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="sucursal_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sucursal (opcional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Todas las sucursales" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Todas</SelectItem>
                        {sucursales.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="activa"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Activa</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        La promocion se aplicara cuando este activa
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3">
                <Button variant="outline" asChild>
                  <Link href="/ventas/promociones">Cancelar</Link>
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {editId ? "Actualizar" : "Crear Promocion"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

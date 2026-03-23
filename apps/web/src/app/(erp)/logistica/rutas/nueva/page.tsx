"use client";

import { useState, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateRuta } from "@/hooks/queries/use-rutas";
import { useVehiculos, useZonas } from "@/hooks/queries/use-logistics";
import { useBranches } from "@/hooks/queries/use-branches";
import { useClientes } from "@/hooks/queries/use-clients";
import { useDirecciones } from "@/hooks/queries/use-clients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { ArrowLeft, Route, MapPin, Plus, Trash2 } from "lucide-react";
import gsap from "gsap";

const paradaSchema = z.object({
  cliente_id: z.string().min(1, "Selecciona un cliente"),
  direccion_id: z.string().optional(),
  tiempo_estimado_minutos: z.coerce.number().min(1, "Minimo 1 minuto"),
  notas: z.string().optional(),
  orden: z.coerce.number().min(1),
});

const rutaFormSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  sucursal_id: z.string().min(1, "Selecciona una sucursal"),
  zona_id: z.string().optional(),
  vehiculo_id: z.string().optional(),
  dia_semana: z.string().optional(),
  hora_salida_estimada: z.string().optional(),
  notas: z.string().optional(),
  paradas: z.array(paradaSchema),
});

type RutaFormInput = z.infer<typeof rutaFormSchema>;

const DIA_SEMANA_OPTIONS = [
  { value: "0", label: "Domingo" },
  { value: "1", label: "Lunes" },
  { value: "2", label: "Martes" },
  { value: "3", label: "Miercoles" },
  { value: "4", label: "Jueves" },
  { value: "5", label: "Viernes" },
  { value: "6", label: "Sabado" },
];

function ParadaDireccionSelect({
  clienteId,
  value,
  onChange,
}: {
  clienteId: string;
  value?: string;
  onChange: (val: string) => void;
}) {
  const { data: direccionesData } = useDirecciones(clienteId);
  const direcciones = (direccionesData as Array<{
    id: string;
    calle: string;
    numero?: string;
    ciudad?: string;
  }>) || [];

  return (
    <Select onValueChange={onChange} value={value || ""}>
      <SelectTrigger>
        <SelectValue placeholder="Seleccionar direccion" />
      </SelectTrigger>
      <SelectContent>
        {direcciones.map((d) => (
          <SelectItem key={d.id} value={d.id}>
            {[d.calle, d.numero, d.ciudad].filter(Boolean).join(" ")}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function NuevaRutaPage() {
  const router = useRouter();
  const createMutation = useCreateRuta();
  const containerRef = useRef<HTMLDivElement>(null);

  const form = useForm<RutaFormInput>({
    resolver: zodResolver(rutaFormSchema),
    defaultValues: {
      nombre: "",
      sucursal_id: "",
      zona_id: "",
      vehiculo_id: "",
      dia_semana: "",
      hora_salida_estimada: "",
      notas: "",
      paradas: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "paradas",
  });

  const { data: vehiculosData } = useVehiculos({ page: 1, pageSize: 100 });
  const { data: zonasData } = useZonas({ page: 1, pageSize: 100 });
  const { data: branchesData } = useBranches();
  const { data: clientesData } = useClientes({ page: 1, pageSize: 200 });

  const vehiculos = vehiculosData?.data || [];
  const zonas = zonasData?.data || [];
  const branches = ((branchesData as unknown) as Array<{ id: string; nombre: string }>) || [];
  const clientes = clientesData?.data || [];

  const onSubmit = (data: RutaFormInput) => {
    const payload = {
      nombre: data.nombre,
      sucursal_id: data.sucursal_id,
      zona_id: data.zona_id || undefined,
      vehiculo_id: data.vehiculo_id || undefined,
      dia_semana: data.dia_semana ? Number(data.dia_semana) : undefined,
      hora_salida_estimada: data.hora_salida_estimada || undefined,
      notas: data.notas || undefined,
      paradas: data.paradas.map((p, idx) => ({
        cliente_id: p.cliente_id,
        direccion_id: p.direccion_id || undefined,
        tiempo_estimado_minutos: p.tiempo_estimado_minutos,
        notas: p.notas || undefined,
        orden: p.orden || idx + 1,
      })),
    };
    createMutation.mutate(payload, {
      onSuccess: () => {
        router.push("/logistica/rutas");
      },
    });
  };

  const handleAddParada = () => {
    append({
      cliente_id: "",
      direccion_id: "",
      tiempo_estimado_minutos: 15,
      notas: "",
      orden: fields.length + 1,
    });
  };

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".nueva-ruta-header",
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
      );
      gsap.fromTo(
        ".nueva-ruta-form",
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, delay: 0.15, ease: "power3.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="nueva-ruta-header space-y-4">
        <Link
          href="/logistica/rutas"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Rutas
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Route className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nueva Ruta</h1>
            <p className="text-muted-foreground mt-0.5">
              Planifica una nueva ruta de reparto
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="nueva-ruta-form">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Datos de la ruta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-5 sm:grid-cols-2">
                  {/* Nombre */}
                  <FormField
                    control={form.control}
                    name="nombre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ej: Ruta Norte - Lunes"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Sucursal */}
                  <FormField
                    control={form.control}
                    name="sucursal_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sucursal</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar sucursal" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {branches.map((b) => (
                              <SelectItem key={b.id} value={b.id}>
                                {b.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Zona */}
                  <FormField
                    control={form.control}
                    name="zona_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zona</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar zona" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {zonas.map((z) => (
                              <SelectItem key={z.id} value={z.id}>
                                {z.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Vehiculo */}
                  <FormField
                    control={form.control}
                    name="vehiculo_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vehiculo</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar vehiculo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {vehiculos.map((v) => (
                              <SelectItem key={v.id} value={v.id}>
                                {v.marca} {v.modelo} - {v.patente}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Dia de la semana */}
                  <FormField
                    control={form.control}
                    name="dia_semana"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dia de la semana</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar dia" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DIA_SEMANA_OPTIONS.map((d) => (
                              <SelectItem key={d.value} value={d.value}>
                                {d.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Hora salida estimada */}
                  <FormField
                    control={form.control}
                    name="hora_salida_estimada"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora salida estimada</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Notas */}
                <div className="mt-5">
                  <FormField
                    control={form.control}
                    name="notas"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notas</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Notas adicionales para la ruta..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Paradas */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Paradas
                  </CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddParada}
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Agregar parada
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {fields.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <MapPin className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">
                      No hay paradas configuradas
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Agrega paradas para definir el recorrido de la ruta
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {fields.map((field, index) => {
                      const clienteId = form.watch(
                        `paradas.${index}.cliente_id`,
                      );
                      return (
                        <div
                          key={field.id}
                          className="rounded-lg border p-4 space-y-4"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-muted-foreground">
                              Parada #{index + 1}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => remove(index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2">
                            {/* Cliente */}
                            <FormField
                              control={form.control}
                              name={`paradas.${index}.cliente_id`}
                              render={({ field: f }) => (
                                <FormItem>
                                  <FormLabel>Cliente</FormLabel>
                                  <Select
                                    onValueChange={f.onChange}
                                    value={f.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar cliente" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {clientes.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                          {c.nombre}
                                          {c.apellido ? ` ${c.apellido}` : ""}
                                          {c.razon_social
                                            ? ` - ${c.razon_social}`
                                            : ""}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Direccion */}
                            <FormField
                              control={form.control}
                              name={`paradas.${index}.direccion_id`}
                              render={({ field: f }) => (
                                <FormItem>
                                  <FormLabel>Direccion</FormLabel>
                                  <FormControl>
                                    <ParadaDireccionSelect
                                      clienteId={clienteId}
                                      value={f.value}
                                      onChange={f.onChange}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Tiempo estimado */}
                            <FormField
                              control={form.control}
                              name={`paradas.${index}.tiempo_estimado_minutos`}
                              render={({ field: f }) => (
                                <FormItem>
                                  <FormLabel>Tiempo estimado (min)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min={1}
                                      placeholder="15"
                                      {...f}
                                      onChange={(e) =>
                                        f.onChange(
                                          e.target.value
                                            ? Number(e.target.value)
                                            : "",
                                        )
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Orden */}
                            <FormField
                              control={form.control}
                              name={`paradas.${index}.orden`}
                              render={({ field: f }) => (
                                <FormItem>
                                  <FormLabel>Orden</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min={1}
                                      {...f}
                                      onChange={(e) =>
                                        f.onChange(
                                          e.target.value
                                            ? Number(e.target.value)
                                            : "",
                                        )
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Notas parada */}
                          <FormField
                            control={form.control}
                            name={`paradas.${index}.notas`}
                            render={({ field: f }) => (
                              <FormItem>
                                <FormLabel>Notas</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Notas para esta parada..."
                                    {...f}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/logistica/rutas")}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creando..." : "Crear Ruta"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

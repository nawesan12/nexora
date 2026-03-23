"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { visitaClienteSchema, type VisitaClienteInput } from "@pronto/shared/schemas";
import { useCreateVisita } from "@/hooks/queries/use-visitas";
import { useEmpleados } from "@/hooks/queries/use-employees";
import { useClientes } from "@/hooks/queries/use-clients";
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
import { ArrowLeft, MapPin, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NuevaVisitaPage() {
  const router = useRouter();
  const createMutation = useCreateVisita();
  const { data: empleadosData } = useEmpleados({ page: 1, pageSize: 200, rol: "VENDEDOR" });
  const { data: clientesData } = useClientes({ page: 1, pageSize: 200 });
  const empleados = empleadosData?.data || [];
  const clientes = clientesData?.data || [];

  const form = useForm({
    resolver: zodResolver(visitaClienteSchema),
    defaultValues: {
      vendedor_id: "",
      cliente_id: "",
      direccion_id: "",
      fecha: new Date().toISOString().split("T")[0],
      hora_inicio: "",
      resultado: "PENDIENTE",
      notas: "",
    },
  });

  const onSubmit = form.handleSubmit((data: VisitaClienteInput) => {
    createMutation.mutate(data, {
      onSuccess: () => router.push("/ventas/vendedor/visitas"),
    });
  });

  return (
    <div className="space-y-5">
      <div>
        <Link href="/ventas/vendedor/visitas" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground mb-3">
          <ArrowLeft className="h-3.5 w-3.5" />Visitas
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]"><MapPin className="h-5 w-5" /></div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Nueva Visita</h1>
            <p className="text-sm text-muted-foreground">Programar una visita a cliente</p>
          </div>
        </div>
      </div>

      <Card className="max-w-lg border-0 shadow-sm">
        <CardContent className="pt-6">
          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Vendedor y Cliente</h3>
              <Separator className="mt-2 mb-4" />
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Vendedor</Label>
                  <Select value={form.watch("vendedor_id")} onValueChange={(v) => form.setValue("vendedor_id", v)}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar vendedor" /></SelectTrigger>
                    <SelectContent>
                      {empleados.map((e) => (
                        <SelectItem key={e.id} value={e.id}>{e.nombre} {e.apellido}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.vendedor_id && <p className="text-sm text-destructive">{form.formState.errors.vendedor_id.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Select value={form.watch("cliente_id")} onValueChange={(v) => form.setValue("cliente_id", v)}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                    <SelectContent>
                      {clientes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.nombre} {c.apellido || ""}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.cliente_id && <p className="text-sm text-destructive">{form.formState.errors.cliente_id.message}</p>}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground">Fecha y Hora</h3>
              <Separator className="mt-2 mb-4" />
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fecha">Fecha</Label>
                    <Input id="fecha" type="date" {...form.register("fecha")} />
                    {form.formState.errors.fecha && <p className="text-sm text-destructive">{form.formState.errors.fecha.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hora_inicio">Hora de Inicio</Label>
                    <Input id="hora_inicio" type="time" {...form.register("hora_inicio")} />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground">Notas</h3>
              <Separator className="mt-2 mb-4" />
              <div className="space-y-2">
                <Label htmlFor="notas">Observaciones</Label>
                <Textarea id="notas" {...form.register("notas")} placeholder="Notas sobre la visita..." rows={3} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" type="button" asChild><Link href="/ventas/vendedor/visitas">Cancelar</Link></Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar Visita
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { remitoFromPedidoSchema, type RemitoFromPedidoInput } from "@pronto/shared/schemas";
import { useCreateRemito } from "@/hooks/queries/use-remitos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ScrollText, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NuevoRemitoPage() {
  const router = useRouter();
  const createMutation = useCreateRemito();

  const form = useForm<RemitoFromPedidoInput>({
    resolver: zodResolver(remitoFromPedidoSchema),
    defaultValues: {
      pedido_id: "",
      transportista: "",
      patente: "",
      observaciones: "",
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    createMutation.mutate(data, {
      onSuccess: (result) => {
        const id = (result as any)?.id;
        router.push(id ? `/ventas/remitos/${id}` : "/ventas/remitos");
      },
    });
  });

  return (
    <div className="space-y-5">
      <div>
        <Link href="/ventas/remitos" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground mb-3">
          <ArrowLeft className="h-3.5 w-3.5" />
          Remitos
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
            <ScrollText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Nuevo Remito</h1>
            <p className="text-sm text-muted-foreground">Crear remito a partir de un pedido</p>
          </div>
        </div>
      </div>

      <Card className="max-w-lg border-0 shadow-sm">
        <CardContent className="pt-6">
          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Pedido</h3>
              <Separator className="mt-2 mb-4" />
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pedido_id">ID del Pedido</Label>
                  <Input id="pedido_id" {...form.register("pedido_id")} placeholder="UUID del pedido" />
                  {form.formState.errors.pedido_id && <p className="text-sm text-destructive">{form.formState.errors.pedido_id.message}</p>}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground">Transporte</h3>
              <Separator className="mt-2 mb-4" />
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="transportista">Transportista</Label>
                    <Input id="transportista" {...form.register("transportista")} placeholder="Nombre del transportista" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="patente">Patente</Label>
                    <Input id="patente" {...form.register("patente")} placeholder="AB123CD" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="observaciones">Observaciones</Label>
                  <Textarea id="observaciones" {...form.register("observaciones")} placeholder="Notas adicionales..." rows={3} />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" type="button" asChild>
                <Link href="/ventas/remitos">Cancelar</Link>
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear Remito
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

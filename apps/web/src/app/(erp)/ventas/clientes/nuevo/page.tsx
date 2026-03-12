"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCreateCliente } from "@/hooks/queries/use-clients";
import { ClientForm } from "@/components/clients/client-form";
import type { ClienteInput } from "@nexora/shared/schemas";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, UserPlus } from "lucide-react";

export default function NuevoClientePage() {
  const router = useRouter();
  const createMutation = useCreateCliente();

  const handleSubmit = (data: ClienteInput) => {
    createMutation.mutate(data, {
      onSuccess: () => router.push("/ventas/clientes"),
    });
  };

  return (
    <div className="space-y-5">
      {/* Back link */}
      <Link
        href="/ventas/clientes"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a clientes
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <UserPlus className="h-6 w-6 text-primary" />
        </div>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Nuevo Cliente</h1>
          <p className="text-muted-foreground">
            Crea un nuevo cliente en tu cartera
          </p>
        </div>
      </div>

      {/* Form Card */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Datos del cliente</CardTitle>
          <CardDescription>
            Completa los datos del nuevo cliente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClientForm
            onSubmit={handleSubmit}
            isLoading={createMutation.isPending}
            submitLabel="Crear Cliente"
          />
        </CardContent>
      </Card>
    </div>
  );
}

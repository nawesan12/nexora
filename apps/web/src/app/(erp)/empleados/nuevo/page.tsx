"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCreateEmpleado } from "@/hooks/queries/use-employees";
import { EmployeeForm } from "@/components/employees/employee-form";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, UserPlus } from "lucide-react";
import type { EmpleadoInput } from "@nexora/shared/schemas";

export default function NuevoEmpleadoPage() {
  const router = useRouter();
  const createMutation = useCreateEmpleado();

  const handleSubmit = (data: EmpleadoInput) => {
    createMutation.mutate(data, {
      onSuccess: () => router.push("/empleados"),
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/empleados"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Empleados
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Nuevo Empleado
            </h1>
            <p className="text-sm text-muted-foreground">
              Completa los datos para registrar un nuevo empleado
            </p>
          </div>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6">
          <EmployeeForm
            onSubmit={handleSubmit}
            isPending={createMutation.isPending}
            submitLabel="Crear Empleado"
          />
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useContratos,
  useCreateContrato,
  useDeleteContrato,
} from "@/hooks/queries/use-contratos";
import { contratoSchema, type ContratoInput } from "@pronto/shared/schemas";
import type { Contrato } from "@pronto/shared/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Briefcase,
  Calendar,
  DollarSign,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";

interface EmployeeContractsTabProps {
  empleadoId: string;
  canManage: boolean;
}

const TIPO_LABELS: Record<string, string> = {
  RELACION_DEPENDENCIA: "Relacion de Dependencia",
  MONOTRIBUTO: "Monotributo",
  EVENTUAL: "Eventual",
  PASANTE: "Pasante",
};

const TIPO_COLORS: Record<string, string> = {
  RELACION_DEPENDENCIA:
    "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
  MONOTRIBUTO:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  EVENTUAL:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  PASANTE:
    "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400",
};

export function EmployeeContractsTab({
  empleadoId,
  canManage,
}: EmployeeContractsTabProps) {
  const { data, isLoading } = useContratos(empleadoId);
  const createMutation = useCreateContrato();
  const deleteMutation = useDeleteContrato();
  const [dialogOpen, setDialogOpen] = useState(false);

  const contratos: Contrato[] = data?.data ?? [];

  const form = useForm({
    resolver: zodResolver(contratoSchema),
    defaultValues: {
      tipo: "RELACION_DEPENDENCIA",
      salario: undefined,
      fecha_inicio: "",
      fecha_fin: "",
      observaciones: "",
    },
  });

  const onSubmit = (values: ContratoInput) => {
    createMutation.mutate(
      { empleadoId, data: values },
      {
        onSuccess: () => {
          setDialogOpen(false);
          form.reset();
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">Contratos</CardTitle>
        {canManage && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDialogOpen(true)}
            className="hover:border-[var(--accent)]/30 hover:bg-[var(--accent)]/5"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Contrato
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {contratos.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50 mb-3">
              <Briefcase className="h-6 w-6 text-muted-foreground/60" />
            </div>
            <p className="text-sm text-muted-foreground">
              No hay contratos registrados.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {contratos.map((c) => (
              <div
                key={c.id}
                className="flex items-start gap-4 rounded-lg border border-border/50 p-4 transition-colors hover:bg-muted/30"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="secondary"
                      className={`border-0 text-xs font-medium ${TIPO_COLORS[c.tipo] || ""}`}
                    >
                      {TIPO_LABELS[c.tipo] || c.tipo}
                    </Badge>
                    {c.salario != null && c.salario > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <DollarSign className="h-3 w-3" />$
                        {c.salario.toLocaleString("es-AR")}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(c.fecha_inicio).toLocaleDateString("es-AR")}
                    {c.fecha_fin
                      ? ` - ${new Date(c.fecha_fin).toLocaleDateString("es-AR")}`
                      : " - Vigente"}
                  </div>
                  {c.observaciones && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {c.observaciones}
                    </p>
                  )}
                </div>
                {canManage && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar contrato</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta accion no se puede deshacer. El contrato sera
                          eliminado.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() =>
                            deleteMutation.mutate({
                              empleadoId,
                              contratoId: c.id,
                            })
                          }
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Contrato</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de contrato</Label>
              <Select
                value={form.watch("tipo")}
                onValueChange={(v) =>
                  form.setValue("tipo", v as ContratoInput["tipo"])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPO_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.tipo && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.tipo.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="salario">Salario</Label>
              <Input
                id="salario"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...form.register("salario")}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="fecha_inicio">Fecha inicio</Label>
                <Input
                  id="fecha_inicio"
                  type="date"
                  {...form.register("fecha_inicio")}
                />
                {form.formState.errors.fecha_inicio && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.fecha_inicio.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="fecha_fin">Fecha fin</Label>
                <Input
                  id="fecha_fin"
                  type="date"
                  {...form.register("fecha_fin")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observaciones">Descripcion</Label>
              <Textarea
                id="observaciones"
                placeholder="Notas sobre el contrato..."
                rows={3}
                {...form.register("observaciones")}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Crear
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

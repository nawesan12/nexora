"use client";

import { useState, useMemo, useRef, useLayoutEffect } from "react";
import { useAllMovimientosCaja, useCajas, useCreateMovimientoGeneral } from "@/hooks/queries/use-finance";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { MovimientoCajaWithCaja } from "@pronto/shared/types";
import type { ColumnDef } from "@tanstack/react-table";
import {
  DataTable,
  DataTableColumnHeader,
} from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Plus, Banknote } from "lucide-react";
import { EmptyFinance } from "@/components/illustrations";
import gsap from "gsap";

const retiroSchema = z.object({
  caja_id: z.string().uuid("Selecciona una caja"),
  monto: z.coerce.number().positive("El monto debe ser positivo"),
  concepto: z.string().min(3, "El concepto debe tener al menos 3 caracteres"),
});

type RetiroInput = z.infer<typeof retiroSchema>;

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(n);
}

export default function RetirosPage() {
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch EGRESO movements that have referencia_tipo = RETIRO
  // Since the existing API filters by tipo, we filter by EGRESO
  const { data, isLoading } = useAllMovimientosCaja({
    page,
    pageSize: 20,
    tipo: "EGRESO",
  });

  const { data: cajasData } = useCajas({ page: 1, pageSize: 100 });
  const cajas = cajasData?.data || [];

  const createMutation = useCreateMovimientoGeneral();

  // Filter to show only RETIRO-typed movements on the client side
  const allMovimientos = data?.data || [];
  const retiros = allMovimientos.filter(
    (m) => m.referencia_tipo === "RETIRO",
  );
  const meta = data?.meta;

  const form = useForm<RetiroInput>({
    resolver: zodResolver(retiroSchema),
    defaultValues: {
      caja_id: "",
      monto: 0,
      concepto: "",
    },
  });

  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".retiros-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      );
      gsap.fromTo(
        ".retiros-summary",
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.15 },
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const handleSubmit = (values: RetiroInput) => {
    createMutation.mutate(
      {
        caja_id: values.caja_id,
        tipo: "EGRESO",
        monto: values.monto,
        concepto: values.concepto,
        referencia_tipo: "RETIRO",
      },
      {
        onSuccess: () => {
          setDialogOpen(false);
          form.reset();
        },
      },
    );
  };

  const totalRetiros = retiros.reduce((sum, m) => sum + m.monto, 0);

  const columns = useMemo<ColumnDef<MovimientoCajaWithCaja, unknown>[]>(
    () => [
      {
        accessorKey: "created_at",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Fecha" />
        ),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {new Date(
              row.getValue("created_at") as string,
            ).toLocaleDateString("es-AR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        ),
      },
      {
        accessorKey: "caja_nombre",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Caja" />
        ),
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {row.getValue("caja_nombre")}
          </span>
        ),
      },
      {
        accessorKey: "concepto",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Concepto" />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-foreground">
            {row.getValue("concepto")}
          </span>
        ),
        enableHiding: false,
      },
      {
        accessorKey: "monto",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="Monto"
            className="justify-end"
          />
        ),
        cell: ({ row }) => (
          <div className="text-right font-semibold text-red-600 dark:text-red-400">
            -{formatCurrency(row.getValue("monto") as number)}
          </div>
        ),
      },
      {
        id: "tipo_badge",
        header: () => (
          <span className="text-xs font-semibold uppercase tracking-wider">
            Tipo
          </span>
        ),
        cell: () => (
          <Badge
            variant="secondary"
            className="border-0 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
          >
            Retiro
          </Badge>
        ),
        enableSorting: false,
      },
    ],
    [],
  );

  return (
    <div ref={containerRef} className="space-y-5">
      {/* Header */}
      <div className="retiros-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Retiros de Caja
          </h1>
          <p className="text-sm text-muted-foreground">
            Registra y consulta los retiros de efectivo de las cajas
          </p>
        </div>
        <Button className="shadow-sm" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Retiro
        </Button>
      </div>

      {/* Summary Bar */}
      <div className="retiros-summary flex items-center gap-6 rounded-xl border border-border/50 bg-gradient-to-r from-red-500/5 to-transparent px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
            <Banknote className="h-4 w-4" />
          </div>
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              {retiros.length}
            </span>
            {" retiros"}
          </span>
        </div>
        <div className="text-sm text-muted-foreground">
          Total:{" "}
          <span className="font-semibold text-red-600 dark:text-red-400">
            {formatCurrency(totalRetiros)}
          </span>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={retiros}
        page={page}
        pageSize={20}
        totalPages={meta?.totalPages || 1}
        totalItems={retiros.length}
        onPageChange={setPage}
        searchKey="concepto"
        searchPlaceholder="Buscar por concepto..."
        isLoading={isLoading}
        emptyIllustration={<EmptyFinance className="w-full h-full" />}
        emptyMessage="No se encontraron retiros"
        emptyDescription="Registra un retiro de caja para comenzar."
        emptyAction={{
          label: "Nuevo Retiro",
          onClick: () => setDialogOpen(true),
        }}
        toolbarActions={
          <Button
            size="sm"
            className="h-9"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Retiro
          </Button>
        }
      />

      {/* Create Retiro Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Retiro de Caja</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="caja_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Caja</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar caja" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cajas.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.nombre} ({formatCurrency(c.saldo)})
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
                name="monto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="concepto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Concepto</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Motivo del retiro..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Registrando..." : "Registrar Retiro"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

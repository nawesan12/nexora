"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { extractoSchema, type ExtractoInput } from "@pronto/shared/schemas";
import {
  useCreateExtracto,
  useImportMovimientos,
} from "@/hooks/queries/use-reconciliacion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, ArrowLeftRight, Loader2, Upload, X } from "lucide-react";
import Link from "next/link";

interface CsvRow {
  fecha: string;
  descripcion: string;
  monto: number;
  referencia: string;
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  // Detect separator from first line
  const sep = lines[0].includes(";") ? ";" : ",";
  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(sep).map((c) => c.trim().replace(/^"|"$/g, ""));
    if (cols.length < 3) continue;
    const monto = parseFloat(cols[2]?.replace(",", ".") || "0");
    if (isNaN(monto)) continue;
    rows.push({
      fecha: cols[0] || "",
      descripcion: cols[1] || "",
      monto,
      referencia: cols[3] || "",
    });
  }
  return rows;
}

export default function NuevoExtractoPage() {
  const router = useRouter();
  const createMutation = useCreateExtracto();
  const importMutation = useImportMovimientos();

  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [fileName, setFileName] = useState<string>("");

  const form = useForm<ExtractoInput>({
    resolver: zodResolver(extractoSchema),
    defaultValues: {
      entidad_bancaria_id: "",
      fecha_desde: "",
      fecha_hasta: "",
      archivo_nombre: "",
    },
  });

  const handleFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setFileName(file.name);
      form.setValue("archivo_nombre", file.name);

      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        if (text) {
          setCsvRows(parseCsv(text));
        }
      };
      reader.readAsText(file);
    },
    [form],
  );

  const clearCsv = useCallback(() => {
    setCsvRows([]);
    setFileName("");
    form.setValue("archivo_nombre", "");
  }, [form]);

  const isPending = createMutation.isPending || importMutation.isPending;

  const onSubmit = form.handleSubmit(async (data) => {
    const extracto = await createMutation.mutateAsync(data);
    if (csvRows.length > 0 && extracto?.id) {
      await importMutation.mutateAsync({
        id: extracto.id,
        data: {
          movimientos: csvRows.map((r) => ({
            fecha: r.fecha,
            descripcion: r.descripcion,
            monto: r.monto,
            referencia: r.referencia,
          })),
        },
      });
    }
    router.push("/finanzas/reconciliacion");
  });

  function formatCurrency(n: number) {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(n);
  }

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/finanzas/reconciliacion"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Conciliacion
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
            <ArrowLeftRight className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Nuevo Extracto
            </h1>
            <p className="text-sm text-muted-foreground">
              Importar extracto bancario y movimientos desde CSV
            </p>
          </div>
        </div>
      </div>

      <Card className="max-w-2xl border-0 shadow-sm">
        <CardContent className="pt-6">
          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Datos del Extracto
              </h3>
              <Separator className="mt-2 mb-4" />
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="entidad_bancaria_id">
                    ID Entidad Bancaria
                  </Label>
                  <Input
                    id="entidad_bancaria_id"
                    {...form.register("entidad_bancaria_id")}
                    placeholder="UUID de la entidad bancaria"
                  />
                  {form.formState.errors.entidad_bancaria_id && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.entidad_bancaria_id.message}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fecha_desde">Desde</Label>
                    <Input
                      id="fecha_desde"
                      type="date"
                      {...form.register("fecha_desde")}
                    />
                    {form.formState.errors.fecha_desde && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.fecha_desde.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fecha_hasta">Hasta</Label>
                    <Input
                      id="fecha_hasta"
                      type="date"
                      {...form.register("fecha_hasta")}
                    />
                    {form.formState.errors.fecha_hasta && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.fecha_hasta.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Importar CSV
              </h3>
              <Separator className="mt-2 mb-4" />
              <p className="text-xs text-muted-foreground mb-3">
                El archivo debe tener columnas: fecha, descripcion, monto,
                referencia (separadas por coma o punto y coma).
              </p>
              <div className="flex items-center gap-3">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-4 py-3 transition-colors hover:bg-muted/50">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {fileName || "Seleccionar archivo CSV"}
                  </span>
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFile}
                  />
                </label>
                {fileName && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={clearCsv}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {csvRows.length > 0 && (
                <div className="mt-4 rounded-lg border">
                  <div className="px-4 py-2 bg-muted/30">
                    <span className="text-sm font-medium">
                      {csvRows.length} movimientos detectados
                    </span>
                  </div>
                  <div className="max-h-64 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-muted/50">
                          <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Fecha
                          </TableHead>
                          <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Descripcion
                          </TableHead>
                          <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Monto
                          </TableHead>
                          <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Referencia
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {csvRows.map((row, i) => (
                          <TableRow key={i} className="border-muted/30">
                            <TableCell className="text-sm">
                              {row.fecha}
                            </TableCell>
                            <TableCell className="text-sm max-w-[200px] truncate">
                              {row.descripcion}
                            </TableCell>
                            <TableCell
                              className={`text-right text-sm tabular-nums font-medium ${row.monto < 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}
                            >
                              {formatCurrency(row.monto)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {row.referencia || "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" type="button" asChild>
                <Link href="/finanzas/reconciliacion">Cancelar</Link>
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Crear Extracto
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState, useCallback, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { useCreateProducto } from "@/hooks/queries/use-products";
import { useUserStore } from "@/store/user-store";
import { hasPermission } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Upload,
  FileUp,
  X,
  CheckCircle2,
  XCircle,
  Download,
  Loader2,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import gsap from "gsap";

const VALID_UNITS = ["KG", "UNIDAD", "LITRO", "METRO", "CAJA", "BOLSA", "PACK"] as const;
type ValidUnit = (typeof VALID_UNITS)[number];

const EXPECTED_HEADERS = [
  "nombre",
  "codigo",
  "precio_base",
  "unidad",
  "categoria",
  "codigo_barras",
] as const;

interface ParsedRow {
  nombre: string;
  codigo: string;
  precio_base: number;
  unidad: string;
  categoria: string;
  codigo_barras: string;
  errors: string[];
  rowNumber: number;
}

interface ImportResult {
  total: number;
  success: number;
  failed: number;
  errors: { row: number; nombre: string; error: string }[];
}

function parseCsv(text: string): ParsedRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const sep = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0]
    .split(sep)
    .map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());

  const nameIdx = headers.indexOf("nombre");
  const codeIdx = headers.indexOf("codigo");
  const priceIdx = headers.indexOf("precio_base");
  const unitIdx = headers.indexOf("unidad");
  const catIdx = headers.indexOf("categoria");
  const barcodeIdx = headers.indexOf("codigo_barras");

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(sep).map((c) => c.trim().replace(/^"|"$/g, ""));
    const errors: string[] = [];

    const nombre = nameIdx >= 0 ? cols[nameIdx] || "" : "";
    const codigo = codeIdx >= 0 ? cols[codeIdx] || "" : "";
    const precioRaw = priceIdx >= 0 ? cols[priceIdx]?.replace(",", ".") || "0" : "0";
    const precio_base = parseFloat(precioRaw);
    const unidadRaw = unitIdx >= 0 ? cols[unitIdx]?.toUpperCase() || "" : "";
    const categoria = catIdx >= 0 ? cols[catIdx] || "" : "";
    const codigo_barras = barcodeIdx >= 0 ? cols[barcodeIdx] || "" : "";

    if (!nombre || nombre.length < 2) {
      errors.push("Nombre requerido (min 2 caracteres)");
    }
    if (isNaN(precio_base) || precio_base < 0) {
      errors.push("Precio invalido");
    }
    if (!unidadRaw || !VALID_UNITS.includes(unidadRaw as ValidUnit)) {
      errors.push(`Unidad invalida (opciones: ${VALID_UNITS.join(", ")})`);
    }

    rows.push({
      nombre,
      codigo,
      precio_base: isNaN(precio_base) ? 0 : precio_base,
      unidad: unidadRaw,
      categoria,
      codigo_barras,
      errors,
      rowNumber: i + 1,
    });
  }
  return rows;
}

function generateSampleCsv(): string {
  const headers = EXPECTED_HEADERS.join(",");
  const sampleRows = [
    "Harina 000 x 1kg,HAR-001,850.50,KG,,7790001000001",
    "Aceite Girasol x 1.5L,ACE-002,1200,LITRO,,7790002000002",
    "Azucar x 1kg,AZU-003,650,KG,,",
  ];
  return [headers, ...sampleRows].join("\n");
}

function formatARS(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(value);
}

export default function ImportarProductosPage() {
  const user = useUserStore((s) => s.user);
  const permissions = user?.permissions ?? [];
  const canManage = hasPermission(permissions, "products:manage");

  const createMutation = useCreateProducto();

  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".import-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      );
      gsap.fromTo(
        ".import-content",
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.15 },
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const handleFileRead = useCallback((text: string) => {
    const rows = parseCsv(text);
    setParsedRows(rows);
    setImportResult(null);
    setProgress(0);
  }, []);

  const handleExcelUpload = useCallback(async (file: File) => {
    setFileName(file.name);
    setIsImporting(true);
    setProgress(50);
    setParsedRows([]);
    setImportResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "";
      const res = await fetch(`${apiUrl}/api/v1/productos/importar/excel`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error?.message || "Error al importar");
        return;
      }
      setProgress(100);
      setImportResult({
        total: data.data.total,
        success: data.data.success,
        failed: data.data.failed,
        errors: data.data.errors || [],
      });
      toast.success(`${data.data.success} productos importados`);
    } catch {
      toast.error("Error de conexion al importar");
    } finally {
      setIsImporting(false);
    }
  }, []);

  const handleFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.name.endsWith(".xlsx")) {
        handleExcelUpload(file);
        return;
      }

      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        if (text) handleFileRead(text);
      };
      reader.readAsText(file);
    },
    [handleFileRead, handleExcelUpload],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (!file) return;
      if (!file.name.endsWith(".csv") && !file.name.endsWith(".xlsx")) {
        toast.error("Solo se aceptan archivos CSV o Excel (.xlsx)");
        return;
      }
      if (file.name.endsWith(".xlsx")) {
        handleExcelUpload(file);
        return;
      }
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        if (text) handleFileRead(text);
      };
      reader.readAsText(file);
    },
    [handleFileRead, handleExcelUpload],
  );

  const clearFile = useCallback(() => {
    setParsedRows([]);
    setFileName("");
    setImportResult(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const validRows = parsedRows.filter((r) => r.errors.length === 0);
  const invalidRows = parsedRows.filter((r) => r.errors.length > 0);

  const handleImport = async () => {
    if (validRows.length === 0) return;
    setIsImporting(true);
    setProgress(0);

    const result: ImportResult = {
      total: validRows.length,
      success: 0,
      failed: 0,
      errors: [],
    };

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      try {
        await createMutation.mutateAsync({
          nombre: row.nombre,
          codigo: row.codigo || undefined,
          codigo_barras: row.codigo_barras || undefined,
          precio_base: row.precio_base,
          unidad: row.unidad as ValidUnit,
          categoria_id: undefined,
        });
        result.success++;
      } catch (err) {
        result.failed++;
        result.errors.push({
          row: row.rowNumber,
          nombre: row.nombre,
          error: err instanceof Error ? err.message : "Error desconocido",
        });
      }
      setProgress(Math.round(((i + 1) / validRows.length) * 100));
    }

    setImportResult(result);
    setIsImporting(false);

    if (result.failed === 0) {
      toast.success(`${result.success} productos importados exitosamente`);
    } else {
      toast.warning(
        `${result.success} importados, ${result.failed} con errores`,
      );
    }
  };

  const handleDownloadTemplate = () => {
    const csv = generateSampleCsv();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla_productos.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!canManage) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No tienes permisos para importar productos.
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-5">
      {/* Header */}
      <div className="import-header">
        <Link
          href="/inventario/productos"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Productos
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
            <FileUp className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Importar Productos
            </h1>
            <p className="text-sm text-muted-foreground">
              Carga masiva de productos desde archivo CSV
            </p>
          </div>
        </div>
      </div>

      <div className="import-content space-y-5">
        {/* Template download + info */}
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">
                  Formato esperado
                </h3>
                <p className="text-xs text-muted-foreground">
                  Columnas: <span className="font-mono">nombre</span>,{" "}
                  <span className="font-mono">codigo</span>,{" "}
                  <span className="font-mono">precio_base</span>,{" "}
                  <span className="font-mono">unidad</span>,{" "}
                  <span className="font-mono">categoria</span> (opcional),{" "}
                  <span className="font-mono">codigo_barras</span> (opcional).
                  Separador: coma o punto y coma.
                </p>
                <p className="text-xs text-muted-foreground">
                  Unidades validas:{" "}
                  {VALID_UNITS.map((u) => (
                    <Badge
                      key={u}
                      variant="secondary"
                      className="mr-1 text-[10px] px-1.5 py-0"
                    >
                      {u}
                    </Badge>
                  ))}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Plantilla CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "";
                  window.open(`${apiUrl}/api/v1/productos/importar/template`, "_blank");
                }}
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Plantilla Excel
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* File upload area */}
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            {!fileName ? (
              <label
                className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 transition-colors ${
                  isDragOver
                    ? "border-[var(--accent)] bg-[var(--accent)]/5"
                    : "border-border hover:border-[var(--accent)]/50 hover:bg-muted/30"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)]">
                  <Upload className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    Arrastra tu archivo CSV o Excel aqui
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    o haz clic para seleccionar
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx"
                  className="hidden"
                  onChange={handleFile}
                />
              </label>
            ) : (
              <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
                    <Package className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {fileName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {parsedRows.length} filas detectadas
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={clearFile}
                  disabled={isImporting}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Validation summary */}
        {parsedRows.length > 0 && !importResult && (
          <div className="flex items-center gap-4 rounded-xl border border-border/50 bg-gradient-to-r from-[var(--accent)]/5 to-transparent px-5 py-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="text-sm text-foreground">
                <span className="font-semibold">{validRows.length}</span> filas
                validas
              </span>
            </div>
            {invalidRows.length > 0 && (
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-foreground">
                  <span className="font-semibold">{invalidRows.length}</span>{" "}
                  con errores
                </span>
              </div>
            )}
          </div>
        )}

        {/* Preview table */}
        {parsedRows.length > 0 && !importResult && (
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Vista previa
              </h3>
              <div className="max-h-96 overflow-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="border-muted/50">
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground w-12">
                        #
                      </TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Estado
                      </TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Nombre
                      </TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Codigo
                      </TableHead>
                      <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Precio
                      </TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Unidad
                      </TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Cod. Barras
                      </TableHead>
                      <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Errores
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedRows.map((row, i) => {
                      const isValid = row.errors.length === 0;
                      return (
                        <TableRow
                          key={i}
                          className={
                            isValid
                              ? "border-muted/30"
                              : "border-muted/30 bg-red-50/50 dark:bg-red-950/10"
                          }
                        >
                          <TableCell className="text-xs text-muted-foreground tabular-nums">
                            {row.rowNumber}
                          </TableCell>
                          <TableCell>
                            {isValid ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {row.nombre || (
                              <span className="text-muted-foreground/50">
                                --
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {row.codigo ? (
                              <Badge
                                variant="outline"
                                className="font-mono text-xs border-[var(--accent)]/30 text-[var(--accent)]"
                              >
                                {row.codigo}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground/50">
                                --
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-sm tabular-nums font-medium">
                            {formatARS(row.precio_base)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={
                                VALID_UNITS.includes(row.unidad as ValidUnit)
                                  ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                                  : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                              }
                            >
                              {row.unidad || "?"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground font-mono">
                            {row.codigo_barras || "--"}
                          </TableCell>
                          <TableCell className="text-xs text-red-600 dark:text-red-400 max-w-[200px]">
                            {row.errors.join("; ")}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress during import */}
        {isImporting && (
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Importando...</span>
                  <span className="font-medium tabular-nums">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Import result */}
        {importResult && (
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">
                Resultado de la importacion
              </h3>
              <div className="grid gap-4 sm:grid-cols-3 mb-4">
                <div className="rounded-lg border border-border/50 bg-muted/30 p-4 text-center">
                  <p className="text-2xl font-bold text-foreground tabular-nums">
                    {importResult.total}
                  </p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="rounded-lg border border-emerald-200 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-950/10 p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {importResult.success}
                  </p>
                  <p className="text-xs text-muted-foreground">Exitosos</p>
                </div>
                <div className="rounded-lg border border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/10 p-4 text-center">
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400 tabular-nums">
                    {importResult.failed}
                  </p>
                  <p className="text-xs text-muted-foreground">Fallidos</p>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="rounded-lg border border-red-200 dark:border-red-900/30">
                  <div className="px-4 py-2 bg-red-50/50 dark:bg-red-950/10">
                    <span className="text-sm font-medium text-red-700 dark:text-red-400">
                      Errores de importacion
                    </span>
                  </div>
                  <div className="max-h-48 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Fila</TableHead>
                          <TableHead className="text-xs">Producto</TableHead>
                          <TableHead className="text-xs">Error</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {importResult.errors.map((err, i) => (
                          <TableRow key={i} className="border-muted/30">
                            <TableCell className="text-xs tabular-nums">
                              {err.row}
                            </TableCell>
                            <TableCell className="text-sm">
                              {err.nombre}
                            </TableCell>
                            <TableCell className="text-xs text-red-600 dark:text-red-400">
                              {err.error}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Action buttons */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" asChild>
            <Link href="/inventario/productos">Cancelar</Link>
          </Button>
          {!importResult ? (
            <Button
              onClick={handleImport}
              disabled={validRows.length === 0 || isImporting}
            >
              {isImporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {isImporting
                ? "Importando..."
                : `Importar ${validRows.length} productos`}
            </Button>
          ) : (
            <Button onClick={clearFile}>Nueva importacion</Button>
          )}
        </div>
      </div>
    </div>
  );
}

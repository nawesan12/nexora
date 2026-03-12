"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  useCaja,
  useMovimientosByCaja,
  useArqueosByCaja,
  useCreateMovimiento,
  useCreateArqueo,
} from "@/hooks/queries/use-finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Plus,
  Loader2,
  Wallet,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(n);
}

export default function CajaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: cajaData, isLoading: cajaLoading } = useCaja(id);

  const [activeTab, setActiveTab] = useState<"movimientos" | "arqueos">(
    "movimientos",
  );
  const [movPage, setMovPage] = useState(1);
  const [arqPage, setArqPage] = useState(1);

  const { data: movData } = useMovimientosByCaja({
    cajaId: id,
    page: movPage,
    pageSize: 20,
  });
  const { data: arqData } = useArqueosByCaja({
    cajaId: id,
    page: arqPage,
    pageSize: 20,
  });

  const createMovimiento = useCreateMovimiento();
  const createArqueo = useCreateArqueo();

  const [movOpen, setMovOpen] = useState(false);
  const [movForm, setMovForm] = useState({
    tipo: "INGRESO",
    monto: "",
    descripcion: "",
    metodo_pago: "",
  });

  const caja = cajaData;
  const movimientos = movData?.data || [];
  const movMeta = movData?.meta;
  const arqueos = arqData?.data || [];
  const arqMeta = arqData?.meta;

  if (cajaLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Cargando caja...</span>
      </div>
    );
  }

  if (!caja) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        Caja no encontrada
      </div>
    );
  }

  const handleCreateMovimiento = () => {
    createMovimiento.mutate(
      {
        cajaId: id,
        data: {
          tipo: movForm.tipo as any,
          monto: parseFloat(movForm.monto),
          descripcion: movForm.descripcion,
          metodo_pago: movForm.metodo_pago || undefined,
        } as any,
      },
      {
        onSuccess: () => {
          setMovOpen(false);
          setMovForm({ tipo: "INGRESO", monto: "", descripcion: "", metodo_pago: "" });
        },
      },
    );
  };

  return (
    <div className="space-y-5">
      <Link
        href="/finanzas/cajas"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Cajas
      </Link>

      {/* Header card */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--accent)]" />
        <CardContent className="flex items-center gap-4 py-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
            <Wallet className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {caja.nombre}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <Badge
                variant="secondary"
                className={cn(
                  "border-0 text-xs font-medium",
                  caja.tipo === "EFECTIVO"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                    : "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
                )}
              >
                {caja.tipo === "EFECTIVO" ? "Efectivo" : "Banco"}
              </Badge>
              <span className="text-lg font-bold text-foreground">
                {formatCurrency(caja.saldo)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border/50">
        <button
          onClick={() => setActiveTab("movimientos")}
          className={cn(
            "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
            activeTab === "movimientos"
              ? "border-[var(--accent)] text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          Movimientos
        </button>
        <button
          onClick={() => setActiveTab("arqueos")}
          className={cn(
            "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
            activeTab === "arqueos"
              ? "border-[var(--accent)] text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          Arqueos
        </button>
      </div>

      {activeTab === "movimientos" && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Movimientos</CardTitle>
            <Dialog open={movOpen} onOpenChange={setMovOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Movimiento
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nuevo Movimiento</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                      value={movForm.tipo}
                      onValueChange={(v) =>
                        setMovForm((f) => ({ ...f, tipo: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INGRESO">Ingreso</SelectItem>
                        <SelectItem value="EGRESO">Egreso</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Monto</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={movForm.monto}
                      onChange={(e) =>
                        setMovForm((f) => ({ ...f, monto: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descripción</Label>
                    <Input
                      value={movForm.descripcion}
                      onChange={(e) =>
                        setMovForm((f) => ({
                          ...f,
                          descripcion: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Método de Pago (opcional)</Label>
                    <Input
                      value={movForm.metodo_pago}
                      onChange={(e) =>
                        setMovForm((f) => ({
                          ...f,
                          metodo_pago: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <Button
                    onClick={handleCreateMovimiento}
                    disabled={createMovimiento.isPending}
                    className="w-full"
                  >
                    {createMovimiento.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Registrar Movimiento
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimientos.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground py-8"
                    >
                      Sin movimientos
                    </TableCell>
                  </TableRow>
                ) : (
                  movimientos.map((m: any) => (
                    <TableRow key={m.id}>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "border-0 text-xs font-medium",
                            m.tipo === "INGRESO"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                              : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
                          )}
                        >
                          <span className="flex items-center gap-1">
                            {m.tipo === "INGRESO" ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {m.tipo}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>{m.descripcion}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(m.monto)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(m.created_at).toLocaleDateString("es-AR")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {movMeta && movMeta.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Página <span className="font-medium text-foreground">{movMeta.page}</span> de{" "}
                  <span className="font-medium text-foreground">{movMeta.totalPages}</span>
                </p>
                <div className="flex gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    disabled={movPage <= 1}
                    onClick={() => setMovPage((p) => p - 1)}
                  >
                    <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    disabled={movPage >= movMeta.totalPages}
                    onClick={() => setMovPage((p) => p + 1)}
                  >
                    Siguiente
                    <ChevronRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "arqueos" && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Arqueos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Saldo Sistema</TableHead>
                  <TableHead className="text-right">Saldo Físico</TableHead>
                  <TableHead className="text-right">Diferencia</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {arqueos.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground py-8"
                    >
                      Sin arqueos
                    </TableCell>
                  </TableRow>
                ) : (
                  arqueos.map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell className="text-muted-foreground">
                        {new Date(a.created_at).toLocaleDateString("es-AR")}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(a.saldo_sistema)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(a.saldo_fisico)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(a.diferencia)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="border-0 text-xs">
                          {a.estado}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {arqMeta && arqMeta.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Página <span className="font-medium text-foreground">{arqMeta.page}</span> de{" "}
                  <span className="font-medium text-foreground">{arqMeta.totalPages}</span>
                </p>
                <div className="flex gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    disabled={arqPage <= 1}
                    onClick={() => setArqPage((p) => p - 1)}
                  >
                    <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    disabled={arqPage >= arqMeta.totalPages}
                    onClick={() => setArqPage((p) => p + 1)}
                  >
                    Siguiente
                    <ChevronRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

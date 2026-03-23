"use client";

import { useState, useRef, useLayoutEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  usePrograma,
  useUpsertPrograma,
  useClientePuntos,
  useLoyaltyMovimientos,
  useAcumularPuntos,
  useCanjearPuntos,
} from "@/hooks/queries/use-loyalty";
import {
  programaFidelidadSchema,
  acumularPuntosSchema,
  canjearPuntosSchema,
  type ProgramaFidelidadInput,
  type AcumularPuntosInput,
  type CanjearPuntosInput,
} from "@pronto/shared/schemas";
import type { PuntosCliente } from "@pronto/shared/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Star,
  Settings,
  Search,
  Plus,
  Minus,
  ArrowUpDown,
  Gift,
  Coins,
} from "lucide-react";
import gsap from "gsap";

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function tipoBadgeVariant(tipo: string): "default" | "secondary" | "destructive" | "outline" {
  switch (tipo) {
    case "ACUMULACION":
      return "default";
    case "CANJE":
      return "destructive";
    case "AJUSTE":
      return "secondary";
    case "VENCIMIENTO":
      return "outline";
    default:
      return "secondary";
  }
}

export default function FidelidadPage() {
  const { data: programa, isLoading: loadingPrograma } = usePrograma();
  const upsertMutation = useUpsertPrograma();

  const [clienteId, setClienteId] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [showAcumular, setShowAcumular] = useState(false);
  const [showCanjear, setShowCanjear] = useState(false);

  const { data: puntos, isLoading: loadingPuntos } = useClientePuntos(clienteId);
  const { data: movimientos, isLoading: loadingMov } = useLoyaltyMovimientos({ clienteId, page });
  const acumularMutation = useAcumularPuntos();
  const canjearMutation = useCanjearPuntos();

  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, stagger: 0.05, duration: 0.4, ease: "power2.out" },
      );
    }
  }, []);

  const programaForm = useForm<ProgramaFidelidadInput>({
    resolver: zodResolver(programaFidelidadSchema),
    defaultValues: {
      nombre: programa?.nombre || "Programa de Fidelidad",
      puntos_por_peso: programa?.puntos_por_peso || 1,
      valor_punto: programa?.valor_punto || 0.01,
      minimo_canje: programa?.minimo_canje || 100,
      activo: programa?.activo ?? true,
    },
    values: programa
      ? {
          nombre: programa.nombre,
          puntos_por_peso: programa.puntos_por_peso,
          valor_punto: programa.valor_punto,
          minimo_canje: programa.minimo_canje,
          activo: programa.activo,
        }
      : undefined,
  });

  const acumularForm = useForm<AcumularPuntosInput>({
    resolver: zodResolver(acumularPuntosSchema),
    defaultValues: { puntos: 0, referencia_id: "", referencia_tipo: "", descripcion: "" },
  });

  const canjearForm = useForm<CanjearPuntosInput>({
    resolver: zodResolver(canjearPuntosSchema),
    defaultValues: { puntos: 0, descripcion: "" },
  });

  function onSavePrograma(data: ProgramaFidelidadInput) {
    upsertMutation.mutate(data);
  }

  function onSearchCliente() {
    if (searchInput.trim()) {
      setClienteId(searchInput.trim());
      setPage(1);
    }
  }

  function onAcumular(data: AcumularPuntosInput) {
    acumularMutation.mutate(
      { clienteId, data },
      {
        onSuccess: () => {
          setShowAcumular(false);
          acumularForm.reset();
        },
      },
    );
  }

  function onCanjear(data: CanjearPuntosInput) {
    canjearMutation.mutate(
      { clienteId, data },
      {
        onSuccess: () => {
          setShowCanjear(false);
          canjearForm.reset();
        },
      },
    );
  }

  return (
    <div className="space-y-6" ref={containerRef}>
      <div className="flex items-center gap-3">
        <Star className="h-7 w-7 text-amber-500" />
        <h1 className="text-2xl font-bold">Programa de Fidelidad</h1>
      </div>

      {/* Program Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuracion del Programa
          </CardTitle>
          <CardDescription>
            Define como se acumulan y canjean los puntos para tus clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingPrograma ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <form onSubmit={programaForm.handleSubmit(onSavePrograma)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre del Programa</Label>
                  <Input id="nombre" {...programaForm.register("nombre")} />
                  {programaForm.formState.errors.nombre && (
                    <p className="text-sm text-destructive">{programaForm.formState.errors.nombre.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="puntos_por_peso">Puntos por $1</Label>
                  <Input id="puntos_por_peso" type="number" step="0.01" {...programaForm.register("puntos_por_peso")} />
                  {programaForm.formState.errors.puntos_por_peso && (
                    <p className="text-sm text-destructive">{programaForm.formState.errors.puntos_por_peso.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valor_punto">Valor de cada punto ($)</Label>
                  <Input id="valor_punto" type="number" step="0.001" {...programaForm.register("valor_punto")} />
                  {programaForm.formState.errors.valor_punto && (
                    <p className="text-sm text-destructive">{programaForm.formState.errors.valor_punto.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimo_canje">Minimo para canje</Label>
                  <Input id="minimo_canje" type="number" {...programaForm.register("minimo_canje")} />
                  {programaForm.formState.errors.minimo_canje && (
                    <p className="text-sm text-destructive">{programaForm.formState.errors.minimo_canje.message}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={programaForm.watch("activo")}
                    onCheckedChange={(v) => programaForm.setValue("activo", v)}
                  />
                  <Label>Programa activo</Label>
                </div>
                <Button type="submit" disabled={upsertMutation.isPending}>
                  {upsertMutation.isPending ? "Guardando..." : "Guardar Programa"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Client Points Lookup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Consulta de Puntos por Cliente
          </CardTitle>
          <CardDescription>
            Ingresa el ID del cliente para ver su saldo de puntos y movimientos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="ID del cliente (UUID)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSearchCliente()}
            />
            <Button onClick={onSearchCliente} variant="secondary">
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </div>

          {clienteId && (
            <>
              {loadingPuntos ? (
                <Skeleton className="h-24" />
              ) : puntos ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-sm text-muted-foreground">Cliente</div>
                      <div className="text-lg font-semibold">{puntos.cliente_nombre}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-sm text-muted-foreground">Saldo Actual</div>
                      <div className="text-2xl font-bold text-primary">{puntos.saldo_actual}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-sm text-muted-foreground">Total Acumulado</div>
                      <div className="text-lg font-semibold text-green-600">+{puntos.total_acumulado}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-sm text-muted-foreground">Total Canjeado</div>
                      <div className="text-lg font-semibold text-red-600">-{puntos.total_canjeado}</div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <p className="text-muted-foreground">No se encontraron datos para este cliente.</p>
              )}

              {puntos && (
                <div className="flex gap-2">
                  <Dialog open={showAcumular} onOpenChange={setShowAcumular}>
                    <DialogTrigger asChild>
                      <Button variant="default" size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Acumular Puntos
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Acumular Puntos</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={acumularForm.handleSubmit(onAcumular)} className="space-y-4">
                        <div className="space-y-2">
                          <Label>Puntos a acumular</Label>
                          <Input type="number" {...acumularForm.register("puntos")} />
                          {acumularForm.formState.errors.puntos && (
                            <p className="text-sm text-destructive">{acumularForm.formState.errors.puntos.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Descripcion</Label>
                          <Input {...acumularForm.register("descripcion")} placeholder="Ej: Compra #1234" />
                        </div>
                        <div className="space-y-2">
                          <Label>Referencia (ID de pedido, etc.)</Label>
                          <Input {...acumularForm.register("referencia_id")} placeholder="UUID opcional" />
                        </div>
                        <Button type="submit" className="w-full" disabled={acumularMutation.isPending}>
                          {acumularMutation.isPending ? "Acumulando..." : "Acumular"}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={showCanjear} onOpenChange={setShowCanjear}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Gift className="h-4 w-4 mr-1" />
                        Canjear Puntos
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Canjear Puntos</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={canjearForm.handleSubmit(onCanjear)} className="space-y-4">
                        <div className="space-y-2">
                          <Label>Puntos a canjear</Label>
                          <Input type="number" {...canjearForm.register("puntos")} />
                          {canjearForm.formState.errors.puntos && (
                            <p className="text-sm text-destructive">{canjearForm.formState.errors.puntos.message}</p>
                          )}
                          {programa && (
                            <p className="text-xs text-muted-foreground">
                              Minimo: {programa.minimo_canje} puntos | Saldo: {puntos.saldo_actual}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Descripcion</Label>
                          <Input {...canjearForm.register("descripcion")} placeholder="Ej: Descuento en compra" />
                        </div>
                        <Button type="submit" className="w-full" disabled={canjearMutation.isPending}>
                          {canjearMutation.isPending ? "Canjeando..." : "Canjear"}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              )}

              {/* Movements Table */}
              {clienteId && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <ArrowUpDown className="h-5 w-5" />
                    Movimientos de Puntos
                  </h3>
                  {loadingMov ? (
                    <Skeleton className="h-48" />
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead className="text-right">Puntos</TableHead>
                            <TableHead className="text-right">Saldo</TableHead>
                            <TableHead>Descripcion</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(!movimientos?.data || movimientos.data.length === 0) ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-muted-foreground">
                                Sin movimientos
                              </TableCell>
                            </TableRow>
                          ) : (
                            movimientos.data.map((m: PuntosCliente) => (
                              <TableRow key={m.id}>
                                <TableCell className="text-sm">{formatDate(m.created_at)}</TableCell>
                                <TableCell>
                                  <Badge variant={tipoBadgeVariant(m.tipo)}>{m.tipo}</Badge>
                                </TableCell>
                                <TableCell className={`text-right font-medium ${m.puntos > 0 ? "text-green-600" : "text-red-600"}`}>
                                  {m.puntos > 0 ? "+" : ""}{m.puntos}
                                </TableCell>
                                <TableCell className="text-right">{m.saldo_nuevo}</TableCell>
                                <TableCell className="text-muted-foreground">{m.descripcion || "-"}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                      {movimientos?.meta && movimientos.meta.totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                          >
                            Anterior
                          </Button>
                          <span className="text-sm text-muted-foreground py-2">
                            Pagina {page} de {movimientos.meta.totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= movimientos.meta.totalPages}
                            onClick={() => setPage((p) => p + 1)}
                          >
                            Siguiente
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

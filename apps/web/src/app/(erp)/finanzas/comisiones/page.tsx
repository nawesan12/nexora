"use client";

import { useState } from "react";
import {
  useConfiguracionComisiones,
  useCreateConfiguracionComision,
  useDeleteConfiguracionComision,
  useComisionesVendedor,
} from "@/hooks/queries/use-finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Search, ChevronLeft, ChevronRight, Percent } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { EmptyCommissions } from "@/components/illustrations";
import { cn } from "@/lib/utils";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(n);
}

export default function ComisionesPage() {
  const [activeTab, setActiveTab] = useState<"config" | "vendedores">(
    "config",
  );
  const [configPage, setConfigPage] = useState(1);
  const [comPage, setComPage] = useState(1);
  const [empleadoFilter, setEmpleadoFilter] = useState("");

  const { data: configData, isLoading: configLoading } =
    useConfiguracionComisiones({ page: configPage, pageSize: 20 });
  const { data: comData, isLoading: comLoading } = useComisionesVendedor({
    page: comPage,
    pageSize: 20,
    empleadoId: empleadoFilter || undefined,
  });

  const createConfig = useCreateConfiguracionComision();
  const deleteConfig = useDeleteConfiguracionComision();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [configDialog, setConfigDialog] = useState(false);
  const [configForm, setConfigForm] = useState({
    nombre: "",
    porcentaje: "",
    tipo: "PORCENTAJE",
  });

  const configs = configData?.data || [];
  const configMeta = configData?.meta;
  const comisiones = comData?.data || [];
  const comMeta = comData?.meta;

  const handleCreateConfig = () => {
    createConfig.mutate(
      {
        nombre: configForm.nombre,
        porcentaje: parseFloat(configForm.porcentaje),
        tipo: configForm.tipo,
      } as any,
      {
        onSuccess: () => {
          setConfigDialog(false);
          setConfigForm({ nombre: "", porcentaje: "", tipo: "PORCENTAJE" });
        },
      },
    );
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Comisiones
        </h1>
        <p className="text-sm text-muted-foreground">
          Configura esquemas y consulta comisiones de vendedores
        </p>
      </div>

      <div className="flex gap-2 border-b border-border/50">
        <button
          onClick={() => setActiveTab("config")}
          className={cn(
            "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
            activeTab === "config"
              ? "border-[var(--accent)] text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          Configuración
        </button>
        <button
          onClick={() => setActiveTab("vendedores")}
          className={cn(
            "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
            activeTab === "vendedores"
              ? "border-[var(--accent)] text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          Comisiones de Vendedores
        </button>
      </div>

      {activeTab === "config" && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">
                Configuración de Comisiones
              </CardTitle>
              <CardDescription>
                Define los esquemas de comisiones para vendedores
              </CardDescription>
            </div>
            <Dialog open={configDialog} onOpenChange={setConfigDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Configuración
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nueva Configuración de Comisión</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nombre</Label>
                    <Input
                      value={configForm.nombre}
                      onChange={(e) =>
                        setConfigForm((f) => ({
                          ...f,
                          nombre: e.target.value,
                        }))
                      }
                      placeholder="Ej: Comisión estándar"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Porcentaje</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={configForm.porcentaje}
                      onChange={(e) =>
                        setConfigForm((f) => ({
                          ...f,
                          porcentaje: e.target.value,
                        }))
                      }
                      placeholder="Ej: 5.00"
                    />
                  </div>
                  <Button
                    onClick={handleCreateConfig}
                    disabled={createConfig.isPending}
                    className="w-full"
                  >
                    {createConfig.isPending ? "Creando..." : "Crear"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Porcentaje</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="w-20">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
                        Cargando...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : configs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <EmptyState
                        illustration={<EmptyCommissions className="w-full h-full" />}
                        title="No hay configuraciones"
                        size="sm"
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  configs.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.nombre}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="border-0 bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400"
                        >
                          {c.porcentaje}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="border-0 text-xs">
                          {c.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setDeleteId(c.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {configMeta && configMeta.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Página <span className="font-medium text-foreground">{configMeta.page}</span> de{" "}
                  <span className="font-medium text-foreground">{configMeta.totalPages}</span>
                </p>
                <div className="flex gap-1.5">
                  <Button variant="outline" size="sm" className="h-8" disabled={configPage <= 1} onClick={() => setConfigPage((p) => p - 1)}>
                    <ChevronLeft className="mr-1 h-3.5 w-3.5" />Anterior
                  </Button>
                  <Button variant="outline" size="sm" className="h-8" disabled={configPage >= configMeta.totalPages} onClick={() => setConfigPage((p) => p + 1)}>
                    Siguiente<ChevronRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "vendedores" && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Comisiones de Vendedores
            </CardTitle>
            <div className="relative mt-2 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Filtrar por ID de empleado..."
                value={empleadoFilter}
                onChange={(e) => {
                  setEmpleadoFilter(e.target.value);
                  setComPage(1);
                }}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado ID</TableHead>
                  <TableHead>Pedido ID</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
                        Cargando...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : comisiones.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <EmptyState
                        illustration={<EmptyCommissions className="w-full h-full" />}
                        title="No hay comisiones registradas"
                        size="sm"
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  comisiones.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">{c.empleado_id}</TableCell>
                      <TableCell className="font-mono text-xs">{c.pedido_id}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(c.monto)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString("es-AR")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {comMeta && comMeta.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Página <span className="font-medium text-foreground">{comMeta.page}</span> de{" "}
                  <span className="font-medium text-foreground">{comMeta.totalPages}</span>
                </p>
                <div className="flex gap-1.5">
                  <Button variant="outline" size="sm" className="h-8" disabled={comPage <= 1} onClick={() => setComPage((p) => p - 1)}>
                    <ChevronLeft className="mr-1 h-3.5 w-3.5" />Anterior
                  </Button>
                  <Button variant="outline" size="sm" className="h-8" disabled={comPage >= comMeta.totalPages} onClick={() => setComPage((p) => p + 1)}>
                    Siguiente<ChevronRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar configuración</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  deleteConfig.mutate(deleteId);
                  setDeleteId(null);
                }
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
